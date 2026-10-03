'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, Download, Trash2, X, Filter } from 'lucide-react';
import { Table } from '@/components/ui/Table';

export interface DocumentRow {
  id: string;
  name: string;
  fileUrl: string;
  uploadedAt: string | Date;
  facultyName: string;
  staffId: string;
  departmentName: string;
}

export function DocumentsTable({ initialDocs }: { initialDocs: DocumentRow[] }) {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentRow[]>(initialDocs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [deletingDoc, setDeletingDoc] = useState<DocumentRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    docs.forEach(d => { if (d.departmentName) set.add(d.departmentName.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [docs]);

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.staffId.toLowerCase().includes(searchQuery.toLowerCase());

      const cleanDocDept = d.departmentName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSelectedDept = selectedDept.toLowerCase().replace(/[^a-z0-9]/g, '');

      const matchesDept =
        !selectedDept ||
        cleanDocDept === cleanSelectedDept ||
        d.departmentName.toLowerCase().trim() === selectedDept.toLowerCase().trim();

      return matchesSearch && matchesDept;
    });
  }, [docs, searchQuery, selectedDept]);

  const handleDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deletingDoc.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      setDocs(prev => prev.filter(d => d.id !== deletingDoc.id));
      setDeletingDoc(null);
      router.refresh();
    } catch (err) {
      alert('Error deleting document');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'Faculty Name', accessor: (row: DocumentRow) => (
      <div>
        <p className="font-medium text-black dark:text-white">{row.facultyName}</p>
        <p className="text-xs text-gray-500">{row.staffId}</p>
      </div>
    )},
    { header: 'Department', accessor: 'departmentName' as const },
    { header: 'Document Title', accessor: 'name' as const },
    { 
      header: 'Uploaded Date', 
      accessor: (row: DocumentRow) => new Date(row.uploadedAt).toLocaleDateString() 
    },
    {
      header: 'Actions',
      accessor: (row: DocumentRow) => (
        <div className="flex items-center gap-2">
          <a
            href={row.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            title="View / Download"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={() => setDeletingDoc(row)}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            title="Delete Document"
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
            placeholder="Search by Document Name, Faculty, or Staff ID..."
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
            {filteredDocs.length} of {docs.length}
          </span>
        </div>
      </div>

      <Table
        data={filteredDocs}
        columns={columns}
        keyField="id"
        emptyMessage="No faculty documents found."
      />

      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/90 dark:bg-[#121212]/90 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <strong className="text-black dark:text-white">{deletingDoc.name}</strong> for faculty {deletingDoc.facultyName}?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
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
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
