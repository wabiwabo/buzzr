import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const tenantSlug = localStorage.getItem('tenantSlug') || 'dlh-demo';
    socket = io('/tracking', {
      path: '/socket.io',
      auth: {
        token: localStorage.getItem('accessToken'),
      },
      query: {
        tenantSlug,
      },
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
