'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import Papa from 'papaparse';
import axios from 'axios';

export default function AppointmentsPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const queryClient = useQueryClient();

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', selectedDate, selectedStatus, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('date', format(selectedDate, 'yyyy-MM-dd'));
      }
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }
      if (searchQuery) {
        params.append('phoneNumber', searchQuery);
      }

      const response = await axios.get(`/api/appointments?${params}`);
      return response.data;
    },
  });

  // Fetch barbers
  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const response = await axios.get('/api/barbers?active=true');
      return response.data;
    },
  });

  // Fetch settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await axios.get('/api/settings');
      return response.data;
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/appointments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Success',
        description: 'Appointment created successfully',
      });
      setIsFormOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create appointment',
        variant: 'destructive',
      });
    },
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put('/api/appointments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Success',
        description: 'Appointment updated successfully',
      });
      setIsFormOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update appointment',
        variant: 'destructive',
      });
    },
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/appointments?id=${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Success',
        description: 'Appointment deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete appointment',
        variant: 'destructive',
      });
    },
  });

  const handleCreateOrUpdateAppointment = async (data: any) => {
    if (selectedAppointment) {
      await updateAppointmentMutation.mutateAsync({ ...data, id: selectedAppointment.id });
    } else {
      await createAppointmentMutation.mutateAsync(data);
    }
  };

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleDeleteAppointment = (id: string) => {
    if (confirm('Are you sure you want to delete this appointment?')) {
      deleteAppointmentMutation.mutate(id);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await axios.put(`/api/appointments/${id}/status`, { status });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Success',
        description: `Appointment status updated to ${status}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedAppointment({
      date: slotInfo.start,
      time: format(slotInfo.start, 'HH:mm'),
    });
    setIsFormOpen(true);
  };

  const handleExportCSV = () => {
    const csvData = appointments.map((appointment: any) => ({
      Date: format(new Date(appointment.date), 'yyyy-MM-dd'),
      Time: appointment.time,
      Customer: appointment.customer_name,
      Phone: appointment.phone_number,
      Service: appointment.service,
      Barber: appointment.barber?.name || 'Any Available',
      Status: appointment.status,
      Price: appointment.price ? `$${appointment.price}` : '',
      Notes: appointment.notes || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAppointments = appointments.filter((appointment: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        appointment.customer_name.toLowerCase().includes(query) ||
        appointment.phone_number.includes(query) ||
        appointment.service.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your appointments and bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setSelectedAppointment(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')}>
        <TabsList className="grid w-[200px] grid-cols-2">
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <div className="bg-white rounded-lg border p-4">
            <AppointmentCalendar
              appointments={filteredAppointments}
              onSelectAppointment={handleEditAppointment}
              onSelectSlot={handleSelectSlot}
              barbers={barbers}
            />
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <AppointmentList
            appointments={filteredAppointments}
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
            onStatusChange={handleStatusChange}
            loading={isLoading}
          />
        </TabsContent>
      </Tabs>

      <AppointmentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAppointment(null);
        }}
        onSubmit={handleCreateOrUpdateAppointment}
        appointment={selectedAppointment}
        barbers={barbers}
        settings={settingsData?.settings}
      />
    </div>
  );
}