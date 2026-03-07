export enum PaymentType {
  RETRIBUTION = 'retribution',
  BANK_SAMPAH_BUY = 'bank_sampah_buy',
  BANK_SAMPAH_SELL = 'bank_sampah_sell',
  REWARD_REDEEM = 'reward_redeem',
  PAYOUT = 'payout',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  QRIS = 'qris',
  VA_BCA = 'va_bca',
  VA_BNI = 'va_bni',
  VA_MANDIRI = 'va_mandiri',
  EWALLET_OVO = 'ewallet_ovo',
  EWALLET_GOPAY = 'ewallet_gopay',
  EWALLET_DANA = 'ewallet_dana',
}
