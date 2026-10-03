import prisma from '@/lib/prisma';
import { Table } from '@/components/ui/Table';

export default async function NotesAccessPage() {
  // Fetch all notes with their existing access rules
  const notes = await prisma.classNote.findMany({
    include: {
      subject: true,
      access: true
    },
    orderBy: { uploadedAt: 'desc' }
  });

  const rows = notes.map((row: any) => ({
    ...row,
    subjectName: row.subject.name,
    targetAudience: `${row.batch} (${row.year})`,
    activeRulesText: `${row.access.length} Permission(s)`
  }));

  const columns = [
    { header: 'Note Name', accessor: 'name' as const },
    { header: 'Subject', accessor: 'subjectName' as const },
    { header: 'Target Audience', accessor: 'targetAudience' as const },
    { header: 'Active Rules', accessor: 'activeRulesText' as const },
    { header: 'Actions', accessor: 'id' as const }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 border-b border-border-light dark:border-border-dark pb-6">
        <h1 className="text-3xl font-light tracking-wide">Notes Access Control</h1>
        <p className="text-sm text-gray-500 mt-2 tracking-wide">Configure which batches and students can view specific materials.</p>
      </div>

      <Table 
        data={rows} 
        columns={columns} 
        keyField="id"
        emptyMessage="No class notes available to manage."
      />
    </div>
  );
}