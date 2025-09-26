import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET shop settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the first settings record (should only be one)
    let settings = await prisma.settings.findFirst();

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          shop_name: 'Barberella',
          opening_time: '09:00',
          closing_time: '19:00',
          slot_duration: 30,
          days_open: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          max_advance_days: 30
        }
      });
    }

    // Also get barbers list
    const barbers = await prisma.barbers.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      settings,
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

// POST update shop settings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      shop_name,
      opening_time,
      closing_time,
      slot_duration,
      days_open,
      max_advance_days
    } = body;

    // Get existing settings or create if none exist
    let settings = await prisma.settings.findFirst();

    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          shop_name: shop_name ?? settings.shop_name,
          opening_time: opening_time ?? settings.opening_time,
          closing_time: closing_time ?? settings.closing_time,
          slot_duration: slot_duration ?? settings.slot_duration,
          days_open: days_open ?? settings.days_open,
          max_advance_days: max_advance_days ?? settings.max_advance_days
        }
      });
    } else {
      // Create new settings
      settings = await prisma.settings.create({
        data: {
          shop_name: shop_name || 'Barberella',
          opening_time: opening_time || '09:00',
          closing_time: closing_time || '19:00',
          slot_duration: slot_duration || 30,
          days_open: days_open || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          max_advance_days: max_advance_days || 30
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}