import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const actions = await prisma.disciplinaryAction.findMany({
      include: {
        student: {
          include: { department: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(actions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { studentId, date, reason, actionTaken } = body;

    if (!studentId || !date || !reason || !actionTaken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const action = await prisma.$transaction(async (tx: any) => {
      const newAction = await tx.disciplinaryAction.create({
        data: {
          studentId,
          date: new Date(date),
          reason,
          actionTaken
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'DISCIPLINARY_ACTION_CREATED',
          entity: 'DisciplinaryAction',
          entityId: newAction.id,
          metadata: JSON.stringify({ studentId, reason, actionTaken })
        }
      });

      return newAction;
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.disciplinaryAction.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'DISCIPLINARY_ACTION_DELETED',
          entity: 'DisciplinaryAction',
          entityId: id,
          metadata: JSON.stringify({ deletedAt: new Date().toISOString() })
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Disciplinary record deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}