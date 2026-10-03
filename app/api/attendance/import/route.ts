import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, attendanceRecords, departmentId, departmentName, year, date } = body;

    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return NextResponse.json({ error: 'No attendance data provided' }, { status: 400 });
    }

    const report = { total: attendanceRecords.length, new: 0, updated: 0, errors: [] as string[] };

    await prisma.$transaction(async (tx) => {
      // Resolve Department ID if provided as name
      let resolvedDeptId = departmentId;
      if (!resolvedDeptId && departmentName) {
        let dept = await tx.department.findUnique({ where: { name: departmentName.trim() } });
        if (!dept) {
          dept = await tx.department.create({ data: { name: departmentName.trim() } });
        }
        resolvedDeptId = dept.id;
      }

      const defaultYear = year || 'I';
      const fallbackDate = date ? new Date(date) : new Date();

      if (type === 'Student') {
        // Fetch all students for matching
        const allStudents = await tx.student.findMany({
          select: { id: true, registerNumber: true, name: true, departmentId: true }
        });
        const studentRegMap = new Map(allStudents.map(s => [s.registerNumber.toLowerCase().trim(), s]));
        const studentNameMap = new Map(allStudents.map(s => [s.name.toLowerCase().trim(), s]));

        for (const record of attendanceRecords) {
          const cleanIdentifier = String(record.identifier).trim();
          const cleanName = String(record.name || cleanIdentifier).trim();

          let student = studentRegMap.get(cleanIdentifier.toLowerCase());
          if (!student && cleanName) {
            student = studentNameMap.get(cleanName.toLowerCase());
          }

          // If student doesn't exist yet, auto-create them if department is known
          if (!student) {
            if (resolvedDeptId) {
              const newStudent = await tx.student.create({
                data: {
                  registerNumber: cleanIdentifier,
                  name: cleanName,
                  departmentId: resolvedDeptId,
                  batch: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
                  currentYear: defaultYear,
                  status: 'Active'
                }
              });
              student = newStudent;
              studentRegMap.set(cleanIdentifier.toLowerCase(), newStudent);
            } else {
              report.errors.push(`Skipped: Register No "${cleanIdentifier}" not found. Please specify Department on the import page to auto-enroll.`);
              continue;
            }
          }

          // Date normalization (12:00 UTC)
          const recordDate = record.date ? new Date(record.date) : new Date(fallbackDate);
          recordDate.setHours(12, 0, 0, 0);

          const existing = await tx.studentAttendance.findUnique({
            where: { studentId_date: { studentId: student.id, date: recordDate } }
          });

          if (existing) {
            await tx.studentAttendance.update({
              where: { id: existing.id },
              data: { status: record.status }
            });
            report.updated++;
          } else {
            await tx.studentAttendance.create({
              data: { studentId: student.id, date: recordDate, status: record.status }
            });
            report.new++;
          }
        }
      } else if (type === 'Staff') {
        const allStaff = await tx.staff.findMany({
          select: { id: true, staffId: true, name: true }
        });
        const staffMap = new Map(allStaff.map(s => [s.staffId.toLowerCase().trim(), s]));

        for (const record of attendanceRecords) {
          const cleanIdentifier = String(record.identifier).trim();
          let staffMember = staffMap.get(cleanIdentifier.toLowerCase());

          if (!staffMember) {
            if (resolvedDeptId) {
              const newStaff = await tx.staff.create({
                data: {
                  staffId: cleanIdentifier,
                  name: record.name || cleanIdentifier,
                  departmentId: resolvedDeptId,
                  designation: 'Faculty',
                  status: 'Active'
                }
              });
              staffMember = newStaff;
              staffMap.set(cleanIdentifier.toLowerCase(), newStaff);
            } else {
              report.errors.push(`Skipped: Staff ID "${cleanIdentifier}" not found.`);
              continue;
            }
          }

          const recordDate = record.date ? new Date(record.date) : new Date(fallbackDate);
          recordDate.setHours(12, 0, 0, 0);

          const existing = await tx.staffAttendance.findUnique({
            where: { staffId_date: { staffId: staffMember.id, date: recordDate } }
          });

          if (existing) {
            await tx.staffAttendance.update({
              where: { id: existing.id },
              data: { status: record.status }
            });
            report.updated++;
          } else {
            await tx.staffAttendance.create({
              data: { staffId: staffMember.id, date: recordDate, status: record.status }
            });
            report.new++;
          }
        }
      }

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: `${type.toUpperCase()}_ATTENDANCE_IMPORT`,
          entity: `${type}Attendance`,
          metadata: JSON.stringify({
            total: report.total,
            new: report.new,
            updated: report.updated,
            errors: report.errors.length,
            department: departmentName || resolvedDeptId,
            year: defaultYear
          })
        }
      });
    });

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    console.error("Attendance Import Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}