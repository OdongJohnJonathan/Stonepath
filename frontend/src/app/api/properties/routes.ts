import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // This is the Prisma call to your PostgreSQL 'properties' table
    const properties = await prisma.properties.findMany({
      where: {
        status: 'approved', // Only show approved ones (satisfies Admin requirement)
      },
      orderBy: {
        created_at: 'desc', // Show newest first
      },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}