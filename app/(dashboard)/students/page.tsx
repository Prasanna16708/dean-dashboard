import prisma from '@/lib/prisma';
import Link from 'next/link';
import { StudentsTable, StudentRow } from '@/components/dashboard/StudentsTable';
import { ExportButton } from '@/components/ui/ExportButton';
import { Upload } from 'lucide-react';

export default async function StudentsPage({
  searchParams
}: {
  searchParams: Promise<{ department?: string, year?: string, search?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const { department, year, search } = resolvedSearchParams;

  // Fetch departments for dropdown
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Build the dynamic filter query based on URL parameters if provided
  const whereClause: any = {};
  if (department) whereClause.department = { name: department };
  if (year) whereClause.currentYear = year;
  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { registerNumber: { contains: search } }
    ];
  }

  // Fetch initial student data sorted by department name and register number
  const rawStudents = await prisma.student.findMany({
    where: whereClause,
    include: { department: true },
    orderBy: [
      { department: { name: 'asc' } },
      { registerNumber: 'asc' }
    ]
  });

  const students: StudentRow[] = rawStudents.map((s) => ({
    id: s.id,
    registerNumber: s.registerNumber,
    name: s.name,
    departmentId: s.departmentId,
    departmentName: s.department.name,
    currentYear: s.currentYear,
    batch: s.batch,
    email: s.email,
    phone: s.phone,
    status: s.status,
  }));

  const exportStudents = students.map((s) => ({
    'Register Number': s.registerNumber,
    'Name': s.name,
    'Department': s.departmentName,
    'Current Year': s.currentYear,
    'Batch': s.batch,
    'Email': s.email || '—',
    'Phone': s.phone || '—',
    'Status': s.status,
  }));

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Students</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Manage active, promoted, and archived student records</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={exportStudents} filename="students" />
          <Link 
            href="/students/import" 
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-all text-sm font-medium shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </Link>
        </div>
      </div>

      <StudentsTable 
        initialStudents={students} 
        departments={departments} 
      />
    </div>
  );
}