import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export const RECYCLABLE_PRICES: Record<string, number> = {
  plastic_pet: 3000,    // per kg
  plastic_hdpe: 2500,
  paper: 1500,
  cardboard: 1000,
  metal_aluminum: 12000,
  metal_iron: 4000,
  glass: 500,
};

@Injectable()
export class WalletService {
  constructor(private readonly dataSource: DataSource) {}

  async getOrCreateWallet(tenantSchema: string, userId: string) {
    let wallet = await this.dataSource.query(
      `SELECT * FROM "${tenantSchema}".wallets WHERE user_id = $1`,
      [userId],
    );

    if (!wallet.length) {
      wallet = await this.dataSource.query(
        `INSERT INTO "${tenantSchema}".wallets (user_id, balance) VALUES ($1, 0) RETURNING *`,
        [userId],
      );
    }

    return wallet[0];
  }

  async creditWallet(tenantSchema: string, userId: string, amount: number, description: string) {
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".wallets SET balance = balance + $1, updated_at = NOW()
       WHERE user_id = $2 RETURNING balance`,
      [amount, userId],
    );

    await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".transactions (user_id, type, amount, status, description, paid_at)
       VALUES ($1, 'bank_sampah_sell', $2, 'paid', $3, NOW())`,
      [userId, amount, description],
    );

    return result[0];
  }

  async requestPayout(tenantSchema: string, userId: string, amount: number) {
    const wallet = await this.dataSource.query(
      `SELECT balance FROM "${tenantSchema}".wallets WHERE user_id = $1`,
      [userId],
    );

    if (!wallet.length || wallet[0].balance < amount) {
      throw new BadRequestException('Saldo tidak mencukupi');
    }

    await this.dataSource.query(
      `UPDATE "${tenantSchema}".wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2`,
      [amount, userId],
    );

    const tx = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".transactions (user_id, type, amount, status, description)
       VALUES ($1, 'payout', $2, 'pending', 'Penarikan saldo')
       RETURNING *`,
      [userId, amount],
    );

    return tx[0];
  }

  async getTransactionHistory(tenantSchema: string, userId: string) {
    return this.dataSource.query(
      `SELECT * FROM "${tenantSchema}".transactions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
  }

  getPriceList() {
    return RECYCLABLE_PRICES;
  }
}
