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
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    if (status) {
      where.status = status;
    }

    if (barberId) {
      where.barber_id = barberId;
    }

    if (phoneNumber) {
      where.phone_number = phoneNumber;
    }

    const appointments = await prisma.appointments.findMany({
      where,
      include: {
        barber: true
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST create a new appointment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customer_name,
      phone_number,
      service,
      barber_id,
      date,
      time,
      duration,
      notes,
      price,
      status = 'confirmed'
    } = body;

    // Validate required fields
    if (!customer_name || !phone_number || !service || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the slot is available
    const existingAppointment = await prisma.appointments.findFirst({
      where: {
        date: new Date(date),
        time,
        barber_id,
        status: {
          notIn: ['cancelled']
        }
      }
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointments.create({
      data: {
        customer_name,
        phone_number,
        service,
        barber_id,
        date: new Date(date),
        time,
        duration: duration || 30,
        notes,
        price,
        status
      },
      include: {
        barber: true
      }
    });

    // Update or create customer record
    await prisma.customers.upsert({
      where: { phone_number },
      update: {
        last_visit: new Date(date),
        total_visits: { increment: 1 }
      },
      create: {
        name: customer_name,
        phone_number,
        total_visits: 1,
        last_visit: new Date(date)
      }
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

// PUT update an appointment
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

    // Check if appointment exists
    const existingAppointment = await prisma.appointments.findUnique({
      where: { id }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // If date or time is being changed, check for conflicts
    if (updateData.date || updateData.time || updateData.barber_id) {
      const conflictCheck = await prisma.appointments.findFirst({
        where: {
          id: { not: id },
          date: updateData.date ? new Date(updateData.date) : existingAppointment.date,
          time: updateData.time || existingAppointment.time,
          barber_id: updateData.barber_id || existingAppointment.barber_id,
          status: {
            notIn: ['cancelled']
          }
        }
      });

      if (conflictCheck) {
        return NextResponse.json(
          { error: 'This time slot is already booked' },
          { status: 409 }
        );
      }
    }

    // Update appointment
    const appointment = await prisma.appointments.update({
      where: { id },
      data: {
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined
      },
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

// DELETE an appointment
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

    // Check if appointment exists
    const existingAppointment = await prisma.appointments.findUnique({
      where: { id }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Delete appointment
    await prisma.appointments.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}