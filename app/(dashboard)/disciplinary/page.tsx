export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { DisciplinaryTable, DisciplinaryRow } from '@/components/dashboard/DisciplinaryTable';
import { Plus, ShieldAlert } from 'lucide-react';

export default async function DisciplinaryPage() {
  // Fetch disciplinary actions with student and department relations
  const rawActions = await prisma.disciplinaryAction.findMany({
    include: {
      student: {
        include: { department: true }
      }
    },
    orderBy: { date: 'desc' }
  });

  const actions: DisciplinaryRow[] = rawActions.map((item) => ({
    id: item.id,
    studentId: item.studentId,
    studentName: item.student.name,
    registerNumber: item.student.registerNumber,
    departmentName: item.student.department.name,
    currentYear: item.student.currentYear,
    date: item.date,
    reason: item.reason,
    actionTaken: item.actionTaken,
  }));

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Disciplinary Actions</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Track infractions, hearings, and official administrative actions taken</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/disciplinary/new" 
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Action
          </Link>
        </div>
      </div>

      <DisciplinaryTable initialActions={actions} />
    </div>
  );
}
