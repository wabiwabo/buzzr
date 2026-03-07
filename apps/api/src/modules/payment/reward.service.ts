import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export const POINT_VALUES: Record<string, number> = {
  complaint_resolved: 10,
  waste_bank_transaction: 5,
  on_time_payment: 20,
  first_report: 50,
};

export const POINTS_TO_IDR_RATE = 10; // 1 point = 10 IDR

@Injectable()
export class RewardService {
  constructor(private readonly dataSource: DataSource) {}

  async awardPoints(tenantSchema: string, userId: string, action: string) {
    const points = POINT_VALUES[action] || 0;
    if (points === 0) return;

    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".users SET reward_points = reward_points + $1, updated_at = NOW()
       WHERE id = $2 RETURNING reward_points`,
      [points, userId],
    );

    return result[0];
  }

  async redeemPoints(tenantSchema: string, userId: string, points: number) {
    const user = await this.dataSource.query(
      `SELECT reward_points FROM "${tenantSchema}".users WHERE id = $1`,
      [userId],
    );

    if (!user.length || user[0].reward_points < points) {
      throw new BadRequestException('Poin tidak mencukupi');
    }

    // Deduct points
    await this.dataSource.query(
      `UPDATE "${tenantSchema}".users SET reward_points = reward_points - $1, updated_at = NOW() WHERE id = $2`,
      [points, userId],
    );

    const amount = points * POINTS_TO_IDR_RATE;

    // Credit wallet
    await this.dataSource.query(
      `UPDATE "${tenantSchema}".wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
      [amount, userId],
    );

    // Record transaction
    await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".transactions (user_id, type, amount, status, description, paid_at)
       VALUES ($1, 'reward_redeem', $2, 'paid', $3, NOW())`,
      [userId, amount, `Tukar ${points} poin ke saldo`],
    );

    return { pointsRedeemed: points, amountCredited: amount };
  }

  getPointsConfig() {
    return POINT_VALUES;
  }

  async getUserPoints(tenantSchema: string, userId: string) {
    const result = await this.dataSource.query(
      `SELECT reward_points FROM "${tenantSchema}".users WHERE id = $1`,
      [userId],
    );
    return result[0] || { reward_points: 0 };
  }
}
