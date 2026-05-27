import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

interface PushPayload {
  token: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
}

/**
 * Sends Expo push notifications to mobile clients that registered a token
 * via POST /users/me/push-token. Uses expo-server-sdk's batching so multiple
 * outgoing notifications get chunked into Expo's max-100-per-call limit.
 *
 * In environments without an EXPO_ACCESS_TOKEN env var the SDK still works
 * for development against expo.dev — only required for production scale.
 */
@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expo = new Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN,
  });

  async sendToToken(payload: PushPayload): Promise<void> {
    if (!Expo.isExpoPushToken(payload.token)) {
      this.logger.warn(`Invalid Expo push token, skipping: ${(payload.token as string).slice(0, 20)}...`);
      return;
    }
    await this.sendMany([payload]);
  }

  async sendMany(payloads: PushPayload[]): Promise<ExpoPushTicket[]> {
    const messages: ExpoPushMessage[] = payloads
      .filter((p) => Expo.isExpoPushToken(p.token))
      .map((p) => ({
        to: p.token,
        sound: 'default',
        title: p.title,
        body: p.body,
        data: p.data || {},
      }));

    if (messages.length === 0) return [];

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const chunkTickets = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...chunkTickets);
      } catch (err) {
        // Don't let a transient Expo outage break the request that triggered
        // the notification — the in-app WS broadcast already happened.
        this.logger.error(`Expo push chunk failed: ${(err as Error).message}`);
      }
    }

    return tickets;
  }
}
