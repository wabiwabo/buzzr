import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  description: string;
  payerEmail?: string;
}

@Injectable()
export class XenditService {
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get('XENDIT_SECRET_KEY') || 'test-key';
  }

  async createInvoice(params: CreateInvoiceParams) {
    // TODO: Replace with actual Xendit API call
    // For now, return mock response for development
    return {
      id: `xendit-${Date.now()}`,
      external_id: params.externalId,
      amount: params.amount,
      status: 'PENDING',
      invoice_url: `https://checkout.xendit.co/mock/${params.externalId}`,
    };
  }

  verifyWebhookSignature(token: string, expectedToken: string): boolean {
    return token === expectedToken;
  }
}
