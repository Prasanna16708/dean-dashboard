'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  Pencil, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Building2, 
  CheckCircle, 
  Plus, 
  X, 
  Clock
} from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { FacultyTimetableModal } from '@/components/dashboard/FacultyTimetableModal';

export interface StaffTimetableRow {
  id: string;
  staffId: string;
  name: string;
  designation: string;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
  timetables: {
    id: string;
    version: number;
    scheduleData?: string | null;
    fileUrl?: string | null;
    uploadedAt: string | Date;
  }[];
}

interface TimetableTableProps {
  initialStaff: StaffTimetableRow[];
}

export function TimetableTable({ initialStaff }: TimetableTableProps) {
  const router = useRouter();
  const [staffData, setStaffData] = useState<StaffTimetableRow[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Timetable Modal States
  const [activeModalStaff, setActiveModalStaff] = useState<StaffTimetableRow | null>(null);
  const [modalEditMode, setModalEditMode] = useState<boolean>(false);

  // Quick "Create Timetable" Faculty Selector modal
  const [isSelectFacultyOpen, setIsSelectFacultyOpen] = useState(false);
  const [selectedFacultyForCreate, setSelectedFacultyForCreate] = useState('');

  // Extract unique departments
  const departments = useMemo(() => {
    const map = new Map<string, string>();
    staffData.forEach(s => {
      if (s.department?.id && s.department?.name) {
        map.set(s.department.id, s.department.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [staffData]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffData.filter(staff => {
      const matchesSearch = 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.department?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDepartment === 'ALL' || staff.departmentId === selectedDepartment;

      const hasTimetable = staff.timetables && staff.timetables.length > 0;
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'CONFIGURED' && hasTimetable) ||
        (statusFilter === 'PENDING' && !hasTimetable);

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [staffData, searchQuery, selectedDepartment, statusFilter]);

  const handleOpenTimetable = (staff: StaffTimetableRow, editMode = false) => {
    setActiveModalStaff(staff);
    setModalEditMode(editMode);
  };

  const handleTimetableSaved = (updatedStaffId: string, newScheduleData: string, newVersion: number) => {
    setStaffData(prev => prev.map(s => {
      if (s.id === updatedStaffId) {
        const existingTimetables = s.timetables || [];
        const updatedFirst = {
          id: existingTimetables[0]?.id || `tt-${Date.now()}`,
          version: newVersion,
          scheduleData: newScheduleData,
          uploadedAt: new Date().toISOString()
        };
        return {
          ...s,
          timetables: [updatedFirst, ...existingTimetables.slice(1)]
        };
      }
      return s;
    }));
    router.refresh();
  };

  const handleCreateNewTimetable = () => {
    if (!selectedFacultyForCreate) return;
    const target = staffData.find(s => s.id === selectedFacultyForCreate);
    if (target) {
      setIsSelectFacultyOpen(false);
      setSelectedFacultyForCreate('');
      handleOpenTimetable(target, true);
    }
  };

  const columns = [
    {
      header: 'Staff ID',
      accessor: (row: StaffTimetableRow) => (
        <span className="font-mono font-medium text-xs px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-black dark:text-white tracking-wider">
          {row.staffId}
        </span>
      )
    },
    {
      header: 'Faculty Name',
      accessor: (row: StaffTimetableRow) => (
        <div 
          onClick={() => handleOpenTimetable(row, false)}
          className="cursor-pointer group select-none"
          title="Click to view weekly timetable"
        >
          <div className="font-medium text-black dark:text-white group-hover:underline underline-offset-4 flex items-center gap-1.5 transition-all">
            <span>{row.name}</span>
            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 transition-opacity" />
          </div>
          <div className="text-xs text-gray-500">{row.designation || 'Faculty Member'}</div>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: (row: StaffTimetableRow) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300">
          <Building2 className="w-3 h-3 text-gray-400" />
          {row.department?.name || 'General'}
        </span>
      )
    },
    {
      header: 'Timetable Status',
      accessor: (row: StaffTimetableRow) => {
        const latest = row.timetables?.[0];
        if (latest) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
              v{latest.version} Active
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 border border-border-light dark:border-border-dark">
            <Clock className="w-3 h-3 text-gray-400" />
            Not Created
          </span>
        );
      }
    },
    {
      header: 'Last Updated',
      accessor: (row: StaffTimetableRow) => {
        const latest = row.timetables?.[0];
        if (!latest?.uploadedAt) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <span className="text-xs text-gray-500">
            {new Date(latest.uploadedAt).toLocaleDateString()}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: (row: StaffTimetableRow) => {
        const hasTimetable = row.timetables && row.timetables.length > 0;
        return (
          <div className="flex items-center gap-2">
            {/* View Timetable Button */}
            <button
              onClick={() => handleOpenTimetable(row, false)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border-light dark:border-border-dark hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer shadow-xs"
              title="View Timetable"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>

            {/* Edit / Create Timetable Button */}
            <button
              onClick={() => handleOpenTimetable(row, true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-black text-white dark:bg-white dark:text-black hover:opacity-85 transition-opacity cursor-pointer shadow-xs"
              title={hasTimetable ? 'Edit Timetable' : 'Create Timetable'}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{hasTimetable ? 'Edit' : 'Create'}</span>
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Controls: Search, Filters, and Create Timetable */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by faculty name or staff ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="py-2 px-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-xs focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            >
              <option value="ALL">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl text-xs focus:outline-none focus:border-black dark:focus:border-white transition-colors"
          >
            <option value="ALL">All Status</option>
            <option value="CONFIGURED">Timetable Active</option>
            <option value="PENDING">Not Created</option>
          </select>

          {/* Primary Create Timetable Button */}
          <button
            onClick={() => setIsSelectFacultyOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-85 transition-opacity shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Timetable</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <Table
        data={filteredStaff}
        columns={columns}
        keyField="id"
        emptyMessage="No faculty matching criteria found."
      />

      {/* Quick "Select Faculty" to Create Timetable Modal */}
      {isSelectFacultyOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] border border-border-light dark:border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-border-light dark:border-border-dark pb-4">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Create Faculty Timetable</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Select a faculty member to design their 5-day × 7-hour schedule
                </p>
              </div>
              <button
                onClick={() => setIsSelectFacultyOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-gray-500">
                Choose Faculty Member *
              </label>
              <select
                value={selectedFacultyForCreate}
                onChange={e => setSelectedFacultyForCreate(e.target.value)}
                className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
              >
                <option value="">Select Faculty...</option>
                {staffData.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.staffId} - {s.department?.name || 'Faculty'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border-light dark:border-border-dark">
              <button
                type="button"
                onClick={() => setIsSelectFacultyOpen(false)}
                className="px-4 py-2 rounded-xl border border-border-light dark:border-border-dark text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFacultyForCreate}
                onClick={handleCreateNewTimetable}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
              >
                Continue to Creator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Faculty Timetable Modal (View / Edit) */}
      {activeModalStaff && (
        <FacultyTimetableModal
          staff={activeModalStaff}
          initialEditMode={modalEditMode}
          onClose={() => setActiveModalStaff(null)}
          onSaved={handleTimetableSaved}
        />
      )}
    </div>
  );
}
