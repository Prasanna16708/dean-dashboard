import prisma from '@/lib/prisma';
import { BackupsTable, BackupRow } from '@/components/dashboard/BackupsTable';

export default async function BackupsPage() {
  const rawBackups = await prisma.backupMetadata.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const backups: BackupRow[] = rawBackups.map(b => ({
    id: b.id,
    filename: b.filename,
    size: b.size,
    type: b.type,
    status: b.status,
    createdAt: b.createdAt.toISOString()
  }));

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="border-b border-border-light dark:border-border-dark pb-6">
        <h1 className="text-3xl font-light tracking-wide text-black dark:text-white">System Backups</h1>
        <p className="text-sm text-gray-500 mt-2 tracking-wide">
          Generate, download, restore, or manage SQLite database snapshots and disaster recovery points.
        </p>
      </div>

      <BackupsTable initialBackups={backups} />
    </div>
  );
}