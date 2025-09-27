import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // 'week', 'month', 'year'
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = startOfWeek(endDate);
        break;
      case 'month':
        startDate = startOfMonth(endDate);
        break;
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = startOfMonth(endDate);
    }

    // Get current period appointments
    const currentAppointments = await prisma.appointments.findMany({
      where: {
        start_time: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      },
      include: {
        barber: true
      }
    });

    // Get previous period for comparison
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'week':
        previousEndDate = subWeeks(endDate, 1);
        previousStartDate = startOfWeek(previousEndDate);
        break;
      case 'month':
        previousEndDate = endOfMonth(subMonths(endDate, 1));
        previousStartDate = startOfMonth(subMonths(endDate, 1));
        break;
      case 'year':
        previousStartDate = new Date(endDate.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(endDate.getFullYear() - 1, 11, 31);
        break;
      default:
        previousEndDate = endOfMonth(subMonths(endDate, 1));
        previousStartDate = startOfMonth(subMonths(endDate, 1));
    }

    const previousAppointments = await prisma.appointments.findMany({
      where: {
        start_time: {
          gte: previousStartDate,
          lte: previousEndDate
        },
        status: 'completed'
      }
    });

    // Calculate revenue based on service type
    const getServicePrice = (service: string) => {
      const prices: Record<string, number> = {
        'haircut': 30,
        'beard': 20,
        'haircut_and_beard': 45,
        'haircut and beard': 45
      };
      return prices[service] || 30;
    };

    const currentRevenue = currentAppointments.reduce(
      (sum: number, apt: any) => sum + getServicePrice(apt.service),
      0
    );
    const previousRevenue = previousAppointments.reduce(
      (sum: number, apt: any) => sum + getServicePrice(apt.service),
      0
    );
    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Count appointments
    const currentCount = currentAppointments.length;
    const previousCount = previousAppointments.length;
    const countChange = previousCount > 0
      ? ((currentCount - previousCount) / previousCount) * 100
      : 0;

    // Get unique customers from appointments
    const currentCustomers = new Set(currentAppointments.map((apt: any) => apt.client_phone)).size;

    // Get total unique customers from all appointments
    const allCustomerPhones = await prisma.appointments.findMany({
      select: { client_phone: true },
      distinct: ['client_phone']
    });
    const totalCustomers = allCustomerPhones.length;

    // Get new customers this period (first appointment in this period)
    const newCustomerPhones = await prisma.appointments.groupBy({
      by: ['client_phone'],
      _min: { created_at: true },
      having: {
        created_at: {
          _min: {
            gte: startDate
          }
        }
      }
    });
    const newCustomers = newCustomerPhones.length;

    // Calculate average appointment value
    const avgAppointmentValue = currentCount > 0 ? currentRevenue / currentCount : 0;

    // Get popular services
    const serviceStats = currentAppointments.reduce((acc: any, apt: any) => {
      if (!acc[apt.service]) {
        acc[apt.service] = { count: 0, revenue: 0 };
      }
      acc[apt.service].count++;
      acc[apt.service].revenue += getServicePrice(apt.service);
      return acc;
    }, {});

    const popularServices = Object.entries(serviceStats)
      .map(([service, stats]: [string, any]) => ({
        service,
        count: stats.count,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get barber performance
    const barberStats = currentAppointments.reduce((acc: any, apt: any) => {
      if (apt.barber) {
        if (!acc[apt.barber.id]) {
          acc[apt.barber.id] = {
            name: apt.barber.name,
            count: 0,
            revenue: 0
          };
        }
        acc[apt.barber.id].count++;
        acc[apt.barber.id].revenue += getServicePrice(apt.service);
      }
      return acc;
    }, {});

    const barberPerformance = Object.values(barberStats);

    // Get daily revenue for chart
    const dailyRevenue: any = {};
    currentAppointments.forEach((apt: any) => {
      const dateKey = apt.start_time.toISOString().split('T')[0];
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = 0;
      }
      dailyRevenue[dateKey] += getServicePrice(apt.service);
    });

    const revenueChart = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({
        date,
        revenue
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get appointment status breakdown
    const allAppointments = await prisma.appointments.findMany({
      where: {
        start_time: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        status: true
      }
    });

    const statusBreakdown = allAppointments.reduce((acc: any, apt: any) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    // Get peak hours
    const hourlyStats = currentAppointments.reduce((acc: any, apt: any) => {
      const hour = apt.start_time.getHours().toString().padStart(2, '0');
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakHours = Object.entries(hourlyStats)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        count
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 3);

    // Get cancellation rate
    const cancelledCount = await prisma.appointments.count({
      where: {
        start_time: {
          gte: startDate,
          lte: endDate
        },
        status: 'cancelled'
      }
    });

    const totalAppointments = allAppointments.length;
    const cancellationRate = totalAppointments > 0
      ? (cancelledCount / totalAppointments) * 100
      : 0;

    return NextResponse.json({
      overview: {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          change: revenueChange
        },
        appointments: {
          current: currentCount,
          previous: previousCount,
          change: countChange
        },
        customers: {
          total: totalCustomers,
          active: currentCustomers,
          new: newCustomers
        },
        avgAppointmentValue,
        cancellationRate
      },
      popularServices,
      barberPerformance,
      revenueChart,
      statusBreakdown,
      peakHours,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: period
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}