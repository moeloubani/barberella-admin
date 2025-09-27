import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    // Allow public access for reading settings (needed for phone booking system)
    // No authentication required for GET requests

    // Get settings from database or create default
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create default settings
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

    // Get barbers from the database
    const barbers = await prisma.barbers.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });

    // Get services from the database
    const services = await prisma.services.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' }
    });

    return NextResponse.json({
      settings,
      barbers,
      services
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

    const body = await req.json();

    // Get existing settings or create new one
    let settings = await prisma.settings.findFirst();

    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          shop_name: body.shop_name || settings.shop_name,
          opening_time: body.opening_time || settings.opening_time,
          closing_time: body.closing_time || settings.closing_time,
          slot_duration: body.slot_duration || settings.slot_duration,
          days_open: body.days_open || settings.days_open,
          max_advance_days: body.max_advance_days || settings.max_advance_days
        }
      });
    } else {
      // Create new settings
      settings = await prisma.settings.create({
        data: {
          shop_name: body.shop_name || 'Barberella',
          opening_time: body.opening_time || '09:00',
          closing_time: body.closing_time || '19:00',
          slot_duration: body.slot_duration || 30,
          days_open: body.days_open || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          max_advance_days: body.max_advance_days || 30
        }
      });
    }

    // Get barbers from the database
    const barbers = await prisma.barbers.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      settings,
      barbers
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}