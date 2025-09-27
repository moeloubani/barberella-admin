'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Appointment {
  id: string;
  customer_name: string;
  phone_number: string;
  service: string;
  barber_id?: string;
  barber?: {
    name: string;
  };
  date: string;
  time: string;
  duration: number;
  status: string;
  notes?: string;
  price?: number;
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  onSelectSlot: (slotInfo: any) => void;
  barbers?: any[];
}

const serviceColors: Record<string, string> = {
  haircut: '#3B82F6',
  beard_trim: '#10B981',
  haircut_beard: '#8B5CF6',
  hair_coloring: '#F59E0B',
  hair_treatment: '#EC4899',
  shave: '#6B7280',
};

const statusColors: Record<string, string> = {
  confirmed: '#3B82F6',
  pending: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
  no_show: '#6B7280',
};

export function AppointmentCalendar({
  appointments,
  onSelectAppointment,
  onSelectSlot,
  barbers = [],
}: AppointmentCalendarProps) {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // Convert appointments to calendar events
    const calendarEvents = appointments.map((appointment) => {
      // Parse 12-hour time format (e.g., "02:30 PM")
      const startDate = new Date(appointment.date);

      // If time is a string with AM/PM, parse it properly
      if (typeof appointment.time === 'string' && appointment.time.includes(' ')) {
        const [time, period] = appointment.time.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let adjustedHours = hours;

        if (period === 'PM' && hours !== 12) {
          adjustedHours = hours + 12;
        } else if (period === 'AM' && hours === 12) {
          adjustedHours = 0;
        }

        startDate.setHours(adjustedHours, minutes, 0, 0);
      } else {
        // Fallback for 24-hour format
        const [hours, minutes] = appointment.time.split(':').map(Number);
        startDate.setHours(hours, minutes, 0, 0);
      }

      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + (appointment.duration || 30));

      return {
        id: appointment.id,
        title: `${appointment.customer_name} - ${appointment.service}`,
        start: startDate,
        end: endDate,
        resource: appointment,
      };
    });

    setEvents(calendarEvents);
  }, [appointments]);

  const handleSelectEvent = (event: any) => {
    onSelectAppointment(event.resource);
  };

  const handleSelectSlot = (slotInfo: any) => {
    onSelectSlot(slotInfo);
  };

  const eventStyleGetter = (event: any) => {
    const appointment = event.resource;
    const backgroundColor = statusColors[appointment.status] || '#3B82F6';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: appointment.status === 'cancelled' ? 0.6 : 1,
        color: 'white',
        border: '0',
        display: 'block',
      },
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView }: any) => {
    return (
      <div className="flex items-center justify-between mb-4 p-2 bg-white rounded-lg border">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('PREV')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('TODAY')}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('NEXT')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-4">{label}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setView('month');
              onView('month');
            }}
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setView('week');
              onView('week');
            }}
          >
            Week
          </Button>
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setView('day');
              onView('day');
            }}
          >
            Day
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        view={view}
        onView={(newView) => setView(newView)}
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
        }}
        formats={{
          timeGutterFormat: (date: Date) => format(date, 'h:mm a'),
          eventTimeRangeFormat: ({ start, end }: any) =>
            format(start, 'h:mm a') + ' - ' + format(end, 'h:mm a'),
          agendaTimeRangeFormat: ({ start, end }: any) =>
            format(start, 'h:mm a') + ' - ' + format(end, 'h:mm a'),
        }}
        views={['month', 'week', 'day']}
        step={30}
        showMultiDayTimes
        defaultView="week"
      />
    </div>
  );
}