import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { XenditService } from './xendit.service';
import { BankSampahController } from './bank-sampah.controller';
import { WalletService } from './wallet.service';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';

@Module({
  controllers: [PaymentController, BankSampahController, RewardController],
  providers: [
    PaymentService,
    WalletService,
    RewardService,
    XenditService,
    { provide: 'XENDIT_SERVICE', useExisting: XenditService },
  ],
  exports: [PaymentService, WalletService, RewardService],
})
export class PaymentModule {}
