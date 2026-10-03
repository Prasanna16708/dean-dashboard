export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import WelcomeHeader from '@/components/dashboard/WelcomeHeader';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';

export default async function Dashboard() {
  // 1. Protect the route on the server side
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  // 2. Auto-delete activity logs older than 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  await prisma.auditLog.deleteMany({
    where: {
      timestamp: {
        lt: threeDaysAgo
      }
    }
  });

  // 3. Fetch real database metrics and recent activities in parallel
  const [
    deptCount, 
    activeStudents, 
    activeStaff, 
    totalNotes, 
    subjectsData,
    recentActivities
  ] = await Promise.all([
    prisma.department.count(),
    prisma.student.count({ where: { status: 'Active' } }),
    prisma.staff.count({ where: { status: 'Active' } }),
    prisma.classNote.count(),
    prisma.classNote.findMany({ distinct: ['subjectId'], select: { subjectId: true } }),
    prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: threeDaysAgo
        }
      },
      include: {
        admin: {
          select: { name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    })
  ]);

  const subjectsWithNotes = subjectsData.length;

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <WelcomeHeader />
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Departments" value={deptCount} />
        <StatCard title="Active Students" value={activeStudents} />
        <StatCard title="Active Staff" value={activeStaff} />
        <StatCard 
          title="Class Notes" 
          value={totalNotes} 
          subtitle={`${subjectsWithNotes} subjects covered`} 
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <Link 
            href="/timetable" 
            className="px-6 py-3.5 bg-black text-white dark:bg-white dark:text-black font-medium text-xs tracking-wider uppercase rounded-xl hover:opacity-85 transition-opacity shadow-sm"
          >
            Manage Timetables
          </Link>
          <Link 
            href="/attendance" 
            className="px-6 py-3.5 bg-white/50 dark:bg-black/50 text-black dark:text-white backdrop-blur-liquid border border-border-light dark:border-border-dark font-medium text-xs tracking-wider uppercase rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-xs"
          >
            Import Attendance
          </Link>
          <Link 
            href="/disciplinary" 
            className="px-6 py-3.5 bg-white/50 dark:bg-black/50 text-black dark:text-white backdrop-blur-liquid border border-border-light dark:border-border-dark font-medium text-xs tracking-wider uppercase rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-xs"
          >
            Disciplinary Action
          </Link>
        </div>
      </div>

      {/* What Has Been Done (Recent Activities within last 3 days) */}
      <RecentActivitySection activities={recentActivities as any} />
    </div>
  );
}

// Reusable micro-component for the stats
function StatCard({ title, value, subtitle }: { title: string, value: number, subtitle?: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white/60 dark:bg-black/60 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-xl flex flex-col justify-between">
      <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">{title}</h4>
      <div className="text-5xl font-light tracking-tight">{value}</div>
      {subtitle && <div className="text-sm mt-3 text-gray-500 font-medium">{subtitle}</div>}
    </div>
  );
}
