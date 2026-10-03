import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: { department: true },
      orderBy: [
        { department: { name: 'asc' } },
        { registerNumber: 'asc' }
      ]
    });
    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, registerNumber, departmentId, currentYear, batch, email, phone, status } = body;

    if (!name || !registerNumber || !departmentId || !currentYear || !batch) {
      return NextResponse.json({ error: 'Register Number, Student Name, Department, Year, and Batch are required.' }, { status: 400 });
    }

    // Check if Register Number already exists
    const existing = await prisma.student.findUnique({
      where: { registerNumber: registerNumber.trim() }
    });

    if (existing) {
      return NextResponse.json({ error: `Register Number '${registerNumber}' already exists.` }, { status: 400 });
    }

    const newStudent = await prisma.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: {
          registerNumber: registerNumber.trim(),
          name: name.trim(),
          departmentId,
          currentYear: currentYear || 'I',
          batch: batch.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          status: status || 'Active'
        },
        include: { department: true }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'STUDENT_CREATED',
          entity: 'Student',
          entityId: created.id,
          metadata: JSON.stringify({ name: created.name, registerNumber: created.registerNumber })
        }
      });

      return created;
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    console.error("Student Creation Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
