'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatsCards } from '@/components/analytics/StatsCards';
import {
  RevenueChart,
  ServicesPieChart,
  BarberPerformanceChart,
} from '@/components/analytics/RevenueChart';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Papa from 'papaparse';
import axios from 'axios';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const response = await axios.get(`/api/analytics?period=${period}`);
      return response.data;
    },
  });

  const handleExportData = () => {
    if (!analyticsData) return;

    const exportData = [
      {
        Metric: 'Total Revenue',
        Value: `$${analyticsData.overview.revenue.current}`,
        Change: `${analyticsData.overview.revenue.change}%`,
      },
      {
        Metric: 'Total Appointments',
        Value: analyticsData.overview.appointments.current,
        Change: `${analyticsData.overview.appointments.change}%`,
      },
      {
        Metric: 'Active Customers',
        Value: analyticsData.overview.customers.active,
        Change: '-',
      },
      {
        Metric: 'New Customers',
        Value: analyticsData.overview.customers.new,
        Change: '-',
      },
      {
        Metric: 'Avg Appointment Value',
        Value: `$${analyticsData.overview.averageAppointmentValue}`,
        Change: '-',
      },
      {
        Metric: 'Cancellation Rate',
        Value: `${analyticsData.overview.cancellationRate.toFixed(1)}%`,
        Change: '-',
      },
    ];

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `analytics_${period}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8 text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your business performance and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as 'week' | 'month' | 'year')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Badge */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Period:</span>
        <Badge variant="secondary">
          {format(new Date(analyticsData.period.start), 'MMM d')} -{' '}
          {format(new Date(analyticsData.period.end), 'MMM d, yyyy')}
        </Badge>
      </div>

      {/* Stats Cards */}
      <StatsCards data={analyticsData.overview} />

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="barbers">Barbers</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="flex justify-end">
            <Select
              value={chartType}
              onValueChange={(value) => setChartType(value as 'line' | 'bar')}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <RevenueChart
            data={analyticsData.revenueChart}
            type={chartType}
          />
        </TabsContent>

        <TabsContent value="services">
          <ServicesPieChart data={analyticsData.popularServices} />
        </TabsContent>

        <TabsContent value="barbers">
          <BarberPerformanceChart data={analyticsData.barberPerformance} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Peak Hours */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-4">
                <Clock className="h-4 w-4 inline mr-2" />
                Peak Hours
              </h3>
              <div className="space-y-3">
                {analyticsData.peakHours.map((hour: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{hour.hour}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${
                              (hour.count / analyticsData.peakHours[0].count) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {hour.count} appts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-4">
                <TrendingUp className="h-4 w-4 inline mr-2" />
                Appointment Status
              </h3>
              <div className="space-y-3">
                {Object.entries(analyticsData.statusBreakdown).map(
                  ([status, count]: [string, any]) => {
                    const total = Object.values(analyticsData.statusBreakdown).reduce(
                      (sum: number, val: any) => sum + val,
                      0
                    );
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <Badge variant="secondary" className="capitalize">
                          {status}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}