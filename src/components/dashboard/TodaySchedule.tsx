'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Phone, Scissors, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Appointment {
  id: string;
  customer_name: string;
  phone_number: string;
  service: string;
  barber_id?: string;
  barber?: {
    id: string;
    name: string;
  };
  date: string;
  time: string;
  duration: number;
  status: string;
}

interface Barber {
  id: string;
  name: string;
}

interface TodayScheduleProps {
  appointments: Appointment[];
  barbers: Barber[];
  onEditAppointment?: (appointment: Appointment) => void;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

const serviceIcons: Record<string, string> = {
  haircut: '✂️',
  beard: '🧔',
  'haircut_and_beard': '✂️🧔',
  combo: '✂️🧔',
};

export function TodaySchedule({ appointments, barbers, onEditAppointment }: TodayScheduleProps) {
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    // Filter appointments for today
    const today = new Date();
    const todayStr = today.toDateString();

    const filtered = appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === todayStr;
    });

    // Sort by time
    filtered.sort((a, b) => {
      // Parse times properly handling AM/PM
      const parseTime = (timeStr: string) => {
        const date = new Date();
        if (timeStr.includes(' ')) {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let adjustedHours = hours;

          if (period === 'PM' && hours !== 12) {
            adjustedHours = hours + 12;
          } else if (period === 'AM' && hours === 12) {
            adjustedHours = 0;
          }

          date.setHours(adjustedHours, minutes, 0, 0);
        } else {
          const [hours, minutes] = timeStr.split(':').map(Number);
          date.setHours(hours, minutes, 0, 0);
        }
        return date.getTime();
      };

      return parseTime(a.time) - parseTime(b.time);
    });

    // Apply barber filter
    if (selectedBarberId !== 'all') {
      setTodayAppointments(
        filtered.filter((apt) => apt.barber_id === selectedBarberId)
      );
    } else {
      setTodayAppointments(filtered);
    }
  }, [appointments, selectedBarberId]);

  const getTimelinePosition = (time: string): number => {
    // Parse time and calculate position on 8AM-8PM timeline
    const date = new Date();
    if (time.includes(' ')) {
      const [timeStr, period] = time.split(' ');
      const [hours, minutes] = timeStr.split(':').map(Number);
      let adjustedHours = hours;

      if (period === 'PM' && hours !== 12) {
        adjustedHours = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        adjustedHours = 0;
      }

      date.setHours(adjustedHours, minutes, 0, 0);
    }

    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = 8 * 60; // 8 AM
    const endMinutes = 20 * 60; // 8 PM
    const position = ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;

    return Math.max(0, Math.min(100, position));
  };

  const getCurrentTimePosition = (): number => {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = 8 * 60; // 8 AM
    const endMinutes = 20 * 60; // 8 PM
    const position = ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;

    return Math.max(0, Math.min(100, position));
  };

  const isCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 8 && hours < 20;
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Today's Schedule</h2>
            <Badge variant="secondary" className="ml-2">
              {format(new Date(), 'EEEE, MMM d')}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Barber:</span>
            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select barber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barbers</SelectItem>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {todayAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p>No appointments scheduled for today</p>
            {selectedBarberId !== 'all' && (
              <p className="text-sm mt-1">Try selecting "All Barbers" to see all appointments</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline View */}
            <div className="relative h-24 bg-gray-50 rounded-lg p-4 mb-4">
              <div className="absolute inset-x-4 top-2 text-xs text-gray-500 flex justify-between">
                <span>8 AM</span>
                <span>12 PM</span>
                <span>4 PM</span>
                <span>8 PM</span>
              </div>
              <div className="relative h-12 mt-6 bg-gray-200 rounded-full">
                {/* Current time indicator */}
                {isCurrentTime() && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                    style={{ left: `${getCurrentTimePosition()}%` }}
                  >
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}

                {/* Appointment blocks */}
                {todayAppointments.map((apt) => {
                  const position = getTimelinePosition(apt.time);
                  const width = (apt.duration / 720) * 100; // 720 minutes = 12 hours

                  return (
                    <div
                      key={apt.id}
                      className="absolute top-1 h-10 rounded-md flex items-center px-2 text-xs text-white font-medium"
                      style={{
                        left: `${position}%`,
                        width: `${width}%`,
                        backgroundColor: apt.status === 'cancelled' ? '#EF4444' :
                                       apt.status === 'completed' ? '#10B981' : '#3B82F6',
                        opacity: apt.status === 'cancelled' ? 0.5 : 1,
                      }}
                      title={`${apt.customer_name} - ${apt.time}`}
                    >
                      <span className="truncate">{apt.customer_name.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Appointment List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`border rounded-lg p-3 ${
                    appointment.status === 'cancelled' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{appointment.time}</span>
                        <span className="text-xs text-gray-500">{appointment.duration} min</span>
                      </div>

                      <div className="border-l pl-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{appointment.customer_name}</span>
                          <Badge className={statusColors[appointment.status] || 'bg-gray-100'}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {appointment.phone_number}
                          </span>
                          <span className="flex items-center gap-1">
                            {serviceIcons[appointment.service] || <Scissors className="h-3 w-3" />}
                            {appointment.service}
                          </span>
                          {appointment.barber && (
                            <span className="font-medium">
                              w/ {appointment.barber.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {onEditAppointment && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditAppointment(appointment)}
                        className="ml-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {todayAppointments.length}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {todayAppointments.filter(a => a.status === 'confirmed').length}
            </div>
            <div className="text-xs text-gray-500">Confirmed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {todayAppointments.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {todayAppointments.filter(a => a.status === 'cancelled').length}
            </div>
            <div className="text-xs text-gray-500">Cancelled</div>
          </div>
        </div>
      </div>
    </div>
  );
}