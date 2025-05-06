import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PrismaService } from 'src/auth/prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-request.interface';
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCart(dto: AddToCartDto & { buyerId: string }) {
    const { buyerId, productId, quantity } = dto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, quantity: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingItem = await this.prisma.cartItem.findFirst({
      where: { buyerId, productId },
    });

    const totalDesiredQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (totalDesiredQuantity > product.quantity) {
      throw new BadRequestException(
        `Only ${product.quantity} item(s) available in stock.`,
      );
    }

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: totalDesiredQuantity },
        include: { product: true },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        buyerId,
        productId,
        quantity,
      },
      include: { product: true },
    });
  }

  async getCart(buyerId: string) {
    return this.prisma.cartItem.findMany({
      where: { buyerId },
      include: {
        product: true,
      },
    });
  }

  async removeFromCart(buyerId: string, productId: string) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        buyerId,
        productId,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Item not found in your cart');
    }

    return this.prisma.cartItem.delete({
      where: { id: cartItem.id },
      include: { product: true },
    });
  }

  async clearCart(buyerId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { buyerId },
    });

    return { message: 'Cart cleared successfully' };
  }

  async checkout(buyerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { buyerId },
        include: { product: true },
      });

      if (!cartItems.length) {
        throw new BadRequestException('Cart is empty');
      }

      const order = await tx.order.create({
        data: {
          buyerId,
          totalAmount: cartItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0,
          ),
          status: 'PENDING',
          items: {
            create: cartItems.map((item) => ({
              product: { connect: { id: item.productId } },
              quantity: item.quantity,
              priceAtOrder: item.product.price,
            })),
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { buyerId } });

      return {
        message: 'Order placed successfully',
        order,
      };
    });
  }
  async updateCartItem(dto: UpdateCartDto & { buyerId: string }) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        buyerId: dto.buyerId,
        productId: dto.productId,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Item not found in your cart');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { quantity: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.quantity > product.quantity) {
      throw new BadRequestException(
        `Only ${product.quantity} item(s) available in stock.`,
      );
    }

    return this.prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
  }
}
