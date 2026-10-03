import prisma from '@/lib/prisma';
import { TimetableTable } from '@/components/dashboard/TimetableTable';

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const whereClause = resolvedSearchParams.search ? {
    OR: [
      { name: { contains: resolvedSearchParams.search } },
      { staffId: { contains: resolvedSearchParams.search } }
    ]
  } : {};

  // Fetch staff with their latest timetable version
  const staffWithTimetables = await prisma.staff.findMany({
    where: whereClause,
    include: {
      department: true,
      timetables: {
        orderBy: { version: 'desc' },
        take: 1 // Only show the active/latest version on the main grid
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex justify-between items-center border-b border-border-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Faculty Timetable</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Manage schedules, active versions, and view teacher timetables</p>
        </div>
      </div>

      <TimetableTable initialStaff={staffWithTimetables as any} />
    </div>
  );
}