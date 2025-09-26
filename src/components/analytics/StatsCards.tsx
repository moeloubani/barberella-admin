'use client';

import { ArrowUp, ArrowDown, DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface StatsCardsProps {
  data: {
    revenue: {
      current: number;
      previous: number;
      change: number;
    };
    appointments: {
      current: number;
      previous: number;
      change: number;
    };
    customers: {
      total: number;
      active: number;
      new: number;
    };
    averageAppointmentValue: number;
    cancellationRate: number;
  };
}

export function StatsCards({ data }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.revenue.current),
      change: data.revenue.change,
      changeLabel: `${data.revenue.change >= 0 ? '+' : ''}${data.revenue.change.toFixed(1)}%`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Appointments',
      value: data.appointments.current.toString(),
      change: data.appointments.change,
      changeLabel: `${data.appointments.change >= 0 ? '+' : ''}${data.appointments.change.toFixed(1)}%`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Customers',
      value: data.customers.active.toString(),
      subtitle: `${data.customers.new} new`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg Appointment Value',
      value: formatCurrency(data.averageAppointmentValue),
      subtitle: `${data.cancellationRate.toFixed(1)}% cancellation`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.change !== undefined && (
                <div className="flex items-center text-sm">
                  {card.change >= 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span
                    className={
                      card.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {card.changeLabel}
                  </span>
                  <span className="text-muted-foreground ml-1">vs last period</span>
                </div>
              )}
              {card.subtitle && (
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}