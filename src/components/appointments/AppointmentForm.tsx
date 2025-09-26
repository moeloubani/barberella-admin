'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  appointment?: any;
  barbers?: any[];
  settings?: any;
}

const SERVICES = [
  { value: 'haircut', label: 'Haircut', price: 30 },
  { value: 'beard_trim', label: 'Beard Trim', price: 20 },
  { value: 'haircut_beard', label: 'Haircut & Beard', price: 45 },
  { value: 'hair_coloring', label: 'Hair Coloring', price: 60 },
  { value: 'hair_treatment', label: 'Hair Treatment', price: 40 },
  { value: 'shave', label: 'Classic Shave', price: 25 },
];

export function AppointmentForm({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  barbers = [],
  settings,
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    appointment?.date ? new Date(appointment.date) : new Date()
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState(appointment?.service || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: appointment || {
      customer_name: '',
      phone_number: '',
      service: '',
      barber_id: '',
      date: new Date(),
      time: '',
      duration: 30,
      notes: '',
      price: 0,
      status: 'confirmed',
    },
  });

  // Generate time slots based on settings
  const generateTimeSlots = () => {
    if (!settings) return [];

    const slots = [];
    const [startHour, startMinute] = settings.opening_time.split(':').map(Number);
    const [endHour, endMinute] = settings.closing_time.split(':').map(Number);
    const duration = settings.slot_duration || 30;

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute
        .toString()
        .padStart(2, '0')}`;
      slots.push(timeString);

      currentMinute += duration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    return slots;
  };

  useEffect(() => {
    setAvailableSlots(generateTimeSlots());
  }, [settings]);

  useEffect(() => {
    if (selectedDate) {
      setValue('date', selectedDate);
    }
  }, [selectedDate, setValue]);

  useEffect(() => {
    const service = SERVICES.find((s) => s.value === selectedService);
    if (service) {
      setValue('price', service.price);
    }
  }, [selectedService, setValue]);

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        date: selectedDate,
      });
      reset();
      onClose();
      toast({
        title: appointment ? 'Appointment Updated' : 'Appointment Created',
        description: 'The appointment has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Edit Appointment' : 'New Appointment'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                {...register('customer_name', { required: 'Name is required' })}
                placeholder="John Doe"
              />
              {errors.customer_name && (
                <p className="text-sm text-red-500">{errors.customer_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                {...register('phone_number', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[\d\s\-\+\(\)]+$/,
                    message: 'Invalid phone number',
                  },
                })}
                placeholder="+1 234 567 8900"
              />
              {errors.phone_number && (
                <p className="text-sm text-red-500">{errors.phone_number.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service">Service *</Label>
              <Select
                value={watch('service')}
                onValueChange={(value) => {
                  setValue('service', value);
                  setSelectedService(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label} - ${service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service && (
                <p className="text-sm text-red-500">{errors.service.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="barber_id">Barber</Label>
              <Select
                value={watch('barber_id')}
                onValueChange={(value) => setValue('barber_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a barber (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Available</SelectItem>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                (settings?.max_advance_days &&
                  date > new Date(Date.now() + settings.max_advance_days * 24 * 60 * 60 * 1000))
              }
              className="rounded-md border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Select
                value={watch('time')}
                onValueChange={(value) => setValue('time', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.time && (
                <p className="text-sm text-red-500">{errors.time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                {...register('duration', {
                  valueAsNumber: true,
                  min: { value: 15, message: 'Minimum 15 minutes' },
                  max: { value: 240, message: 'Maximum 240 minutes' },
                })}
                placeholder="30"
              />
              {errors.duration && (
                <p className="text-sm text-red-500">{errors.duration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any special requests or notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {appointment ? 'Update' : 'Create'} Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}