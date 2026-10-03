import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      where: { status: 'Active' },
      select: { 
        id: true, 
        name: true, 
        registerNumber: true,
        currentYear: true,
        department: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
