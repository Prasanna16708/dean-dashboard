'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Pencil, Trash2, X, Filter, UserPlus, Plus, Calendar } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { FacultyTimetableModal } from '@/components/dashboard/FacultyTimetableModal';

export interface StaffRow {
  id: string;
  staffId: string;
  name: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  email?: string | null;
  phone?: string | null;
  status: string;
}

interface StaffTableProps {
  initialStaff: StaffRow[];
  departments: Array<{ id: string; name: string }>;
}

export function StaffTable({ initialStaff, departments }: StaffTableProps) {
  const router = useRouter();
  const [staffList, setStaffList] = useState<StaffRow[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Timetable view modal state
  const [timetableStaff, setTimetableStaff] = useState<StaffRow | null>(null);

  // Add Staff modal state
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    staffId: '',
    departmentId: '',
    designation: 'Assistant Professor',
    email: '',
    phone: '',
    status: 'Active'
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  // View / Edit modal state
  const [activeStaff, setActiveStaff] = useState<StaffRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    staffId: string;
    departmentId: string;
    designation: string;
    email: string;
    phone: string;
    status: string;
  }>({
    name: '',
    staffId: '',
    departmentId: '',
    designation: '',
    email: '',
    phone: '',
    status: 'Active'
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete modal state
  const [deletingStaff, setDeletingStaff] = useState<StaffRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Compute department options strictly from database-stored departments
  const deptOptions = useMemo(() => {
    const list = departments.map(d => d.name.trim()).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [departments]);

  // Filtered staff by state-driven search and department
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.staffId.toLowerCase().includes(searchQuery.toLowerCase());

      const cleanStaffDept = s.departmentName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSelectedDept = selectedDept.toLowerCase().replace(/[^a-z0-9]/g, '');

      const matchesDept =
        !selectedDept ||
        cleanStaffDept === cleanSelectedDept ||
        s.departmentName.toLowerCase().trim() === selectedDept.toLowerCase().trim();

      return matchesSearch && matchesDept;
    });
  }, [staffList, searchQuery, selectedDept]);

  const handleOpenAdd = () => {
    setAddForm({
      name: '',
      staffId: '',
      departmentId: departments[0]?.id || '',
      designation: 'Assistant Professor',
      email: '',
      phone: '',
      status: 'Active'
    });
    setAddError('');
    setIsAddingStaff(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.staffId || !addForm.departmentId) {
      setAddError('Please fill all required fields.');
      return;
    }

    setIsSubmittingAdd(true);
    setAddError('');

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff member');

      const selectedDeptObj = departments.find(d => d.id === addForm.departmentId);
      const newStaffRow: StaffRow = {
        id: data.id,
        staffId: data.staffId,
        name: data.name,
        departmentId: data.departmentId,
        departmentName: selectedDeptObj ? selectedDeptObj.name : 'General',
        designation: data.designation,
        email: data.email,
        phone: data.phone,
        status: data.status
      };

      setStaffList(prev => [newStaffRow, ...prev]);
      setIsAddingStaff(false);
      router.refresh();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenView = (staff: StaffRow) => {
    setActiveStaff(staff);
    setIsEditing(false);
    setEditForm({
      name: staff.name,
      staffId: staff.staffId,
      departmentId: staff.departmentId,
      designation: staff.designation,
      email: staff.email || '',
      phone: staff.phone || '',
      status: staff.status
    });
    setEditError('');
  };

  const handleOpenEdit = (staff: StaffRow) => {
    setActiveStaff(staff);
    setIsEditing(true);
    setEditForm({
      name: staff.name,
      staffId: staff.staffId,
      departmentId: staff.departmentId,
      designation: staff.designation,
      email: staff.email || '',
      phone: staff.phone || '',
      status: staff.status
    });
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;
    setIsUpdating(true);
    setEditError('');

    try {
      const res = await fetch(`/api/staff/${activeStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update staff record');

      // Update local state
      setStaffList(prev => prev.map(s => {
        if (s.id === activeStaff.id) {
          const dept = departments.find(d => d.id === editForm.departmentId);
          return {
            ...s,
            ...editForm,
            departmentName: dept ? dept.name : s.departmentName
          };
        }
        return s;
      }));

      setActiveStaff(null);
      router.refresh();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStaff) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/staff/${deletingStaff.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete staff member');

      // Update local state
      setStaffList(prev => prev.filter(s => s.id !== deletingStaff.id));
      setDeletingStaff(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'Staff ID', accessor: 'staffId' as const },
    { 
      header: 'Name', 
      accessor: (row: StaffRow) => (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setTimetableStaff(row);
          }}
          className="cursor-pointer group select-none"
          title="Click to view weekly timetable"
        >
          <div className="font-medium text-black dark:text-white group-hover:underline underline-offset-4 flex items-center gap-1.5 transition-all">
            <span>{row.name}</span>
            <Calendar className="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover:opacity-100 group-hover:text-black dark:group-hover:text-white transition-all" />
          </div>
        </div>
      )
    },
    { header: 'Department', accessor: 'departmentName' as const },
    { header: 'Designation', accessor: 'designation' as const },
    { header: 'Email', accessor: (row: StaffRow) => row.email || '-' },
    { header: 'Phone', accessor: (row: StaffRow) => row.phone || '-' },
    { 
      header: 'Status', 
      accessor: (row: StaffRow) => (
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
      accessor: (row: StaffRow) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setTimetableStaff(row)}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="View / Edit Timetable"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
            title="Edit Staff"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingStaff(row)}
            className="p-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
            title="Delete Staff"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Department Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Name or Staff ID..."
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

        {/* Department Filter Dropdown and Add Staff Action */}
        <div className="flex flex-wrap items-center gap-3">
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
          <span className="text-xs text-gray-500 font-medium tracking-wide">
            {filteredStaff.length} of {staffList.length}
          </span>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-all text-sm font-medium shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        data={filteredStaff}
        columns={columns}
        keyField="id"
        emptyMessage="No staff records found matching your criteria."
        onRowClick={handleOpenView}
      />

      {/* Add Staff Modal */}
      {isAddingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/95 dark:bg-[#121212]/95 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-border-light dark:border-border-dark pb-4">
              <h3 className="text-xl font-light">Add New Staff Member</h3>
              <button 
                onClick={() => setIsAddingStaff(false)}
                className="text-gray-400 hover:text-black dark:hover:text-white"
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
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Staff ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., STF-0101"
                    value={addForm.staffId}
                    onChange={(e) => setAddForm(prev => ({ ...prev, staffId: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Dr. Jane Doe"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Associate Professor"
                    value={addForm.designation}
                    onChange={(e) => setAddForm(prev => ({ ...prev, designation: e.target.value }))}
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
                    placeholder="faculty@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                <button
                  type="button"
                  onClick={() => setIsAddingStaff(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 font-medium"
                >
                  {isSubmittingAdd ? 'Adding...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Staff Modal */}
      {activeStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/90 dark:bg-[#121212]/90 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-border-light dark:border-border-dark pb-4">
              <h3 className="text-xl font-light">
                {isEditing ? 'Edit Faculty & Staff Record' : 'Staff Profile Details'}
              </h3>
              <button 
                onClick={() => setActiveStaff(null)}
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

            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Staff ID</p>
                    <p className="text-sm font-medium">{activeStaff.staffId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Full Name</p>
                    <p className="text-sm font-medium">{activeStaff.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Department</p>
                    <p className="text-sm font-medium">{activeStaff.departmentName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Designation</p>
                    <p className="text-sm font-medium">{activeStaff.designation}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Email</p>
                    <p className="text-sm font-medium">{activeStaff.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Phone</p>
                    <p className="text-sm font-medium">{activeStaff.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Status</p>
                    <p className="text-sm font-medium">{activeStaff.status}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                  <button
                    type="button"
                    onClick={() => setActiveStaff(null)}
                    className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity font-medium"
                  >
                    Edit Record
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Staff ID *</label>
                    <input
                      type="text"
                      required
                      value={editForm.staffId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, staffId: e.target.value }))}
                      className="w-full p-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name *</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Designation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Associate Professor"
                      value={editForm.designation}
                      onChange={(e) => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
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
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Back to Details
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
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/90 dark:bg-[#121212]/90 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Confirm Staff Deletion</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <strong className="text-black dark:text-white">{deletingStaff.name}</strong> ({deletingStaff.staffId})? This will remove all their faculty documents, timetables, and attendance logs.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded border border-red-200 dark:border-red-900">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
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
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Popup Modal */}
      {timetableStaff && (
        <FacultyTimetableModal
          staff={{
            id: timetableStaff.id,
            staffId: timetableStaff.staffId,
            name: timetableStaff.name,
            designation: timetableStaff.designation,
            department: {
              id: timetableStaff.departmentId,
              name: timetableStaff.departmentName
            }
          }}
          onClose={() => setTimetableStaff(null)}
        />
      )}
    </div>
  );
}
