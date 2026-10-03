export const dynamic = 'force-dynamic';
'use client';

import { useState, useEffect } from 'react';
import { parseAttendanceExcelFile, ParsedAttendanceRow } from '@/lib/excel';
import { Table } from '@/components/ui/Table';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AttendanceImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [attendanceType, setAttendanceType] = useState<'Student' | 'Staff'>('Student');
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('II');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [previewData, setPreviewData] = useState<ParsedAttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDepartments(data);
          if (data.length > 0) setDepartmentId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setReport(null);

    try {
      const parsed = await parseAttendanceExcelFile(selectedFile, date);
      if (parsed.length === 0) {
        throw new Error("No valid attendance rows found in the file. Ensure columns include 'Register No' (or 'Staff ID') and 'Status'.");
      }
      setPreviewData(parsed);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpload = async () => {
    if (previewData.length === 0) return;
    setLoading(true);
    setError('');

    const selectedDept = departments.find(d => d.id === departmentId);

    try {
      const res = await fetch('/api/attendance/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: attendanceType,
          attendanceRecords: previewData,
          departmentId: departmentId || undefined,
          departmentName: selectedDept ? selectedDept.name : undefined,
          year: attendanceType === 'Student' ? year : undefined,
          date
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Import failed');

      setReport(result);
      setPreviewData([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const previewColumns = [
    { header: attendanceType === 'Student' ? 'Register No' : 'Staff ID', accessor: 'identifier' as const },
    { header: 'Name', accessor: 'name' as const },
    { 
      header: 'Date', 
      accessor: (row: ParsedAttendanceRow) => new Date(row.date).toLocaleDateString() 
    },
    { 
      header: 'Status', 
      accessor: (row: ParsedAttendanceRow) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.status === 'P'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {row.status === 'P' ? 'PRESENT' : 'ABSENT'}
        </span>
      ) 
    },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-8">
      <div className="border-b border-border-light dark:border-border-dark pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Import Attendance</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">
            Upload attendance for a specific class (e.g., II Year Information Technology) or faculty department
          </p>
        </div>
        <Link 
          href="/attendance" 
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attendance
        </Link>
      </div>

      {!report ? (
        <div className="space-y-6">
          {/* Controls Form */}
          <div className="p-8 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Record Type *</label>
                <select
                  value={attendanceType}
                  onChange={(e) => {
                    setAttendanceType(e.target.value as 'Student' | 'Staff');
                    setPreviewData([]);
                  }}
                  className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white"
                >
                  <option value="Student">Student Attendance</option>
                  <option value="Staff">Faculty / Staff Attendance</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Department *</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {attendanceType === 'Student' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Academic Year *</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  >
                    <option value="I">I Year (1st Year)</option>
                    <option value="II">II Year (2nd Year)</option>
                    <option value="III">III Year (3rd Year)</option>
                    <option value="IV">IV Year (4th Year)</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Attendance Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Excel / CSV File *</label>
              <div className="p-8 border-2 border-dashed border-border-light dark:border-border-dark rounded-2xl bg-black/5 dark:bg-white/5 text-center">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="block mx-auto cursor-pointer file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-black file:text-white dark:file:bg-white dark:file:text-black text-sm text-gray-500 hover:file:opacity-80 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supports columns: <strong>Register No / Roll No</strong>, <strong>Student Name</strong>, <strong>Status (P / A)</strong>
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {previewData.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Data Preview ({previewData.length} rows)</h3>
                  <p className="text-xs text-gray-500">
                    Applying to {attendanceType === 'Student' ? `${year} Year` : 'Faculty'} ({departments.find(d => d.id === departmentId)?.name || 'Selected Department'}) on {new Date(date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50 font-medium text-sm shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {loading ? 'Importing Attendance...' : 'Confirm & Save Attendance'}
                </button>
              </div>
              <Table data={previewData.slice(0, 100)} columns={previewColumns} keyField="identifier" />
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white/60 dark:bg-black/60 shadow-xl text-center space-y-6 border border-border-light dark:border-border-dark">
          <div className="flex justify-center text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-light">Attendance Imported Successfully</h2>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center pt-2">
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark">
              <span className="text-gray-500 text-xs block uppercase font-bold tracking-wider">Total</span>
              <span className="text-2xl font-light mt-1 block">{report.total}</span>
            </div>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <span className="text-green-700 dark:text-green-300 text-xs block uppercase font-bold tracking-wider">New</span>
              <span className="text-2xl font-light text-green-700 dark:text-green-300 mt-1 block">{report.new}</span>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-blue-700 dark:text-blue-300 text-xs block uppercase font-bold tracking-wider">Updated</span>
              <span className="text-2xl font-light text-blue-700 dark:text-blue-300 mt-1 block">{report.updated}</span>
            </div>
          </div>

          {report.errors?.length > 0 && (
            <div className="mt-4 text-left p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 max-h-40 overflow-y-auto text-xs text-amber-700 dark:text-amber-300">
              <p className="font-bold mb-1">Notices:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {report.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-4">
            <button
              onClick={() => {
                setReport(null);
                setFile(null);
              }}
              className="px-5 py-2.5 text-sm rounded-xl border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Upload Another Class
            </button>
            <Link
              href="/attendance"
              className="px-6 py-2.5 text-sm bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity font-medium"
            >
              View Attendance Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
