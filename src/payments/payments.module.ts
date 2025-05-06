import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ChapaService } from './chapa/chapa.service';
import { OrdersModule } from 'src/orders/orders.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [forwardRef(() => OrdersModule), HttpModule],
  controllers: [PaymentsController],
  providers: [ChapaService],
  exports: [ChapaService],
})
export class PaymentsModule {}
