import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Since we don't have a settings table, return hardcoded values
const DEFAULT_SETTINGS = {
  id: '1',
  shop_name: 'Barberella',
  opening_time: '09:00',
  closing_time: '19:00',
  slot_duration: 30,
  days_open: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  max_advance_days: 30,
  created_at: new Date(),
  updated_at: new Date()
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get barbers from the database
    const barbers = await prisma.barbers.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      settings: DEFAULT_SETTINGS,
      barbers
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, just return the updated settings without persisting
    // In production, you'd want to store these in the database
    const body = await req.json();

    const updatedSettings = {
      ...DEFAULT_SETTINGS,
      ...body,
      updated_at: new Date()
    };

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}