'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  initSocket,
  subscribeToAppointmentUpdates,
  subscribeToCallLogs,
} from '@/lib/socket';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = initSocket();

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    // Subscribe to appointment updates
    const unsubscribeAppointments = subscribeToAppointmentUpdates((data) => {
      // Invalidate appointment queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      // Show notification for new appointments
      if (data.type === 'appointment:created') {
        toast({
          title: 'New Appointment',
          description: `${data.customer_name} booked for ${format(
            new Date(data.date),
            'MMM d'
          )} at ${data.time}`,
        });
      } else if (data.type === 'appointment:cancelled') {
        toast({
          title: 'Appointment Cancelled',
          description: `${data.customer_name}'s appointment on ${format(
            new Date(data.date),
            'MMM d'
          )} has been cancelled`,
          variant: 'destructive',
        });
      }
    });

    // Subscribe to call logs
    const unsubscribeCallLogs = subscribeToCallLogs((data) => {
      // Invalidate customer queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['call-logs'] });

      // Show notification for new calls
      if (data.type === 'call:new') {
        toast({
          title: 'New Call',
          description: `Incoming call from ${data.phone_number}`,
        });
      }
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeCallLogs();
      socket.disconnect();
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}