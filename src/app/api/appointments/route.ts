import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET all appointments with optional filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const barberId = searchParams.get('barberId');
    const phoneNumber = searchParams.get('phoneNumber');

    const where: any = {};

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.start_time = {
        gte: startDate,
        lte: endDate
      };
    }

    if (status) {
      where.status = status;
    }

    if (barberId) {
      where.barber_id = parseInt(barberId);
    }

    if (phoneNumber) {
      where.client_phone = phoneNumber;
    }

    const appointments = await prisma.appointments.findMany({
      where,
      include: {
        barber: true,
      },
      orderBy: {
        start_time: 'asc'
      }
    });

    // Transform to match frontend expectations
    const transformed = appointments.map(apt => ({
      id: apt.id,
      customer_name: apt.client_name,
      phone_number: apt.client_phone,
      service: apt.service,
      barber_id: apt.barber_id,
      barber: apt.barber,
      date: apt.start_time,
      time: apt.start_time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      duration: Math.round((apt.end_time.getTime() - apt.start_time.getTime()) / (1000 * 60)),
      status: apt.status,
      notes: apt.notes,
      price: getServicePrice(apt.service),
      confirmation_code: apt.confirmation_code,
      created_at: apt.created_at
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// Helper function to get service price
function getServicePrice(service: string): number {
  const prices: Record<string, number> = {
    'haircut': 30,
    'beard': 20,
    'haircut_and_beard': 45
  };
  return prices[service] || 30;
}

// POST - Create new appointment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Convert date and time to start_time and end_time
    const startTime = new Date(body.date);
    const [hours, minutes] = body.time.split(':');
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (body.duration || 30));

    // Generate a unique 3-digit confirmation code
    let confirmationCode: string;
    let isUnique = false;

    while (!isUnique) {
      confirmationCode = Math.floor(100 + Math.random() * 900).toString();
      const existing = await prisma.appointments.findFirst({
        where: {
          confirmation_code: confirmationCode,
          start_time: {
            gte: new Date() // Only check future appointments
          }
        }
      });
      isUnique = !existing;
    }

    const appointment = await prisma.appointments.create({
      data: {
        client_name: body.customer_name,
        client_phone: body.phone_number,
        service: body.service,
        barber_id: body.barber_id ? parseInt(body.barber_id) : undefined,
        start_time: startTime,
        end_time: endTime,
        status: body.status || 'confirmed',
        notes: body.notes,
        confirmation_code: confirmationCode!
      },
      include: {
        barber: true
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

// PUT - Update appointment
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
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Handle date/time updates if provided
    if (updateData.date || updateData.time) {
      const existing = await prisma.appointments.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      const startTime = updateData.date ? new Date(updateData.date) : existing.start_time;
      if (updateData.time) {
        const [hours, minutes] = updateData.time.split(':');
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (updateData.duration || 30));

      updateData.start_time = startTime;
      updateData.end_time = endTime;
      delete updateData.date;
      delete updateData.time;
      delete updateData.duration;
    }

    // Map frontend fields to database fields
    if (updateData.customer_name) {
      updateData.client_name = updateData.customer_name;
      delete updateData.customer_name;
    }
    if (updateData.phone_number) {
      updateData.client_phone = updateData.phone_number;
      delete updateData.phone_number;
    }

    const appointment = await prisma.appointments.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        barber: true
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete appointment
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
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    await prisma.appointments.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}