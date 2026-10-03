import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createDatabaseBackup, deleteBackup } from '@/lib/services/backupService';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminId = session.user.id;

    const backupMeta = await createDatabaseBackup('Manual');

    if (!backupMeta || backupMeta.status === 'Failed') {
      return NextResponse.json({ error: 'Backup generation failed' }, { status: 500 });
    }

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'BACKUP_CREATED',
        entity: 'Backup',
        entityId: backupMeta.id,
        metadata: JSON.stringify({ filename: backupMeta.filename, type: 'Manual' })
      }
    });

    return NextResponse.json(backupMeta);
  } catch (error: any) {
    console.error('Error in backup POST API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing backup ID' }, { status: 400 });
    }

    await deleteBackup(id);

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'BACKUP_DELETED',
        entity: 'Backup',
        entityId: id,
        metadata: JSON.stringify({ backupId: id })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in backup DELETE API:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete backup' }, { status: 500 });
  }
}