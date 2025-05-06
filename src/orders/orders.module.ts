import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/auth/prisma/prisma.service';
import { ChapaService } from 'src/payments/chapa/chapa.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [forwardRef(() => PaymentsModule), HttpModule], // <-- Use forwardRef here
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, ChapaService],
  exports: [OrdersModule, OrdersService],
})
export class OrdersModule {}
