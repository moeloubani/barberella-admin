'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Calendar, Users, DollarSign, TrendingUp, Plus, UserPlus, BarChart3, Settings } from 'lucide-react';

export default function DashboardPage() {
  // Fetch appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['dashboard-appointments'],
    queryFn: async () => {
      const response = await axios.get('/api/appointments');
      return response.data;
    },
  });

  // Fetch barbers
  const { data: barbers = [] } = useQuery({
    queryKey: ['dashboard-barbers'],
    queryFn: async () => {
      const response = await axios.get('/api/barbers');
      return response.data;
    },
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['dashboard-customers'],
    queryFn: async () => {
      const response = await axios.get('/api/customers?limit=1000');
      return response.data;
    },
  });

  // Calculate stats
  const totalBookings = appointments.length;
  const todayBookings = appointments.filter((apt: any) => {
    const aptDate = new Date(apt.date);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString();
  }).length;

  const activeBarbers = barbers.filter((b: any) => b.is_active).length;

  // Calculate revenue from all appointments (not just completed)
  const totalRevenue = appointments.reduce((sum: number, apt: any) => {
    // Include all appointments except cancelled ones in revenue
    if (apt.status !== 'cancelled') {
      return sum + (apt.price || 0);
    }
    return sum;
  }, 0);

  const completedAppointments = appointments.filter((apt: any) => apt.status === 'completed').length;
  const cancelledAppointments = appointments.filter((apt: any) => apt.status === 'cancelled').length;
  const confirmedAppointments = appointments.filter((apt: any) => apt.status === 'confirmed').length;

  const totalCustomers = customersData?.totalCount || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow-sm rounded-lg">
        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, Admin!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's an overview of your barbershop's performance.
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-6 py-6">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Bookings
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {totalBookings}
                </dd>
                <p className="text-xs text-gray-500 mt-1">
                  {todayBookings} today
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-6 py-6">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Customers
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {totalCustomers}
                </dd>
                <p className="text-xs text-gray-500 mt-1">
                  Unique clients
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-6 py-6">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Barbers
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {activeBarbers}
                </dd>
                <p className="text-xs text-gray-500 mt-1">
                  {barbers.length} total
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  <UserPlus className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-6 py-6">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Revenue
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ${totalRevenue}
                </dd>
                <p className="text-xs text-gray-500 mt-1">
                  Excluding cancelled
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Appointment Status</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confirmed</span>
                <span className="text-sm font-medium text-green-600">{confirmedAppointments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-blue-600">{completedAppointments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cancelled</span>
                <span className="text-sm font-medium text-red-600">{cancelledAppointments}</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total</span>
                  <span className="text-sm font-bold text-gray-900">{totalBookings}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/dashboard/appointments"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <Plus className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <span className="text-sm text-gray-600">Add Booking</span>
              </Link>

              <Link
                href="/dashboard/settings"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <UserPlus className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <span className="text-sm text-gray-600">Add Barber</span>
              </Link>

              <Link
                href="/dashboard/analytics"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <BarChart3 className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <span className="text-sm text-gray-600">View Reports</span>
              </Link>

              <Link
                href="/dashboard/settings"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <Settings className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <span className="text-sm text-gray-600">Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}