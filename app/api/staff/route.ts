import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      include: { department: true },
      orderBy: { staffId: 'asc' }
    });
    return NextResponse.json(staff);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Check if this is a single staff creation from the "Add Staff" modal
    if (!body.staff && (body.name || body.staffId)) {
      const { name, staffId, departmentId, designation, email, phone, status } = body;

      if (!name || !staffId || !departmentId) {
        return NextResponse.json({ error: 'Name, Staff ID, and Department are required.' }, { status: 400 });
      }

      // Check if staffId already exists
      const existing = await prisma.staff.findUnique({
        where: { staffId: staffId.trim() }
      });

      if (existing) {
        return NextResponse.json({ error: `Staff ID '${staffId}' already exists.` }, { status: 400 });
      }

      const newStaff = await prisma.$transaction(async (tx) => {
        const created = await tx.staff.create({
          data: {
            staffId: staffId.trim(),
            name: name.trim(),
            departmentId,
            designation: designation?.trim() || 'Assistant Professor',
            email: email?.trim() || null,
            phone: phone?.trim() || null,
            status: status || 'Active'
          },
          include: { department: true }
        });

        await tx.auditLog.create({
          data: {
            adminId: session.user.id,
            action: 'STAFF_CREATED',
            entity: 'Staff',
            entityId: created.id,
            metadata: JSON.stringify({ name: created.name, staffId: created.staffId })
          }
        });

        return created;
      });

      return NextResponse.json(newStaff, { status: 201 });
    }

    // Batch staff import
    const staffList = body.staff;

    if (!staffList || !Array.isArray(staffList) || staffList.length === 0) {
      return NextResponse.json({ error: 'No staff data provided' }, { status: 400 });
    }

    const departments = await prisma.department.findMany();
    const deptMap = new Map((departments as Array<{ name: string; id: string }>).map((d) => [d.name.toLowerCase().trim(), d.id]));

    const existingStaff = await prisma.staff.findMany({
      where: { staffId: { in: staffList.map((s: { staffId: string }) => s.staffId) } },
      select: { id: true, staffId: true }
    });
    const existingStaffMap = new Map((existingStaff as Array<{ staffId: string; id: string }>).map((s) => [s.staffId, s]));

    const report = { total: staffList.length, new: 0, updated: 0, errors: [] as string[] };

    await prisma.$transaction(async (tx: any) => {
      for (const staff of staffList) {
        const deptId = deptMap.get(staff.departmentName.toLowerCase().trim());
        
        if (!deptId) {
          report.errors.push(`Row Skipped: Unknown department '${staff.departmentName}' for Staff ID ${staff.staffId}`);
          continue;
        }

        const existing = existingStaffMap.get(staff.staffId);

        if (existing) {
          await tx.staff.update({
            where: { id: existing.id },
            data: {
              name: staff.name,
              departmentId: deptId,
              designation: staff.designation,
              email: staff.email,
              phone: staff.phone,
            }
          });
          report.updated++;
        } else {
          await tx.staff.create({
            data: {
              staffId: staff.staffId,
              name: staff.name,
              departmentId: deptId,
              designation: staff.designation,
              email: staff.email,
              phone: staff.phone,
            }
          });
          report.new++;
        }
      }

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'STAFF_IMPORT',
          entity: 'Staff',
          metadata: JSON.stringify({ new: report.new, updated: report.updated, errors: report.errors.length })
        }
      });
    });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Staff Route Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}