'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Database, 
  Download, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Plus, 
  Clock, 
  HardDrive,
  X,
  AlertTriangle
} from 'lucide-react';
import { Table } from '@/components/ui/Table';

export interface BackupRow {
  id: string;
  filename: string;
  size: number;
  type: string;
  status: string;
  createdAt: string | Date;
}

interface BackupsTableProps {
  initialBackups: BackupRow[];
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function BackupsTable({ initialBackups }: BackupsTableProps) {
  const router = useRouter();
  const [backups, setBackups] = useState<BackupRow[]>(initialBackups);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Loading and feedback states
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Delete modal state
  const [deletingBackup, setDeletingBackup] = useState<BackupRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore modal state
  const [restoringBackup, setRestoringBackup] = useState<BackupRow | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const filteredBackups = useMemo(() => {
    return backups.filter(b => {
      const matchesSearch = 
        !search || 
        b.filename.toLowerCase().includes(search.toLowerCase()) ||
        b.type.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'ALL' || b.type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [backups, search, typeFilter]);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Backup creation failed');
      }

      setActionSuccess(`Backup "${data.filename}" generated successfully!`);
      setBackups(prev => [data, ...prev]);
      router.refresh();

      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Error generating database backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBackup) return;
    setIsDeleting(true);
    setActionError('');

    try {
      const res = await fetch(`/api/backup?id=${encodeURIComponent(deletingBackup.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete backup');
      }

      setBackups(prev => prev.filter(b => b.id !== deletingBackup.id));
      setActionSuccess(`Backup "${deletingBackup.filename}" deleted.`);
      setDeletingBackup(null);
      router.refresh();

      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Error deleting backup');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!restoringBackup) return;
    setIsRestoring(true);
    setActionError('');

    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: restoringBackup.id })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to restore backup');
      }

      setActionSuccess(`Database successfully restored from "${restoringBackup.filename}"!`);
      setRestoringBackup(null);
      router.refresh();

      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err: any) {
      setActionError(err.message || 'Error restoring database');
    } finally {
      setIsRestoring(false);
    }
  };

  const columns = [
    {
      header: 'Backup Filename',
      accessor: (row: BackupRow) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-xs font-medium text-black dark:text-white">
              {row.filename}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: (row: BackupRow) => {
        let badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900';
        if (row.type === 'Pre-Rollover') {
          badgeColor = 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900';
        } else if (row.type === 'Automatic') {
          badgeColor = 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badgeColor}`}>
            {row.type}
          </span>
        );
      }
    },
    {
      header: 'Size',
      accessor: (row: BackupRow) => (
        <span className="font-mono text-xs text-gray-500">
          {formatBytes(row.size)}
        </span>
      )
    },
    {
      header: 'Date Created',
      accessor: (row: BackupRow) => (
        <span className="text-xs text-gray-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row: BackupRow) => {
        if (row.status === 'Completed') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
              <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              Completed
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            Failed
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: (row: BackupRow) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {/* Download Button */}
          {row.status === 'Completed' && (
            <a
              href={`/backups/${row.filename}`}
              download={row.filename}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black text-white dark:bg-white dark:text-black hover:opacity-85 transition-opacity shadow-xs cursor-pointer"
              title="Download SQLite backup snapshot"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          )}

          {/* Restore Button */}
          {row.status === 'Completed' && (
            <button
              onClick={() => setRestoringBackup(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Restore database from this snapshot"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => setDeletingBackup(row)}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Delete Backup"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Action Notification Banners */}
      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search backups by filename or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
          />
        </div>

        {/* Filter & Primary Create Button */}
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="py-2 px-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-xs focus:outline-none focus:border-black dark:focus:border-white transition-colors"
          >
            <option value="ALL">All Types</option>
            <option value="Manual">Manual</option>
            <option value="Pre-Rollover">Pre-Rollover</option>
            <option value="Automatic">Automatic</option>
          </select>

          <button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-85 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isCreating ? 'Generating Snapshot...' : 'Create Manual Backup'}</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <Table
        data={filteredBackups}
        columns={columns}
        keyField="id"
        emptyMessage="No backup snapshots found."
      />

      {/* Delete Confirmation Modal */}
      {deletingBackup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] border border-border-light dark:border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-black dark:text-white">Delete Backup Snapshot</h3>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete <strong className="font-mono text-black dark:text-white">{deletingBackup.filename}</strong>? This will remove the file from physical storage.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border-light dark:border-border-dark">
              <button
                type="button"
                onClick={() => setDeletingBackup(null)}
                className="px-4 py-2 rounded-xl border border-border-light dark:border-border-dark text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoringBackup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] border border-border-light dark:border-border-dark rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-black dark:text-white">Restore Database Snapshot</h3>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Restoring from <strong className="font-mono text-black dark:text-white">{restoringBackup.filename}</strong> will overwrite current database records with the state from <strong className="text-black dark:text-white">{new Date(restoringBackup.createdAt).toLocaleString()}</strong>.
            </p>

            <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-border-light dark:border-border-dark text-[11px] text-gray-500">
              A safety pre-restore backup snapshot will automatically be created prior to applying this restoration.
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border-light dark:border-border-dark">
              <button
                type="button"
                onClick={() => setRestoringBackup(null)}
                className="px-4 py-2 rounded-xl border border-border-light dark:border-border-dark text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleRestoreConfirm}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-85 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isRestoring ? 'Restoring Database...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
