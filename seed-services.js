// Script to seed services in the database
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function seedServices() {
  console.log('Seeding services...');

  const services = [
    {
      name: 'Haircut',
      description: 'Professional haircut service',
      duration: 30,
      price: 35,
      is_active: true
    },
    {
      name: 'Beard Trim',
      description: 'Beard trimming and shaping',
      duration: 15,
      price: 15,
      is_active: true
    },
    {
      name: 'Haircut & Beard',
      description: 'Complete grooming package',
      duration: 45,
      price: 45,
      is_active: true
    }
  ];

  for (const service of services) {
    try {
      // Check if service already exists
      const existing = await prisma.services.findFirst({
        where: { name: service.name }
      });

      if (!existing) {
        await prisma.services.create({
          data: service
        });
        console.log(`✅ Created service: ${service.name}`);
      } else {
        console.log(`⏭️ Service already exists: ${service.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating service ${service.name}:`, error.message);
    }
  }

  console.log('✅ Services seeded successfully!');
}

seedServices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());