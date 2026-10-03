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
    const staffMember = await prisma.staff.findUnique({
      where: { id },
      include: { department: true }
    });

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json(staffMember);
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
    const { name, staffId, departmentId, designation, email, phone, status } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const staffMember = await tx.staff.update({
        where: { id },
        data: {
          name,
          staffId,
          departmentId,
          designation,
          email,
          phone,
          status,
        },
        include: { department: true }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'STAFF_UPDATED',
          entity: 'Staff',
          entityId: id,
          metadata: JSON.stringify({ name: staffMember.name, staffId: staffMember.staffId })
        }
      });

      return staffMember;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Staff Update Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to update staff record' }, { status: 500 });
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
      await tx.staffAttendance.deleteMany({ where: { staffId: id } });
      await tx.facultyDocument.deleteMany({ where: { staffId: id } });
      await tx.facultyTimetable.deleteMany({ where: { staffId: id } });

      const deletedStaff = await tx.staff.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'STAFF_DELETED',
          entity: 'Staff',
          entityId: id,
          metadata: JSON.stringify({ name: deletedStaff.name, staffId: deletedStaff.staffId })
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error: any) {
    console.error("Staff Delete Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to delete staff member' }, { status: 500 });
  }
}
