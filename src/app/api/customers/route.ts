import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET all customers with optional search
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone_number: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, totalCount] = await Promise.all([
      prisma.customers.findMany({
        where,
        orderBy: [
          { last_visit: 'desc' },
          { name: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.customers.count({ where })
    ]);

    // Get appointment history for each customer
    const customersWithHistory = await Promise.all(
      customers.map(async (customer: any) => {
        const appointments = await prisma.appointments.findMany({
          where: { phone_number: customer.phone_number },
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            barber: {
              select: { name: true }
            }
          }
        });

        const totalSpent = await prisma.appointments.aggregate({
          where: {
            phone_number: customer.phone_number,
            status: 'completed'
          },
          _sum: {
            price: true
          }
        });

        return {
          ...customer,
          recent_appointments: appointments,
          total_spent: totalSpent._sum.price || 0
        };
      })
    );

    return NextResponse.json({
      customers: customersWithHistory,
      totalCount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST create or update a customer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone_number, email, notes } = body;

    if (!name || !phone_number) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customers.upsert({
      where: { phone_number },
      update: {
        name,
        email,
        notes
      },
      create: {
        name,
        phone_number,
        email,
        notes
      }
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create/update customer' },
      { status: 500 }
    );
  }
}

// PUT update a customer
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
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customers.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}