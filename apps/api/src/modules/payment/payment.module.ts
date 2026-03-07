import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { XenditService } from './xendit.service';
import { BankSampahController } from './bank-sampah.controller';
import { WalletService } from './wallet.service';

@Module({
  controllers: [PaymentController, BankSampahController],
  providers: [
    PaymentService,
    WalletService,
    XenditService,
    { provide: 'XENDIT_SERVICE', useExisting: XenditService },
  ],
  exports: [PaymentService, WalletService],
})
export class PaymentModule {}
