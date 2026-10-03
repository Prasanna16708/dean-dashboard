export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default async function StudentProfilePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      department: true,
      attendances: { orderBy: { date: 'desc' } },
      disciplinary: { orderBy: { date: 'desc' } }
    }
  });

  if (!student) notFound();

  // Calculate Attendance Statistics
  const totalDays = student.attendances.length;
  const presentDays = student.attendances.filter((a: { status: string }) => a.status === 'P').length;
  const absentDays = student.attendances.filter((a: { status: string }) => a.status === 'A').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 border-b border-border-light dark:border-border-dark pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-light tracking-wide">{student.name}</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide font-medium">
            Register No: {student.registerNumber} | Status: {' '}
            <span className={student.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
              {student.status}
            </span>
          </p>
        </div>
        <Link href="/students" className="px-4 py-2 border border-border-light dark:border-border-dark rounded bg-white/30 dark:bg-black/30 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Academic & Personal Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-sm">
            <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-6 border-b border-border-light dark:border-border-dark pb-2">Academic Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <InfoField label="Department" value={student.department.name} />
              <InfoField label="Current Year" value={student.currentYear} />
              <InfoField label="Batch" value={student.batch} />
              <InfoField label="Joined Date" value={new Date(student.createdAt).toLocaleDateString()} />
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-sm">
            <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-6 border-b border-border-light dark:border-border-dark pb-2">Personal & Contact Info</h3>
            <div className="grid grid-cols-2 gap-6">
              <InfoField label="Email" value={student.email} />
              <InfoField label="Phone" value={student.phone} />
              <InfoField label="Parent Name" value={student.parentName} />
              <InfoField label="Parent Phone" value={student.parentPhone} />
              <InfoField label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'} />
              <InfoField label="Gender" value={student.gender} />
              <div className="col-span-2">
                <InfoField label="Address" value={student.address} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance & Disciplinary */}
        <div className="space-y-8">
          {/* Attendance Card */}
          <div className="p-8 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-sm">
            <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-6 border-b border-border-light dark:border-border-dark pb-2">Attendance Summary</h3>
            <div className="text-center mb-6">
              <div className={`text-5xl font-light ${attendancePercentage < 75 ? 'text-red-600 dark:text-red-400' : ''}`}>
                {attendancePercentage}%
              </div>
              <p className="text-xs text-gray-500 mt-2">Overall Percentage</p>
            </div>
            <div className="flex justify-between text-sm font-medium border-t border-border-light dark:border-border-dark pt-4">
              <div className="text-center"><span className="block text-xl font-light">{totalDays}</span>Total</div>
              <div className="text-center text-green-600 dark:text-green-400"><span className="block text-xl font-light">{presentDays}</span>Present</div>
              <div className="text-center text-red-600 dark:text-red-400"><span className="block text-xl font-light">{absentDays}</span>Absent</div>
            </div>
          </div>

          {/* Disciplinary Card */}
          <div className="p-8 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-sm">
            <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-6 border-b border-border-light dark:border-border-dark pb-2">Disciplinary History</h3>
            {student.disciplinary.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No disciplinary actions recorded.</p>
            ) : (
              <div className="space-y-4">
                {student.disciplinary.map((record: { id: string; date: Date | string; reason: string; actionTaken: string }) => (
                  <div key={record.id} className="p-4 rounded border border-border-light dark:border-border-dark bg-black/5 dark:bg-white/5">
                    <p className="text-xs text-gray-500 mb-1">{new Date(record.date).toLocaleDateString()}</p>
                    <p className="text-sm font-medium">{record.reason}</p>
                    <p className="text-xs mt-2 pt-2 border-t border-border-light dark:border-border-dark">Action: {record.actionTaken}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper micro-component
function InfoField({ label, value }: { label: string, value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-black dark:text-white">{value || '-'}</p>
    </div>
  );
}
