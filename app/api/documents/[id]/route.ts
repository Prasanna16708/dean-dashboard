import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const doc = await prisma.facultyDocument.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.facultyDocument.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'FACULTY_DOCUMENT_DELETED',
          entity: 'FacultyDocument',
          entityId: id,
          metadata: JSON.stringify({ name: doc.name })
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
