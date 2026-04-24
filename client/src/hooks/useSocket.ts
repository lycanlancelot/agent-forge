import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(window.location.origin, { reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 1000 });
    socketRef.current = socket;

    socket.on('connect', () => { console.log('[Socket] connected'); setConnected(true); });
    socket.on('disconnect', () => { console.log('[Socket] disconnected'); setConnected(false); });
    socket.on('connect_error', (err) => { console.error('[Socket] connect_error:', err.message); setConnected(false); });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (!socketRef.current?.connected) {
      console.warn('[Socket] not connected, cannot emit:', event);
      return;
    }
    socketRef.current.emit(event, data);
  }, []);

  const on = useCallback((event: string, cb: (data: any) => void) => {
    socketRef.current?.on(event, cb);
    return () => { socketRef.current?.off(event, cb); };
  }, []);

  return { socket: socketRef.current, connected, emit, on };
}
