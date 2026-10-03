import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as xlsx from 'xlsx';
import { findOrCreateDepartment } from '@/lib/departmentHelper';

interface StaffInput {
  staffId: string;
  name: string;
  departmentName: string;
  designation: string;
  email?: string;
  phone?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let staffList: StaffInput[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      staffList = body.staff || [];
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded in form data' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const workbook = xlsx.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rawData = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName], { defval: '' });

      staffList = rawData.map((row: any, idx: number) => {
        let staffId = String(row['Staff ID'] || row['ID'] || row['Emp ID'] || row['staffId'] || row['Faculty ID'] || row['Emp Code'] || row['S.No'] || '').trim();
        const name = String(row['Staff Name'] || row['Name'] || row['name'] || row['Faculty Name'] || row['Teacher Name'] || '').trim();
        const departmentName = String(row['Department'] || row['Dept'] || row['department'] || row['Branch'] || 'General Engineering').trim();
        const designation = String(row['Designation'] || row['Role'] || row['designation'] || row['Post'] || 'Faculty').trim();
        const email = row['Email'] || row['email'] || row['Mail'] ? String(row['Email'] || row['email'] || row['Mail']).trim() : undefined;
        const phone = row['Phone'] || row['phone'] || row['Mobile'] ? String(row['Phone'] || row['phone'] || row['Mobile']).trim() : undefined;

        if (!staffId && name) {
          staffId = `STF-${String(idx + 101).padStart(4, '0')}`;
        }

        return { staffId, name, departmentName, designation, email, phone };
      }).filter((r: StaffInput) => r.staffId && r.name);
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type. Use application/json or multipart/form-data' }, { status: 400 });
    }

    if (!staffList || staffList.length === 0) {
      return NextResponse.json({ error: 'No valid staff records found to import' }, { status: 400 });
    }

    // Fetch existing staff for update matching
    const existingStaff = await prisma.staff.findMany({
      where: { staffId: { in: staffList.map(s => s.staffId) } },
      select: { id: true, staffId: true }
    });
    const existingStaffMap = new Map(existingStaff.map(s => [s.staffId.toLowerCase().trim(), s]));

    const report = {
      total: staffList.length,
      new: 0,
      updated: 0,
      errors: [] as string[]
    };

    const deptCache = new Map<string, string>();

    await prisma.$transaction(async (tx) => {
      for (const item of staffList) {
        const rawDept = item.departmentName || 'General Engineering';
        let deptId = deptCache.get(rawDept.toLowerCase().trim());

        if (!deptId) {
          deptId = await findOrCreateDepartment(rawDept, tx);
          if (deptId) {
            deptCache.set(rawDept.toLowerCase().trim(), deptId);
          }
        }

        if (!deptId) {
          report.errors.push(`Row Skipped: Missing department for Staff ID ${item.staffId} (${item.name})`);
          continue;
        }

        const existing = existingStaffMap.get(item.staffId.toLowerCase().trim());

        if (existing) {
          await tx.staff.update({
            where: { id: existing.id },
            data: {
              name: item.name,
              departmentId: deptId,
              designation: item.designation || 'Faculty',
              email: item.email || null,
              phone: item.phone || null,
              status: 'Active'
            }
          });
          report.updated++;
        } else {
          await tx.staff.create({
            data: {
              staffId: item.staffId,
              name: item.name,
              departmentId: deptId,
              designation: item.designation || 'Faculty',
              email: item.email || null,
              phone: item.phone || null,
              status: 'Active'
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
          metadata: JSON.stringify({
            total: report.total,
            new: report.new,
            updated: report.updated,
            errorsCount: report.errors.length
          })
        }
      });
    });

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    console.error("Staff Import Route Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
