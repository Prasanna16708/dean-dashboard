'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Pencil, Trash2, X, Check, Filter, Plus, UserPlus } from 'lucide-react';
import { Table } from '@/components/ui/Table';

export interface StudentRow {
  id: string;
  registerNumber: string;
  name: string;
  departmentId: string;
  departmentName: string;
  currentYear: string;
  batch: string;
  email?: string | null;
  phone?: string | null;
  status: string;
}

interface StudentsTableProps {
  initialStudents: StudentRow[];
  departments: Array<{ id: string; name: string }>;
}

export function StudentsTable({ initialStudents, departments }: StudentsTableProps) {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Add modal state
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    registerNumber: '',
    departmentId: '',
    currentYear: 'I',
    batch: '2024-2028',
    email: '',
    phone: '',
    status: 'Active'
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    registerNumber: string;
    departmentId: string;
    currentYear: string;
    batch: string;
    email: string;
    phone: string;
    status: string;
  }>({
    name: '',
    registerNumber: '',
    departmentId: '',
    currentYear: 'I',
    batch: '',
    email: '',
    phone: '',
    status: 'Active'
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete modal state
  const [deletingStudent, setDeletingStudent] = useState<StudentRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Compute department options strictly from database stored departments
  const deptOptions = useMemo(() => {
    const list = departments.map(d => d.name.trim()).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [departments]);

  // Year options
  const YEAR_OPTIONS = [
    { label: 'I Year', value: 'I' },
    { label: 'II Year', value: 'II' },
    { label: 'III Year', value: 'III' },
    { label: 'IV Year', value: 'IV' },
    { label: 'Graduated', value: 'Graduated' },
  ];

  // Filtered and alphabetically sorted students
  const filteredStudents = useMemo(() => {
    const list = students.filter((s) => {
      const matchesSearch = 
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.registerNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const cleanStudentDept = s.departmentName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSelectedDept = selectedDept.toLowerCase().replace(/[^a-z0-9]/g, '');

      const matchesDept = 
        !selectedDept ||
        cleanStudentDept === cleanSelectedDept ||
        s.departmentName.toLowerCase().trim() === selectedDept.toLowerCase().trim();

      const normalizeYear = (yr: string) => {
        const y = yr.toLowerCase().trim();
        if (y === 'i' || y === '1' || y === '1st' || y === 'i year' || y === '1st year') return 'I';
        if (y === 'ii' || y === '2' || y === '2nd' || y === 'ii year' || y === '2nd year' || y === 'iind year') return 'II';
        if (y === 'iii' || y === '3' || y === '3rd' || y === 'iii year' || y === '3rd year' || y === 'iiird year') return 'III';
        if (y === 'iv' || y === '4' || y === '4th' || y === 'iv year' || y === '4th year' || y === 'ivth year') return 'IV';
        if (y.includes('graduat')) return 'Graduated';
        return yr;
      };

      const matchesYear = 
        !selectedYear ||
        normalizeYear(s.currentYear) === selectedYear;

      return matchesSearch && matchesDept && matchesYear;
    });

    // Sort primarily by Department Name alphabetically, then by Register Number
    return list.sort((a, b) => {
      const deptCompare = a.departmentName.localeCompare(b.departmentName);
      if (deptCompare !== 0) return deptCompare;
      return a.registerNumber.localeCompare(b.registerNumber);
    });
  }, [students, searchQuery, selectedDept, selectedYear]);

  const handleOpenAdd = () => {
    setAddForm({
      name: '',
      registerNumber: '',
      departmentId: departments[0]?.id || '',
      currentYear: 'I',
      batch: '2024-2028',
      email: '',
      phone: '',
      status: 'Active'
    });
    setAddError('');
    setIsAddingStudent(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.registerNumber || !addForm.departmentId || !addForm.currentYear || !addForm.batch) {
      setAddError('Please fill all required fields.');
      return;
    }

    setIsSubmittingAdd(true);
    setAddError('');

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create student record');

      const selectedDeptObj = departments.find(d => d.id === addForm.departmentId);
      const newStudentRow: StudentRow = {
        id: data.id,
        registerNumber: data.registerNumber,
        name: data.name,
        departmentId: data.departmentId,
        departmentName: selectedDeptObj ? selectedDeptObj.name : 'General',
        currentYear: data.currentYear,
        batch: data.batch,
        email: data.email,
        phone: data.phone,
        status: data.status
      };

      setStudents(prev => [newStudentRow, ...prev]);
      setIsAddingStudent(false);
      router.refresh();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (student: StudentRow) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      registerNumber: student.registerNumber,
      departmentId: student.departmentId,
      currentYear: student.currentYear,
      batch: student.batch,
      email: student.email || '',
      phone: student.phone || '',
      status: student.status
    });
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsUpdating(true);
    setEditError('');

    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update student');

      // Update local state
      setStudents(prev => prev.map(s => {
        if (s.id === editingStudent.id) {
          const dept = departments.find(d => d.id === editForm.departmentId);
          return {
            ...s,
            ...editForm,
            departmentName: dept ? dept.name : s.departmentName
          };
        }
        return s;
      }));

      setEditingStudent(null);
      router.refresh();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/students/${deletingStudent.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete student');

      // Update local state
      setStudents(prev => prev.filter(s => s.id !== deletingStudent.id));
      setDeletingStudent(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'Register No', accessor: 'registerNumber' as const },
    { header: 'Name', accessor: 'name' as const },
    { header: 'Department', accessor: 'departmentName' as const },
    { header: 'Year', accessor: 'currentYear' as const },
    { header: 'Batch', accessor: 'batch' as const },
    { 
      header: 'Status', 
      accessor: (row: StudentRow) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'Active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {row.status}
        </span>
      )
    },
    { 
      header: 'Actions', 
      accessor: (row: StudentRow) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
            title="Edit Student"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingStudent(row)}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
            title="Delete Student"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search, Add Student & Department/Year Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Name or Register Number..."
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

        {/* Department and Year Filter Dropdowns + Add Student Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white text-sm transition-all cursor-pointer"
            >
              <option value="">All Departments</option>
              {deptOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="relative flex items-center">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white text-sm transition-all cursor-pointer font-medium"
            >
              <option value="">All Years</option>
              {YEAR_OPTIONS.map((yr) => (
                <option key={yr.value} value={yr.value}>
                  {yr.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-gray-500 font-medium tracking-wide">
            {filteredStudents.length} of {students.length}
          </span>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-all text-sm font-medium shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        data={filteredStudents}
        columns={columns}
        keyField="id"
        emptyMessage="No students found matching your criteria."
        onRowClick={(row) => router.push(`/students/${row.id}`)}
      />

      {/* Add Student Modal */}
      {isAddingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/95 dark:bg-[#121212]/95 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-border-light dark:border-border-dark pb-4">
              <h3 className="text-xl font-light">Add New Student</h3>
              <button 
                onClick={() => setIsAddingStudent(false)}
                className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900">
                {addError}
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Register Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., STU010"
                    value={addForm.registerNumber}
                    onChange={(e) => setAddForm(prev => ({ ...prev, registerNumber: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Rahul V"
                    value={addForm.name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Department *</label>
                <select
                  value={addForm.departmentId}
                  onChange={(e) => setAddForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  required
                  className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Year *</label>
                  <select
                    value={addForm.currentYear}
                    onChange={(e) => setAddForm(prev => ({ ...prev, currentYear: e.target.value }))}
                    required
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  >
                    <option value="I">I Year</option>
                    <option value="II">II Year</option>
                    <option value="III">III Year</option>
                    <option value="IV">IV Year</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Batch *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2026-2030"
                    value={addForm.batch}
                    onChange={(e) => setAddForm(prev => ({ ...prev, batch: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email</label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={addForm.email}
                    onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                <button
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 font-medium cursor-pointer"
                >
                  {isSubmittingAdd ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/90 dark:bg-[#121212]/90 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-border-light dark:border-border-dark pb-4">
              <h3 className="text-xl font-light">Edit Student</h3>
              <button 
                onClick={() => setEditingStudent(null)}
                className="text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Register Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.registerNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, registerNumber: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Department *</label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  required
                  className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Year *</label>
                  <select
                    value={editForm.currentYear}
                    onChange={(e) => setEditForm(prev => ({ ...prev, currentYear: e.target.value }))}
                    required
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  >
                    <option value="I">I Year</option>
                    <option value="II">II Year</option>
                    <option value="III">III Year</option>
                    <option value="IV">IV Year</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Batch *</label>
                  <input
                    type="text"
                    required
                    placeholder="2024-2028"
                    value={editForm.batch}
                    onChange={(e) => setEditForm(prev => ({ ...prev, batch: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 font-medium"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/90 dark:bg-[#121212]/90 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Confirm Student Deletion</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete student <strong className="text-black dark:text-white">{deletingStudent.name}</strong> ({deletingStudent.registerNumber})? This will permanently remove their records and associated attendance/disciplinary history.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded border border-red-200 dark:border-red-900">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
