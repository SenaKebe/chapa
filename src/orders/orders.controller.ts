import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-request.interface';
import { ChapaService } from 'src/payments/chapa/chapa.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly chapaService: ChapaService,
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkout(@Req() req: AuthenticatedRequest) {
    return this.ordersService.createOrderFromCart(req.user.userId);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyOrders(@Req() req: AuthenticatedRequest) {
    return this.ordersService.getOrdersByBuyerId(req.user.userId);
  }

  @Post('webhook/chapa')
  async handleChapaWebhook(
    @Body() payload: any,
    @Headers('chapa-signature') signature: string,
  ) {
    if (process.env.NODE_ENV === 'test') {
      console.warn('⚠️ Skipping webhook signature verification (TEST MODE)');
    } else {
      const isValid = await this.chapaService.verifyWebhookSignature(
        payload,
        signature,
      );
      if (!isValid) throw new UnauthorizedException('Invalid signature');
    }

    return this.ordersService.handleChapaWebhook(payload);
  }
}
