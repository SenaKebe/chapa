import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/auth/prisma/prisma.service';
import { ChapaService } from 'src/payments/chapa/chapa.service';
import { OrderStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

function generateTxRef() {
  return 'tx_' + uuidv4();
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private chapaService: ChapaService,
  ) {}

  async createOrderFromCart(buyerId: string) {
    const [user, cartItems] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: buyerId },
        select: { email: true },
      }),
      this.prisma.cartItem.findMany({
        where: { buyerId },
        include: { product: true },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (cartItems.length === 0) throw new Error('Cart is empty');
    if (!user.email) throw new Error('User email not found');

    const tx_ref = generateTxRef();

    // Step 1: Create the order inside a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          buyerId,
          tx_ref,
          paymentId: 'temp_' + uuidv4(),
          totalAmount: cartItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0,
          ),
          status: OrderStatus.PENDING,
          items: {
            create: cartItems.map((item) => ({
              product: { connect: { id: item.productId } },
              quantity: item.quantity,
              priceAtOrder: item.product.price,
            })),
          },
        },
      });

      await Promise.all(
        cartItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          }),
        ),
      );

      await tx.cartItem.deleteMany({ where: { buyerId } });

      return createdOrder;
    });

    // Step 2: Initiate payment outside transaction
    const payment = await this.chapaService.initiatePayment({
      amount: order.totalAmount,
      email: user.email,
      orderId: order.id.toString(),
    });

    if (!payment?.checkout_url) {
      throw new Error('Payment initialization failed, missing checkout_url');
    }

    // Step 3: Update order with payment URL
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentUrl: payment.checkout_url,
        currency: 'ETB',
      },
    });

    return {
      orderId: order.id,
      paymentUrl: payment.checkout_url,
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async getOrdersByBuyerId(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyPaymentStatus(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { tx_ref: true, id: true },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (!order.tx_ref) throw new Error('Transaction reference missing');

      const verification = await this.chapaService.verifyPayment(order.tx_ref);
      if (!verification) throw new Error('Verification failed');

      let newStatus: OrderStatus;
      switch (verification.status.toLowerCase()) {
        case 'success':
          newStatus = OrderStatus.PAID;
          break;
        case 'failed':
          newStatus = OrderStatus.CANCELLED;
          break;
        default:
          newStatus = OrderStatus.PENDING;
      }

      await this.updatePaymentStatus(order.id, newStatus);
      return { status: newStatus };
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error('Payment verification failed');
    }
  }

  async handleChapaWebhook(payload: any) {
    let { tx_ref, status } = payload;
    console.log('Received Chapa webhook:', { tx_ref, status });

    if (!tx_ref || !status) {
      throw new Error('Invalid webhook payload');
    }

    const order = await this.prisma.order.findFirst({
      where: { tx_ref },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (process.env.NODE_ENV === 'test') {
      const verification = await this.chapaService.verifyPayment(tx_ref);
      if (!verification) throw new Error('Payment verification failed');
      status = verification.status;
    }

    const normalizedStatus = status.toLowerCase();

    let newStatus: OrderStatus;
    switch (normalizedStatus) {
      case 'success':
        newStatus = OrderStatus.PAID;
        break;
      case 'failed':
        newStatus = OrderStatus.CANCELLED;
        break;
      default:
        newStatus = OrderStatus.PENDING;
    }

    await this.updatePaymentStatus(order.id, newStatus);

    return { received: true, orderId: order.id, status: newStatus };
  }

  async verifyWebhookSignature(
    payload: any,
    signature: string,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      console.warn('⚠️ Skipping webhook signature verification (TEST MODE)');
      return true;
    }

    if (!process.env.CHAPA_WEBHOOK_SECRET) {
      throw new Error('CHAPA_WEBHOOK_SECRET is not configured');
    }

    try {
      const computedSignature = crypto
        .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      return (
        signature === computedSignature ||
        signature === `sha256=${computedSignature}`
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  async updatePaymentStatus(orderId: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
