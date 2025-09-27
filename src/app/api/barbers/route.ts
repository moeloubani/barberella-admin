import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const barbers = await prisma.barbers.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get appointment stats for each barber
    const barbersWithStats = await Promise.all(
      barbers.map(async (barber) => {
        const [totalAppointments, todayAppointments] = await Promise.all([
          prisma.appointments.count({
            where: { barber_id: barber.id }
          }),
          prisma.appointments.count({
            where: {
              barber_id: barber.id,
              start_time: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lte: new Date(new Date().setHours(23, 59, 59, 999))
              }
            }
          })
        ]);

        // Calculate revenue based on service types
        const completedAppointments = await prisma.appointments.findMany({
          where: {
            barber_id: barber.id,
            status: 'completed'
          },
          select: {
            service: true
          }
        });

        const totalRevenue = completedAppointments.reduce((sum, apt) => {
          return sum + getServicePrice(apt.service);
        }, 0);

        return {
          id: barber.id.toString(),
          name: barber.name,
          email: barber.google_calendar_id,
          phone: '', // Not in current schema
          specialties: [],
          is_active: barber.is_active,
          created_at: barber.created_at,
          stats: {
            totalAppointments,
            todayAppointments,
            totalRevenue
          }
        };
      })
    );

    return NextResponse.json(barbersWithStats);
  } catch (error) {
    console.error('Error fetching barbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch barbers' },
      { status: 500 }
    );
  }
}

// POST - Create new barber
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const barber = await prisma.barbers.create({
      data: {
        name,
        google_calendar_id: email || `${name.toLowerCase().replace(/\s+/g, '')}@barbershop.com`,
        is_active: true
      }
    });

    return NextResponse.json(barber, { status: 201 });
  } catch (error) {
    console.error('Error creating barber:', error);
    return NextResponse.json(
      { error: 'Failed to create barber' },
      { status: 500 }
    );
  }
}

// PUT - Update barber
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Barber ID is required' },
        { status: 400 }
      );
    }

    // Map email to google_calendar_id if provided
    if (updateData.email) {
      updateData.google_calendar_id = updateData.email;
      delete updateData.email;
    }

    // Remove fields that don't exist in the schema
    delete updateData.phone;
    delete updateData.specialties;
    delete updateData.stats;

    const barber = await prisma.barbers.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json(barber);
  } catch (error) {
    console.error('Error updating barber:', error);
    return NextResponse.json(
      { error: 'Failed to update barber' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete barber
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Barber ID is required' },
        { status: 400 }
      );
    }

    const barber = await prisma.barbers.update({
      where: { id: parseInt(id) },
      data: { is_active: false }
    });

    return NextResponse.json({ message: 'Barber deactivated successfully', barber });
  } catch (error) {
    console.error('Error deleting barber:', error);
    return NextResponse.json(
      { error: 'Failed to delete barber' },
      { status: 500 }
    );
  }
}

function getServicePrice(service: string): number {
  const prices: Record<string, number> = {
    'haircut': 30,
    'beard': 20,
    'haircut_and_beard': 45,
    'haircut and beard': 45
  };
  return prices[service] || 30;
}