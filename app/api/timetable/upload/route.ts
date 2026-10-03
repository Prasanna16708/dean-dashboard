import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveFile } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const staffId = formData.get('staffId') as string;
    const actionType = formData.get('actionType') as string; // 'replace' or 'new_version'

    if (!file || !staffId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save physical file
    const fileData = await saveFile(buffer, file.name, 'timetables');

    await prisma.$transaction(async (tx: any) => {
      let currentVersion = 1;
      
      const existingLatest = await tx.facultyTimetable.findFirst({
        where: { staffId },
        orderBy: { version: 'desc' }
      });

      if (existingLatest) {
        if (actionType === 'replace') {
          currentVersion = existingLatest.version;
          // Delete old record to replace it
          await tx.facultyTimetable.delete({ where: { id: existingLatest.id } });
        } else {
          currentVersion = existingLatest.version + 1;
        }
      }

      const newTimetable = await tx.facultyTimetable.create({
        data: {
          staffId,
          version: currentVersion,
          fileUrl: fileData.fileUrl,
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'TIMETABLE_UPLOADED',
          entity: 'FacultyTimetable',
          entityId: newTimetable.id,
          metadata: JSON.stringify({ staffId, version: currentVersion, actionType })
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}