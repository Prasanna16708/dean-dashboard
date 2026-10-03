import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      select: {
        id: true,
        name: true,
        staffId: true,
        designation: true
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}