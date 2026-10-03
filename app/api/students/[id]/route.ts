import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { department: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, registerNumber, departmentId, currentYear, batch, email, phone, status } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id },
        data: {
          name,
          registerNumber,
          departmentId,
          currentYear,
          batch,
          email,
          phone,
          status,
        },
        include: { department: true }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'STUDENT_UPDATED',
          entity: 'Student',
          entityId: id,
          metadata: JSON.stringify({ name: student.name, registerNumber: student.registerNumber })
        }
      });

      return student;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Student Update Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      // Delete child records first to prevent foreign key violations
      await tx.studentAttendance.deleteMany({ where: { studentId: id } });
      await tx.disciplinaryAction.deleteMany({ where: { studentId: id } });
      
      const deletedStudent = await tx.student.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'STUDENT_DELETED',
          entity: 'Student',
          entityId: id,
          metadata: JSON.stringify({ name: deletedStudent.name, registerNumber: deletedStudent.registerNumber })
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    console.error("Student Delete Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to delete student' }, { status: 500 });
  }
}
