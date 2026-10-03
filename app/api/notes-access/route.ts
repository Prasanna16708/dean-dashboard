import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const adminId = session.user.id;

    const { noteId, targetType, targetId } = await request.json();

    if (!noteId || !targetType || !targetId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Check if rule already exists to prevent duplicates
    const existing = await prisma.noteAccess.findFirst({
      where: { noteId, targetType, targetId }
    });

    if (existing) {
      return NextResponse.json({ message: 'Access rule already exists' });
    }

    const access = await prisma.noteAccess.create({
      data: { noteId, targetType, targetId }
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'NOTE_ACCESS_GRANTED',
        entity: 'NoteAccess',
        metadata: JSON.stringify({ noteId, targetType, targetId })
      }
    });

    return NextResponse.json(access);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}