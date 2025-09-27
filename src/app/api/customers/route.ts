import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unique customers from appointments
    const appointments = await prisma.appointments.findMany({
      select: {
        client_name: true,
        client_phone: true,
        created_at: true,
        service: true,
        status: true,
        start_time: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Group by phone number to get unique customers
    const customersMap = new Map();

    appointments.forEach(apt => {
      if (!customersMap.has(apt.client_phone)) {
        customersMap.set(apt.client_phone, {
          id: apt.client_phone, // Use phone as ID since we don't have a customers table
          name: apt.client_name,
          phone_number: apt.client_phone,
          total_visits: 0,
          completed_visits: 0,
          total_spent: 0,
          last_visit: null,
          created_at: apt.created_at
        });
      }

      const customer = customersMap.get(apt.client_phone);
      customer.total_visits++;

      if (apt.status === 'completed' || apt.status === 'confirmed') {
        customer.completed_visits++;
        customer.total_spent += getServicePrice(apt.service);

        if (!customer.last_visit || apt.start_time > customer.last_visit) {
          customer.last_visit = apt.start_time;
        }
      }

      // Update earliest created_at
      if (apt.created_at < customer.created_at) {
        customer.created_at = apt.created_at;
      }
    });

    const customers = Array.from(customersMap.values())
      .sort((a, b) => b.total_visits - a.total_visits);

    // Apply search filter if provided
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');

    let filteredCustomers = customers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.phone_number.includes(search)
      );
    }

    // Apply pagination
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);

    return NextResponse.json({
      customers: paginatedCustomers,
      totalCount: filteredCustomers.length,
      total: filteredCustomers.length,
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

function getServicePrice(service: string): number {
  const prices: Record<string, number> = {
    'haircut': 30,
    'beard': 20,
    'haircut_and_beard': 45,
    'haircut and beard': 45
  };
  return prices[service] || 30;
}