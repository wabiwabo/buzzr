import { useEffect, useRef } from 'react';
import { getSocket, connectSocket } from '../services/socket';
import type { Socket } from 'socket.io-client';

export function useSocket(
  event: string,
  handler: (data: any) => void,
): Socket {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    const listener = (data: any) => savedHandler.current(data);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event]);

  return getSocket();
}
