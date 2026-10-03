export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { StaffTable, StaffRow } from '@/components/dashboard/StaffTable';
import { ExportButton } from '@/components/ui/ExportButton';
import { Upload } from 'lucide-react';

export default async function StaffPage({
  searchParams
}: {
  searchParams: Promise<{ department?: string, search?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const { department, search } = resolvedSearchParams;

  // Fetch departments for dropdown
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Dynamic filter query
  const whereClause: any = {};
  if (department) whereClause.department = { name: department };
  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { staffId: { contains: search } }
    ];
  }

  // Fetch staff data securely
  const rawStaff = await prisma.staff.findMany({
    where: whereClause,
    include: { department: true },
    orderBy: { staffId: 'asc' }
  });

  const staff: StaffRow[] = rawStaff.map((s) => ({
    id: s.id,
    staffId: s.staffId,
    name: s.name,
    departmentId: s.departmentId,
    departmentName: s.department.name,
    designation: s.designation,
    email: s.email,
    phone: s.phone,
    status: s.status,
  }));

  const exportStaff = staff.map((s) => ({
    'Staff ID': s.staffId,
    'Name': s.name,
    'Department': s.departmentName,
    'Designation': s.designation,
    'Email': s.email || '—',
    'Phone': s.phone || '—',
    'Status': s.status,
  }));

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Manage faculty and administrative personnel</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={exportStaff} filename="staff" />
          <Link 
            href="/staff/import" 
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-all text-sm font-medium shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </Link>
        </div>
      </div>

      <StaffTable 
        initialStaff={staff} 
        departments={departments} 
      />
    </div>
  );
}
