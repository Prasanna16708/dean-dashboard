import prisma from '@/lib/prisma';
import { DepartmentsView, DepartmentRow } from '@/components/dashboard/DepartmentsView';

export default async function DepartmentsPage() {
  // Fetch departments with count of active students
  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { students: { where: { status: 'Active' } } }
      }
    },
    orderBy: { name: 'asc' }
  });

  const formattedData: DepartmentRow[] = departments.map(dept => ({
    id: dept.id,
    name: dept.name,
    headOfDept: dept.headOfDept || 'Not Assigned',
    activeStudents: dept._count.students
  }));

  return (
    <div className="animate-in fade-in duration-500">
      <DepartmentsView initialDepartments={formattedData} />
    </div>
  );
}