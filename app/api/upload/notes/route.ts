import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveFile } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const staffName = (formData.get('staffName') as string) || '';
    const description = (formData.get('description') as string) || '';
    const subjectId = formData.get('subjectId') as string;
    const departmentId = formData.get('departmentId') as string;
    const batch = formData.get('batch') as string;
    const year = formData.get('year') as string;

    if (!file || !name || !subjectId || !departmentId || !batch || !year) {
      return NextResponse.json({ error: 'Missing required fields (file, name, subjectId, departmentId, batch, year).' }, { status: 400 });
    }

    // 10MB limit enforcement
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save physical file
    const fileData = await saveFile(buffer, file.name, 'class-notes');

    // Create DB record and Audit Log in a transaction
    const note = await prisma.$transaction(async (tx: any) => {
      const newNote = await tx.classNote.create({
        data: {
          name,
          description,
          staffName: staffName.trim() || null,
          fileUrl: fileData.fileUrl,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
          subjectId,
          departmentId,
          batch,
          year,
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'NOTE_UPLOADED',
          entity: 'ClassNote',
          entityId: newNote.id,
          metadata: JSON.stringify({ name: newNote.name, batch: newNote.batch, year: newNote.year })
        }
      });

      return newNote;
    });

    return NextResponse.json(note, { status: 200 });
  } catch (error: any) {
    console.error("Upload Notes Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
