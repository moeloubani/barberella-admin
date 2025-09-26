import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET all barbers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    if (activeOnly) {
      where.is_active = true;
    }

    const barbers = await prisma.barbers.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    // Get appointment stats for each barber
    const barbersWithStats = await Promise.all(
      barbers.map(async (barber) => {
        const [totalAppointments, todayAppointments, revenue] = await Promise.all([
          prisma.appointments.count({
            where: { barber_id: barber.id }
          }),
          prisma.appointments.count({
            where: {
              barber_id: barber.id,
              date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lte: new Date(new Date().setHours(23, 59, 59, 999))
              }
            }
          }),
          prisma.appointments.aggregate({
            where: {
              barber_id: barber.id,
              status: 'completed'
            },
            _sum: {
              price: true
            }
          })
        ]);

        return {
          ...barber,
          stats: {
            totalAppointments,
            todayAppointments,
            totalRevenue: revenue._sum.price || 0
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

// POST create a new barber
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, specialties = [] } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingBarber = await prisma.barbers.findUnique({
      where: { email }
    });

    if (existingBarber) {
      return NextResponse.json(
        { error: 'A barber with this email already exists' },
        { status: 409 }
      );
    }

    const barber = await prisma.barbers.create({
      data: {
        name,
        email,
        phone,
        specialties
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

// PUT update a barber
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

    // Check if email is being changed and if it's already taken
    if (updateData.email) {
      const existingBarber = await prisma.barbers.findFirst({
        where: {
          email: updateData.email,
          id: { not: id }
        }
      });

      if (existingBarber) {
        return NextResponse.json(
          { error: 'This email is already in use' },
          { status: 409 }
        );
      }
    }

    const barber = await prisma.barbers.update({
      where: { id },
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

// DELETE a barber (soft delete by setting is_active to false)
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

    // Soft delete by setting is_active to false
    const barber = await prisma.barbers.update({
      where: { id },
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