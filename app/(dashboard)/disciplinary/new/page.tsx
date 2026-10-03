'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, User, X, Check, Building2, ShieldAlert } from 'lucide-react';

interface StudentItem {
  id: string;
  name: string;
  registerNumber: string;
  currentYear?: string;
  department?: {
    name: string;
  };
}

export default function NewDisciplinaryActionPage() {
  const router = useRouter();
  
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentId, setStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [actionTaken, setActionTaken] = useState(''); // Free text per requirements
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all active students for search
  useEffect(() => {
    fetch('/api/students/list') 
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
        }
      })
      .catch(() => setStudents([]));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedStudent = students.find(s => s.id === studentId);

  // Filter students by Name or Register Number
  const filteredStudents = students.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(term) ||
      s.registerNumber.toLowerCase().includes(term) ||
      (s.department?.name || '').toLowerCase().includes(term)
    );
  });

  const handleSelectStudent = (student: StudentItem) => {
    setStudentId(student.id);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleClearSelectedStudent = () => {
    setStudentId('');
    setSearchTerm('');
    setIsDropdownOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !date || !reason || !actionTaken) {
      setError("Please search and select a student, and fill all required fields.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/disciplinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, date, reason, actionTaken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record action');
      }

      router.push('/disciplinary');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto space-y-6">
      <div className="border-b border-border-light dark:border-border-dark pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Record Disciplinary Action</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Search student by name or register number and record conduct infraction.</p>
        </div>
        <Link href="/disciplinary" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Disciplinary</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/60 dark:bg-[#121212]/60 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-xl space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Student Search & Select Combobox */}
        <div className="space-y-2 relative" ref={dropdownRef}>
          <label className="text-xs font-bold tracking-widest uppercase text-gray-500">
            Student (Search by Name or Register Number) *
          </label>

          {selectedStudent ? (
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark flex items-center justify-between transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-black dark:text-white text-sm">
                    {selectedStudent.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-black dark:text-white">
                      {selectedStudent.registerNumber}
                    </span>
                    {selectedStudent.department?.name && (
                      <span>• {selectedStudent.department.name}</span>
                    )}
                    {selectedStudent.currentYear && (
                      <span>• Year {selectedStudent.currentYear}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearSelectedStudent}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Change Student</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type student name or register number (e.g., John or 24CSE001)..."
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full pl-10 pr-10 py-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-[#181818] border border-border-light dark:border-border-dark shadow-2xl divide-y divide-border-light dark:divide-border-dark animate-in fade-in slide-in-from-top-2 duration-150">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleSelectStudent(student)}
                        className="w-full p-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-medium text-black dark:text-white group-hover:underline">
                            {student.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-gray-700 dark:text-gray-300">
                              {student.registerNumber}
                            </span>
                            {student.department?.name && (
                              <span>• {student.department.name}</span>
                            )}
                            {student.currentYear && (
                              <span>• Year {student.currentYear}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          Select →
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No active students found matching &quot;{searchTerm}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Date of Incident / Action *</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            required 
            className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Reason / Infraction *</label>
          <input 
            type="text" 
            placeholder="e.g., Academic dishonesty during midterms / Late arrival repeatedly" 
            value={reason} 
            onChange={e => setReason(e.target.value)} 
            required 
            className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Action Taken (Free Text) *</label>
          <textarea 
            value={actionTaken} 
            onChange={e => setActionTaken(e.target.value)} 
            rows={4} 
            placeholder="Describe the administrative action taken (e.g., Verbal warning issued, parent meeting scheduled, 1-week suspension)..." 
            required 
            className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
          ></textarea>
        </div>

        <div className="pt-4 border-t border-border-light dark:border-border-dark flex justify-end">
          <button 
            type="submit" 
            disabled={loading || !studentId} 
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-black text-white dark:bg-white dark:text-black rounded-xl font-medium tracking-wide hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm text-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{loading ? 'Saving Record...' : 'Record Disciplinary Action'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}