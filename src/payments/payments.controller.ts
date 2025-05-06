import { Body, Post } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { ChapaService } from './chapa/chapa.service';
import { OrdersService } from '../orders/orders.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private chapaService: ChapaService,
    private ordersService: OrdersService,
  ) {}

  // @Post('webhook/chapa')
  // async handleWebhook(@Body() payload: any) {
  //   const isValid = await this.chapaService.verifyWebhook(payload);
  //   if (isValid) {
  //     await this.ordersService.updateOrderStatus(payload.tx_ref, 'PAID');
  //   }
  // }
  @Post('verify')
  async handleWebhook(@Body() payload: any) {
    console.log('Received webhook:', payload);

    const isValid = await this.chapaService.verifyWebhook(payload);

    if (isValid) {
      await this.ordersService.updatePaymentStatus(payload.tx_ref, 'PAID');
    }

    return { received: true };
  }
}
