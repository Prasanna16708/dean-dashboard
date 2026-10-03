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
    const staffId = formData.get('staffId') as string;

    if (!file || !name || !staffId) {
      return NextResponse.json({ error: 'Missing required fields (file, document name, staffId).' }, { status: 400 });
    }

    // 15MB limit
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 15MB limit.' }, { status: 400 });
    }

    // Read buffer and save physical file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileData = await saveFile(buffer, file.name, 'faculty-documents');

    // Create record in DB
    const doc = await prisma.$transaction(async (tx) => {
      const newDoc = await tx.facultyDocument.create({
        data: {
          name,
          staffId,
          fileUrl: fileData.fileUrl,
        },
        include: {
          staff: {
            include: { department: true }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'FACULTY_DOCUMENT_UPLOADED',
          entity: 'FacultyDocument',
          entityId: newDoc.id,
          metadata: JSON.stringify({ name: newDoc.name, staffId: newDoc.staffId })
        }
      });

      return newDoc;
    });

    return NextResponse.json(doc, { status: 200 });
  } catch (error: any) {
    console.error("Faculty Document Upload Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
