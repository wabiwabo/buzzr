import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { XenditService } from './xendit.service';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    XenditService,
    { provide: 'XENDIT_SERVICE', useExisting: XenditService },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
