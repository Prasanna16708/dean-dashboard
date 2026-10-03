'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, UserCheck, Users, Trash2, X, AlertCircle } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { ExportButton } from '@/components/ui/ExportButton';

export interface DepartmentRow {
  id: string;
  name: string;
  headOfDept: string;
  activeStudents: number;
}

interface DepartmentsViewProps {
  initialDepartments: DepartmentRow[];
}

export function DepartmentsView({ initialDepartments }: DepartmentsViewProps) {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentRow[]>(initialDepartments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [headOfDept, setHeadOfDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [deletingDept, setDeletingDept] = useState<DepartmentRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Department Name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), headOfDept: headOfDept.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create department.');
      }

      // Add to local state
      setDepartments(prev => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          headOfDept: data.headOfDept || 'Not Assigned',
          activeStudents: 0
        }
      ].sort((a, b) => a.name.localeCompare(b.name)));

      setName('');
      setHeadOfDept('');
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDept) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/departments?id=${deletingDept.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete department.');
      }

      setDepartments(prev => prev.filter(d => d.id !== deletingDept.id));
      setDeletingDept(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { 
      header: 'Department Name', 
      accessor: (row: DepartmentRow) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-medium text-black dark:text-white">{row.name}</span>
        </div>
      )
    },
    { header: 'Head of Department', accessor: 'headOfDept' as const },
    { 
      header: 'Active Students', 
      accessor: (row: DepartmentRow) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <Users className="w-3.5 h-3.5" />
          {row.activeStudents}
        </span>
      )
    },
    { 
      header: 'Actions', 
      accessor: (row: DepartmentRow) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeletingDept(row);
              setDeleteError('');
            }}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            title="Delete Department"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Departments</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Manage academic divisions, faculties, and heads</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={departments} filename="departments" />
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setError('');
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        </div>
      </div>

      <Table 
        data={departments} 
        columns={columns} 
        keyField="id"
        emptyMessage="No departments found. Please create one."
      />

      {/* Add Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/95 dark:bg-[#121212]/95 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-border-light dark:border-border-dark pb-4">
              <h3 className="text-xl font-light">Add Department</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Artificial Intelligence and Data Science"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Head of Department (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dr. Jane Doe"
                  value={headOfDept}
                  onChange={(e) => setHeadOfDept(e.target.value)}
                  className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm rounded-xl border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-sm bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50 font-medium"
                >
                  {loading ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/95 dark:bg-[#121212]/95 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete the department <strong className="text-black dark:text-white">{deletingDept.name}</strong>?
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200 dark:border-red-900">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDepartment}
                disabled={deleteLoading}
                className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
