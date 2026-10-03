import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            students: { where: { status: 'Active' } },
            staff: { where: { status: 'Active' } },
            subjects: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(departments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, headOfDept } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Department name is required.' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedHead = headOfDept && typeof headOfDept === 'string' && headOfDept.trim() ? headOfDept.trim() : null;

    // Check if department name already exists
    const existing = await prisma.department.findUnique({
      where: { name: trimmedName }
    });

    if (existing) {
      return NextResponse.json({ error: `Department "${trimmedName}" already exists.` }, { status: 409 });
    }

    // Create department
    const newDepartment = await prisma.$transaction(async (tx) => {
      const dept = await tx.department.create({
        data: {
          name: trimmedName,
          headOfDept: trimmedHead
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'DEPARTMENT_CREATED',
          entity: 'Department',
          entityId: dept.id,
          metadata: JSON.stringify({ name: dept.name, headOfDept: dept.headOfDept })
        }
      });

      return dept;
    });

    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error: any) {
    console.error("Department Creation Error:", error);
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A department with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create department.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required.' }, { status: 400 });
    }

    // Check if department has students or staff
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true, staff: true, subjects: true }
        }
      }
    });

    if (!dept) {
      return NextResponse.json({ error: 'Department not found.' }, { status: 404 });
    }

    if (dept._count.students > 0 || dept._count.staff > 0) {
      return NextResponse.json({ 
        error: `Cannot delete department "${dept.name}" because it still has ${dept._count.students} students and ${dept._count.staff} staff members assigned.` 
      }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.department.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'DEPARTMENT_DELETED',
          entity: 'Department',
          entityId: id,
          metadata: JSON.stringify({ name: dept.name })
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error: any) {
    console.error("Department Deletion Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to delete department.' }, { status: 500 });
  }
}