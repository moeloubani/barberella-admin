'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  User
} from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';

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
  confirmation_code?: string;
  created_at: string;
  updated_at: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  loading?: boolean;
}

const statusColors = {
  confirmed: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  confirmed: <CheckCircle className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
  no_show: <XCircle className="h-3 w-3" />,
};

const serviceLabels: Record<string, string> = {
  haircut: 'Haircut',
  beard_trim: 'Beard Trim',
  haircut_beard: 'Haircut & Beard',
  hair_coloring: 'Hair Coloring',
  hair_treatment: 'Hair Treatment',
  shave: 'Classic Shave',
};

export function AppointmentList({
  appointments,
  onEdit,
  onDelete,
  onStatusChange,
  loading = false,
}: AppointmentListProps) {
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedAppointments.length === appointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(appointments.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedAppointments((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No appointments found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <input
                type="checkbox"
                checked={selectedAppointments.length === appointments.length}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
            </TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Barber</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedAppointments.includes(appointment.id)}
                  onChange={() => toggleSelect(appointment.id)}
                  className="rounded border-gray-300"
                />
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{appointment.time}</div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(appointment.date), 'MMM d, yyyy')}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="font-medium">{appointment.customer_name}</span>
                    {appointment.confirmation_code && (
                      <Badge variant="outline" className="ml-2 text-xs font-mono">
                        #{appointment.confirmation_code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="h-3 w-3" />
                    {formatPhoneNumber(appointment.phone_number)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div>{serviceLabels[appointment.service] || appointment.service}</div>
                  <div className="text-xs text-gray-500">
                    {appointment.duration} min
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {appointment.barber?.name || 'Any Available'}
              </TableCell>
              <TableCell>
                <select
                  value={appointment.status}
                  onChange={(e) => onStatusChange(appointment.id, e.target.value)}
                  className={`px-2 py-1 rounded-md text-sm font-medium border-0 cursor-pointer ${statusColors[appointment.status as keyof typeof statusColors]}`}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </TableCell>
              <TableCell>
                {appointment.price ? `$${appointment.price.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(appointment)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onStatusChange(appointment.id, 'confirmed')}
                    >
                      Confirm
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusChange(appointment.id, 'completed')}
                    >
                      Mark Complete
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusChange(appointment.id, 'cancelled')}
                    >
                      Cancel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusChange(appointment.id, 'no_show')}
                    >
                      Mark No Show
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDelete(appointment.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}