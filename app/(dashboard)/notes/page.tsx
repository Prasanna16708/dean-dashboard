import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Table } from '@/components/ui/Table';
import { Upload, Download, FileText } from 'lucide-react';

export default async function NotesPage() {
  const notes = await prisma.classNote.findMany({
    include: {
      department: true,
      subject: true,
    },
    orderBy: { uploadedAt: 'desc' }
  });

  const rows = notes.map((row: any) => ({
    ...row,
    facultyText: row.staffName || '—',
    subjectName: row.subject?.name || 'General',
    departmentName: row.department?.name || 'General Engineering',
    batchYear: `${row.batch} (${row.year} Year)`,
    sizeText: `${(row.fileSize / 1024 / 1024).toFixed(2)} MB`,
    uploadedDateText: new Date(row.uploadedAt).toLocaleDateString()
  }));

  const columns = [
    { 
      header: 'Note Title', 
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="font-medium text-black dark:text-white">{row.name}</span>
        </div>
      )
    },
    { header: 'Faculty / Staff', accessor: 'facultyText' as const },
    { header: 'Subject', accessor: 'subjectName' as const },
    { header: 'Department', accessor: 'departmentName' as const },
    { header: 'Batch / Year', accessor: 'batchYear' as const },
    { header: 'Size', accessor: 'sizeText' as const },
    { header: 'Uploaded', accessor: 'uploadedDateText' as const },
    { 
      header: 'Actions', 
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <a
            href={row.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            title="Download Note"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Class Notes</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Manage academic materials, lectures, and documents (up to 15MB)</p>
        </div>
        <Link 
          href="/notes/upload" 
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity text-sm font-medium shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Upload Note
        </Link>
      </div>

      <Table 
        data={rows} 
        columns={columns} 
        keyField="id"
        emptyMessage="No class notes have been uploaded yet."
      />
    </div>
  );
}