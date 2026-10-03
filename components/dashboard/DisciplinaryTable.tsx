'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Eye, Trash2, X, Filter, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Table } from '@/components/ui/Table';

export interface DisciplinaryRow {
  id: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  departmentName: string;
  currentYear: string;
  date: string | Date;
  reason: string;
  actionTaken: string;
}

interface DisciplinaryTableProps {
  initialActions: DisciplinaryRow[];
}

export function DisciplinaryTable({ initialActions }: DisciplinaryTableProps) {
  const router = useRouter();
  const [actions, setActions] = useState<DisciplinaryRow[]>(initialActions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [deletingAction, setDeletingAction] = useState<DisciplinaryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    actions.forEach(a => { if (a.departmentName) set.add(a.departmentName.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [actions]);

  const filteredActions = useMemo(() => {
    return actions.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.actionTaken.toLowerCase().includes(searchQuery.toLowerCase());

      const cleanActionDept = item.departmentName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSelectedDept = selectedDept.toLowerCase().replace(/[^a-z0-9]/g, '');

      const matchesDept =
        !selectedDept ||
        cleanActionDept === cleanSelectedDept ||
        item.departmentName.toLowerCase().trim() === selectedDept.toLowerCase().trim();

      return matchesSearch && matchesDept;
    });
  }, [actions, searchQuery, selectedDept]);

  const handleDelete = async () => {
    if (!deletingAction) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/disciplinary?id=${deletingAction.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete record');

      setActions(prev => prev.filter(a => a.id !== deletingAction.id));
      setDeletingAction(null);
      router.refresh();
    } catch (err) {
      alert('Error deleting disciplinary record');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Student',
      accessor: (row: DisciplinaryRow) => (
        <div>
          <p className="font-medium text-black dark:text-white">{row.studentName}</p>
          <p className="text-xs text-gray-500 font-mono">{row.registerNumber}</p>
        </div>
      )
    },
    { header: 'Department', accessor: 'departmentName' as const },
    { header: 'Year', accessor: 'currentYear' as const },
    {
      header: 'Incident Date',
      accessor: (row: DisciplinaryRow) => new Date(row.date).toLocaleDateString()
    },
    {
      header: 'Infraction / Reason',
      accessor: (row: DisciplinaryRow) => (
        <span className="text-sm text-gray-700 dark:text-gray-300 max-w-xs block truncate" title={row.reason}>
          {row.reason}
        </span>
      )
    },
    {
      header: 'Action Taken',
      accessor: (row: DisciplinaryRow) => (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-medium text-xs">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>{row.actionTaken}</span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (row: DisciplinaryRow) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/students/${row.studentId}`}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            title="View Student Profile"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setDeletingAction(row)}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            title="Delete Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Student, Register No, Reason, or Action Taken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white text-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white text-sm transition-all cursor-pointer"
            >
              <option value="">All Departments</option>
              {deptOptions.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {filteredActions.length} of {actions.length} records
          </span>
        </div>
      </div>

      <Table
        data={filteredActions}
        columns={columns}
        keyField="id"
        emptyMessage="No disciplinary action records found."
      />

      {/* Delete Confirmation Modal */}
      {deletingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/95 dark:bg-[#121212]/95 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Delete Disciplinary Record</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to remove the disciplinary record for <strong className="text-black dark:text-white">{deletingAction.studentName}</strong> ({deletingAction.registerNumber}) regarding: &quot;{deletingAction.reason}&quot;?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAction(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
