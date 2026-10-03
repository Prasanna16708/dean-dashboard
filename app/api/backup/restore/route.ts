import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { restoreDatabaseBackup } from '@/lib/services/backupService';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminId = session.user.id;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing backup ID' }, { status: 400 });
    }

    const result = await restoreDatabaseBackup(id);

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'BACKUP_RESTORED',
        entity: 'Backup',
        entityId: id,
        metadata: JSON.stringify({ filename: result.filename })
      }
    });

    return NextResponse.json({ success: true, filename: result.filename });
  } catch (error: any) {
    console.error('Error in backup restore API:', error);
    return NextResponse.json({ error: error.message || 'Failed to restore backup' }, { status: 500 });
  }
}
