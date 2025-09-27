import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = () => {
  // Disable socket connection for now - backend doesn't have Socket.io on the same port
  // Will need to set up a separate WebSocket endpoint or use the existing /media-stream endpoint
  return null;

  /*
  if (!socket) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://barberella-production.up.railway.app';

    socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  return socket;
  */
};

export const getSocket = () => {
  return null; // Disabled for now
};

export const subscribeToAppointmentUpdates = (callback: (data: any) => void) => {
  // Disabled for now - no socket connection
  return () => {};
};

export const subscribeToCallLogs = (callback: (data: any) => void) => {
  // Disabled for now - no socket connection
  return () => {};
};