import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findOrCreateDepartment } from '@/lib/departmentHelper';

export async function POST(request: Request) {
  try {
    // 1. Security Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const students = body.students;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No student data provided' }, { status: 400 });
    }

    // 2. Find Existing Students to determine Insert vs Update
    const existingStudents = await prisma.student.findMany({
      where: { registerNumber: { in: students.map((s: { registerNumber: string }) => s.registerNumber) } },
      select: { id: true, registerNumber: true }
    });
    const existingRegMap = new Map((existingStudents as Array<{ registerNumber: string; id: string }>).map((s) => [s.registerNumber.toLowerCase().trim(), s]));

    const report = { total: students.length, new: 0, updated: 0, errors: [] as string[] };
    const deptCache = new Map<string, string>();

    // 3. Execute Transaction
    await prisma.$transaction(async (tx: any) => {
      for (const student of students) {
        const rawDeptName = student.departmentName || 'General Engineering';
        
        let deptId = deptCache.get(rawDeptName.toLowerCase().trim());
        if (!deptId) {
          deptId = await findOrCreateDepartment(rawDeptName, tx);
          if (deptId) {
            deptCache.set(rawDeptName.toLowerCase().trim(), deptId);
          }
        }

        if (!deptId) {
          report.errors.push(`Row Skipped: Missing department for Register No ${student.registerNumber}`);
          continue;
        }

        const existing = existingRegMap.get(student.registerNumber.toLowerCase().trim());

        if (existing) {
          // Update Existing
          await tx.student.update({
            where: { id: existing.id },
            data: {
              name: student.name,
              departmentId: deptId,
              batch: student.batch || '2024-2028',
              currentYear: student.currentYear || 'I',
              email: student.email || null,
              phone: student.phone || null,
              status: 'Active'
            }
          });
          report.updated++;
        } else {
          // Create New
          await tx.student.create({
            data: {
              registerNumber: student.registerNumber,
              name: student.name,
              departmentId: deptId,
              batch: student.batch || '2024-2028',
              currentYear: student.currentYear || 'I',
              email: student.email || null,
              phone: student.phone || null,
              status: 'Active'
            }
          });
          report.new++;
        }
      }

      // 4. Audit Logging
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'STUDENT_IMPORT',
          entity: 'Student',
          metadata: JSON.stringify({ new: report.new, updated: report.updated, errors: report.errors.length })
        }
      });
    });

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    console.error("Student Import Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}