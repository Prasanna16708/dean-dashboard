import prisma from '@/lib/prisma';
import Link from 'next/link';
import { CheckCircle2, XCircle, Users, UserCheck, Upload, Calendar } from 'lucide-react';
import { Table } from '@/components/ui/Table';

export default async function AttendancePage({
  searchParams
}: {
  searchParams: Promise<{ type?: string; date?: string }>
}) {
  const resolvedParams = await searchParams;
  const type = resolvedParams.type || 'students';

  // Today's Date or Selected Date
  const targetDate = resolvedParams.date ? new Date(resolvedParams.date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  if (type === 'staff') {
    const staffAttendances = await prisma.staffAttendance.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDate
        }
      },
      include: {
        staff: {
          include: { department: true }
        }
      },
      orderBy: { staff: { staffId: 'asc' } }
    });

    const rows = staffAttendances.map((a) => ({
      id: a.id,
      identifier: a.staff.staffId,
      name: a.staff.name,
      department: a.staff.department.name,
      designation: a.staff.designation,
      dateText: new Date(a.date).toLocaleDateString(),
      status: a.status
    }));

    const columns = [
      { header: 'Staff ID', accessor: 'identifier' as const },
      { header: 'Staff Name', accessor: 'name' as const },
      { header: 'Department', accessor: 'department' as const },
      { header: 'Designation', accessor: 'designation' as const },
      { header: 'Date', accessor: 'dateText' as const },
      {
        header: 'Status',
        accessor: (row: typeof rows[0]) => (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            row.status === 'P'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {row.status === 'P' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {row.status === 'P' ? 'Present' : 'Absent'}
          </span>
        )
      }
    ];

    const presentCount = rows.filter(r => r.status === 'P').length;
    const absentCount = rows.filter(r => r.status === 'A').length;

    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-light dark:border-border-dark pb-6">
          <div>
            <h1 className="text-3xl font-light tracking-wide">Attendance Tracker</h1>
            <p className="text-sm text-gray-500 mt-2 tracking-wide">Daily logs and attendance percentages</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/attendance/import" 
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity text-sm font-medium shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Import Attendance
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-border-light dark:border-border-dark pb-2">
          <Link
            href="/attendance?type=students"
            className="pb-2 text-sm font-medium transition-colors text-gray-500 hover:text-black dark:hover:text-white"
          >
            Student Attendance
          </Link>
          <Link
            href="/attendance?type=staff"
            className="pb-2 text-sm font-medium transition-colors border-b-2 border-black dark:border-white text-black dark:text-white"
          >
            Faculty & Staff Attendance
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Total Staff Logged</span>
            <span className="text-3xl font-light mt-2 block">{rows.length}</span>
          </div>
          <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-300 block">Present</span>
            <span className="text-3xl font-light text-green-700 dark:text-green-300 mt-2 block">{presentCount}</span>
          </div>
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300 block">Absent</span>
            <span className="text-3xl font-light text-red-700 dark:text-red-300 mt-2 block">{absentCount}</span>
          </div>
        </div>

        <Table data={rows} columns={columns} keyField="id" emptyMessage="No attendance logs recorded for this day." />
      </div>
    );
  }

  // Students attendance
  const studentAttendances = await prisma.studentAttendance.findMany({
    where: {
      date: {
        gte: targetDate,
        lt: nextDate
      }
    },
    include: {
      student: {
        include: { department: true }
      }
    },
    orderBy: { student: { registerNumber: 'asc' } }
  });

  const rows = studentAttendances.map((a) => ({
    id: a.id,
    identifier: a.student.registerNumber,
    name: a.student.name,
    department: a.student.department.name,
    year: a.student.currentYear,
    dateText: new Date(a.date).toLocaleDateString(),
    status: a.status
  }));

  const columns = [
    { header: 'Register No', accessor: 'identifier' as const },
    { header: 'Student Name', accessor: 'name' as const },
    { header: 'Department', accessor: 'department' as const },
    { header: 'Year', accessor: 'year' as const },
    { header: 'Date', accessor: 'dateText' as const },
    {
      header: 'Status',
      accessor: (row: typeof rows[0]) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          row.status === 'P'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {row.status === 'P' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {row.status === 'P' ? 'Present' : 'Absent'}
        </span>
      )
    }
  ];

  const presentCount = rows.filter(r => r.status === 'P').length;
  const absentCount = rows.filter(r => r.status === 'A').length;

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Attendance Tracker</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Daily logs and attendance percentages</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/attendance/import" 
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity text-sm font-medium shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Import Attendance
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-border-light dark:border-border-dark pb-2">
        <Link
          href="/attendance?type=students"
          className={`pb-2 text-sm font-medium transition-colors ${
            type === 'students'
              ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
              : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          Student Attendance
        </Link>
        <Link
          href="/attendance?type=staff"
          className={`pb-2 text-sm font-medium transition-colors ${
            type === 'staff'
              ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
              : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          Faculty & Staff Attendance
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Total Students Logged</span>
          <span className="text-3xl font-light mt-2 block">{rows.length}</span>
        </div>
        <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
          <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-300 block">Present</span>
          <span className="text-3xl font-light text-green-700 dark:text-green-300 mt-2 block">{presentCount}</span>
        </div>
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
          <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300 block">Absent</span>
          <span className="text-3xl font-light text-red-700 dark:text-red-300 mt-2 block">{absentCount}</span>
        </div>
      </div>

      <Table data={rows} columns={columns} keyField="id" emptyMessage="No student attendance logs recorded for this day." />
    </div>
  );
}
