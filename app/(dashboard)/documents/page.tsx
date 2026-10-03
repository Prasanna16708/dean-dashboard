import prisma from '@/lib/prisma';
import Link from 'next/link';
import { DocumentsTable, DocumentRow } from '@/components/dashboard/DocumentsTable';
import { Plus } from 'lucide-react';

export default async function FacultyDocumentsPage() {
  const documents = await prisma.facultyDocument.findMany({
    include: {
      staff: {
        include: { department: true }
      }
    },
    orderBy: { uploadedAt: 'desc' }
  });

  const rows: DocumentRow[] = documents.map((row) => ({
    id: row.id,
    name: row.name,
    fileUrl: row.fileUrl,
    uploadedAt: row.uploadedAt,
    facultyName: row.staff.name,
    staffId: row.staff.staffId,
    departmentName: row.staff.department.name,
  }));

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex justify-between items-center border-b border-border-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Faculty Documents</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Manage administrative records and certifications</p>
        </div>
        <Link 
          href="/documents/upload" 
          className="flex items-center gap-2 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Document
        </Link>
      </div>

      <DocumentsTable initialDocs={rows} />
    </div>
  );
}