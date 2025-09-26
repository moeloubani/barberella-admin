import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = () => {
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
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const subscribeToAppointmentUpdates = (callback: (data: any) => void) => {
  const socketInstance = getSocket();

  socketInstance.on('appointment:created', callback);
  socketInstance.on('appointment:updated', callback);
  socketInstance.on('appointment:cancelled', callback);

  return () => {
    socketInstance.off('appointment:created', callback);
    socketInstance.off('appointment:updated', callback);
    socketInstance.off('appointment:cancelled', callback);
  };
};

export const subscribeToCallLogs = (callback: (data: any) => void) => {
  const socketInstance = getSocket();

  socketInstance.on('call:new', callback);
  socketInstance.on('call:ended', callback);

  return () => {
    socketInstance.off('call:new', callback);
    socketInstance.off('call:ended', callback);
  };
};