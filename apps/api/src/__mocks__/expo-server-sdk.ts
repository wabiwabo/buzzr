// Jest manual mock for expo-server-sdk (pure ESM, not compatible with Jest CJS transform)

export type ExpoPushMessage = {
  to: string;
  sound?: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
};

export type ExpoPushTicket = { status: 'ok' | 'error' };

export class Expo {
  static isExpoPushToken(token: string): boolean {
    return typeof token === 'string' && token.startsWith('ExponentPushToken[');
  }

  chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][] {
    // Return all messages as a single chunk
    return [messages];
  }

  async sendPushNotificationsAsync(chunk: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    return chunk.map(() => ({ status: 'ok' as const }));
  }
}
