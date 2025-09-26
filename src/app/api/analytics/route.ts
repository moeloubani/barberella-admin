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
        date: {
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
        date: {
          gte: previousStartDate,
          lte: previousEndDate
        },
        status: 'completed'
      }
    });

    // Calculate revenue
    const currentRevenue = currentAppointments.reduce(
      (sum, apt) => sum + (apt.price || 0),
      0
    );
    const previousRevenue = previousAppointments.reduce(
      (sum, apt) => sum + (apt.price || 0),
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

    // Get unique customers
    const currentCustomers = new Set(currentAppointments.map(apt => apt.phone_number)).size;
    const totalCustomers = await prisma.customers.count();

    // Get new customers this period
    const newCustomers = await prisma.customers.count({
      where: {
        created_at: {
          gte: startDate
        }
      }
    });

    // Calculate average appointment value
    const avgAppointmentValue = currentCount > 0 ? currentRevenue / currentCount : 0;

    // Get popular services
    const serviceStats = currentAppointments.reduce((acc: any, apt) => {
      if (!acc[apt.service]) {
        acc[apt.service] = { count: 0, revenue: 0 };
      }
      acc[apt.service].count++;
      acc[apt.service].revenue += apt.price || 0;
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
    const barberStats = currentAppointments.reduce((acc: any, apt) => {
      if (apt.barber) {
        if (!acc[apt.barber.id]) {
          acc[apt.barber.id] = {
            name: apt.barber.name,
            count: 0,
            revenue: 0
          };
        }
        acc[apt.barber.id].count++;
        acc[apt.barber.id].revenue += apt.price || 0;
      }
      return acc;
    }, {});

    const barberPerformance = Object.values(barberStats);

    // Get daily revenue for chart
    const dailyRevenue: any = {};
    currentAppointments.forEach(apt => {
      const dateKey = apt.date.toISOString().split('T')[0];
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = 0;
      }
      dailyRevenue[dateKey] += apt.price || 0;
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
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        status: true
      }
    });

    const statusBreakdown = allAppointments.reduce((acc: any, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    // Get peak hours
    const hourlyStats = currentAppointments.reduce((acc: any, apt) => {
      const hour = apt.time.split(':')[0];
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
        date: {
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