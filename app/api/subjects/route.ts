import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const year = searchParams.get('year');

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (year) where.year = year;

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { code, name, departmentId, year, semester } = body;

    const subject = await prisma.subject.create({
      data: { code, name, departmentId, year, semester: Number(semester) }
    });

    return NextResponse.json(subject);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}