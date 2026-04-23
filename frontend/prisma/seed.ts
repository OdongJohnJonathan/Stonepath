import "dotenv/config";
import { PrismaClient } from '@prisma/client';

// Prisma 7 requires explicit datasourceUrl when engine type is "client"
// @ts-ignore
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('Seeding database...');

  // 1. Create Roles
  await prisma.roles.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Admin' },
  });

  await prisma.roles.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Agent' },
  });

  // 2. Create a Test Agent
  const testAgent = await prisma.users.upsert({
    where: { email: 'agent@stonepath.com' },
    update: {},
    create: {
      first_name: 'Jonathan',
      last_name: 'Dev',
      email: 'agent@stonepath.com',
      password_hash: 'secured_hash_here', 
      role: 2, 
      is_verified: true,
    },
  });

  // 3. Create Property Types
  await prisma.property_types.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Residential', slug: 'residential' },
  });

  // 4. Create a Sample Property
  await prisma.properties.create({
    data: {
      title: 'Modern Villa in Kololo',
      description: 'A stunning 5-bedroom villa with a pool and city view.',
      location: 'Kololo, Kampala',
      address: 'Plot 12, Summit View Road',
      bedrooms: 5,
      bathrooms: 4,
      square_footage: 4500,
      status: 'approved',
      property_type_id: 1,
      created_by: testAgent.id,
      images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811'],
      amenities: { pool: true, security: "24/7", solar: true }
    },
  });

  console.log('✅ Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });