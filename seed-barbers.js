// Script to seed barbers in the database
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function seedBarbers() {
  console.log('Seeding barbers...');

  const barbers = [
    {
      name: 'Alex',
      email: 'alex@barberella.com',
      phone: '+1234567890',
      is_active: true,
      specialties: ['Classic Cuts', 'Beard Styling'],
      rating: 4.8,
      availability: {
        monday: { start: '09:00', end: '19:00' },
        tuesday: { start: '09:00', end: '19:00' },
        wednesday: { start: '09:00', end: '19:00' },
        thursday: { start: '09:00', end: '19:00' },
        friday: { start: '09:00', end: '19:00' },
        saturday: { start: '09:00', end: '17:00' }
      }
    },
    {
      name: 'Sam',
      email: 'sam@barberella.com',
      phone: '+1234567891',
      is_active: true,
      specialties: ['Modern Styles', 'Fades'],
      rating: 4.9,
      availability: {
        monday: { start: '09:00', end: '19:00' },
        tuesday: { start: '09:00', end: '19:00' },
        wednesday: { start: '09:00', end: '19:00' },
        thursday: { start: '09:00', end: '19:00' },
        friday: { start: '09:00', end: '19:00' },
        saturday: { start: '09:00', end: '17:00' }
      }
    },
    {
      name: 'Jordan',
      email: 'jordan@barberella.com',
      phone: '+1234567892',
      is_active: true,
      specialties: ['Precision Cuts', 'Hair Design'],
      rating: 4.7,
      availability: {
        monday: { start: '10:00', end: '18:00' },
        tuesday: { start: '10:00', end: '18:00' },
        wednesday: { start: '10:00', end: '18:00' },
        thursday: { start: '10:00', end: '18:00' },
        friday: { start: '10:00', end: '18:00' },
        saturday: { start: '10:00', end: '16:00' }
      }
    }
  ];

  for (const barber of barbers) {
    try {
      // Check if barber already exists
      const existing = await prisma.barbers.findFirst({
        where: { name: barber.name }
      });

      if (!existing) {
        await prisma.barbers.create({
          data: barber
        });
        console.log(`✅ Created barber: ${barber.name}`);
      } else {
        // Update existing barber to ensure they're active
        await prisma.barbers.update({
          where: { id: existing.id },
          data: { is_active: true }
        });
        console.log(`⏭️ Barber already exists and activated: ${barber.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating barber ${barber.name}:`, error.message);
    }
  }

  console.log('✅ Barbers seeded successfully!');
}

seedBarbers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());