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
    const name = formData.get('name') as string;
    const staffName = (formData.get('staffName') as string) || '';
    const description = (formData.get('description') as string) || '';
    const subjectIdRaw = (formData.get('subjectId') as string) || '';
    const subjectNameRaw = (formData.get('subjectName') as string) || '';
    const departmentId = formData.get('departmentId') as string;
    const batch = (formData.get('batch') as string) || '2024-2028';
    const year = (formData.get('year') as string) || 'I';

    if (!file || !name || !departmentId) {
      return NextResponse.json({ error: 'Missing required fields (file, title, department).' }, { status: 400 });
    }

    // Resolve or Auto-Create Subject
    let resolvedSubjectId = subjectIdRaw;

    if (resolvedSubjectId) {
      const existing = await prisma.subject.findUnique({
        where: { id: resolvedSubjectId }
      });
      if (!existing) {
        resolvedSubjectId = '';
      }
    }

    if (!resolvedSubjectId) {
      const subjectNameToUse = subjectNameRaw.trim() || subjectIdRaw.trim() || 'General Engineering';
      
      // Try to find subject by name within department
      let existingByName = await prisma.subject.findFirst({
        where: {
          departmentId,
          name: { equals: subjectNameToUse }
        }
      });

      if (existingByName) {
        resolvedSubjectId = existingByName.id;
      } else {
        // Create subject
        const dept = await prisma.department.findUnique({ where: { id: departmentId } });
        const prefix = (dept?.name || 'GEN').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
        const code = `${prefix}${Math.floor(100 + Math.random() * 900)}`;

        const createdSubject = await prisma.subject.create({
          data: {
            name: subjectNameToUse,
            code,
            departmentId,
            year: year || 'I',
            semester: year === 'I' ? 1 : year === 'II' ? 3 : year === 'III' ? 5 : 7
          }
        });
        resolvedSubjectId = createdSubject.id;
      }
    }

    // 15MB limit enforcement
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 15MB limit.' }, { status: 400 });
    }

    // Convert file to buffer for Node.js fs operations
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save the physical file
    const fileData = await saveFile(buffer, file.name, 'class-notes');

    // Create DB record and Audit Log
    const note = await prisma.$transaction(async (tx: any) => {
      const newNote = await tx.classNote.create({
        data: {
          name,
          description,
          staffName: staffName.trim() || null,
          fileUrl: fileData.fileUrl,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
          subjectId: resolvedSubjectId,
          departmentId,
          batch,
          year,
        },
        include: {
          department: true,
          subject: true
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'NOTE_UPLOADED',
          entity: 'ClassNote',
          entityId: newNote.id,
          metadata: JSON.stringify({ name: newNote.name, subject: newNote.subject.name, staffName: newNote.staffName })
        }
      });

      return newNote;
    });

    return NextResponse.json(note, { status: 200 });
  } catch (error: any) {
    console.error("Note Upload Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}