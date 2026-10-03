'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Plus, BookOpen } from 'lucide-react';

export default function UploadClassNotePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [staffName, setStaffName] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [useCustomStaff, setUseCustomStaff] = useState(false);
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [batch, setBatch] = useState('2024-2028');
  const [year, setYear] = useState('I');
  
  const [subjectId, setSubjectId] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [useCustomSubject, setUseCustomSubject] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch departments and staff on load
  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDepartments(data);
          if (data.length > 0 && !departmentId) {
            setDepartmentId(data[0].id);
          }
        }
      })
      .catch(() => setDepartments([]));

    fetch('/api/staff/list')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStaffList(data);
        }
      })
      .catch(() => setStaffList([]));
  }, []);

  // Fetch subjects dynamically when department or year changes
  useEffect(() => {
    if (departmentId && year) {
      fetch(`/api/subjects?departmentId=${departmentId}&year=${year}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setSubjects(data);
            setSubjectId(data[0].id);
            setUseCustomSubject(false);
          } else {
            setSubjects([]);
            setSubjectId('');
            setUseCustomSubject(true);
          }
        })
        .catch(() => {
          setSubjects([]);
          setUseCustomSubject(true);
        });
    }
  }, [departmentId, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !departmentId) {
      setError("Please fill all required fields and select a note file.");
      return;
    }

    const finalSubject = useCustomSubject ? customSubjectName.trim() : subjectId;
    if (!finalSubject) {
      setError("Please provide or select a subject name.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("File exceeds the 15MB limit.");
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name.trim());
    formData.append('staffName', staffName.trim());
    formData.append('description', description.trim());
    formData.append('departmentId', departmentId);
    formData.append('batch', batch.trim() || '2024-2028');
    formData.append('year', year);

    if (useCustomSubject) {
      formData.append('subjectName', customSubjectName.trim());
    } else {
      formData.append('subjectId', subjectId);
    }

    try {
      const res = await fetch('/api/notes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      router.push('/notes');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto space-y-6">
      <div className="border-b border-border-light dark:border-border-dark pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Upload Class Note</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Attach lectures, study material, and references (up to 15MB)</p>
        </div>
        <Link 
          href="/notes" 
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notes</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/60 dark:bg-[#121212]/60 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-xl space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Note Title *</label>
            <input 
              type="text" 
              placeholder="e.g., Unit 1 - Operating System Concepts & Kernel Architecture"
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm" 
            />
          </div>

          <div className="space-y-2 col-span-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Faculty / Staff Name</label>
              {staffList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomStaff(!useCustomStaff);
                    if (!useCustomStaff) {
                      setSelectedStaffId('');
                    }
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {useCustomStaff ? '← Select registered staff' : '+ Enter custom staff name'}
                </button>
              )}
            </div>

            {!useCustomStaff && staffList.length > 0 ? (
              <select 
                value={selectedStaffId} 
                onChange={e => {
                  const id = e.target.value;
                  setSelectedStaffId(id);
                  const found = staffList.find(s => s.id === id);
                  setStaffName(found ? found.name : '');
                }} 
                className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
              >
                <option value="">Select Faculty / Staff (Optional)</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.staffId} - {s.designation})</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                placeholder="e.g., Dr. S. Ramesh / Prof. John Doe"
                value={staffName} 
                onChange={e => setStaffName(e.target.value)} 
                className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm" 
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Department *</label>
            <select 
              value={departmentId} 
              onChange={e => setDepartmentId(e.target.value)} 
              required 
              className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Academic Year *</label>
            <select 
              value={year} 
              onChange={e => setYear(e.target.value)} 
              required 
              className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
            >
              <option value="I">I Year</option>
              <option value="II">II Year</option>
              <option value="III">III Year</option>
              <option value="IV">IV Year</option>
            </select>
          </div>

          <div className="space-y-2 col-span-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Subject *</label>
              {subjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseCustomSubject(!useCustomSubject)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {useCustomSubject ? '← Choose from existing subjects' : '+ Enter custom subject name'}
                </button>
              )}
            </div>

            {!useCustomSubject && subjects.length > 0 ? (
              <select 
                value={subjectId} 
                onChange={e => setSubjectId(e.target.value)} 
                required 
                className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., Data Structures and Algorithms / CS3301"
                  value={customSubjectName}
                  onChange={e => setCustomSubjectName(e.target.value)}
                  required
                  className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Batch Year *</label>
            <input 
              type="text" 
              placeholder="e.g., 2024-2028" 
              value={batch} 
              onChange={e => setBatch(e.target.value)} 
              required 
              className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Description (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g., Contains diagrams and practice questions" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Document File * (PDF, DOCX, Max 15MB)</label>
          <div className="p-8 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl bg-white/40 dark:bg-black/40 text-center space-y-2">
            <input 
              type="file" 
              accept=".pdf, .doc, .docx" 
              onChange={e => setFile(e.target.files?.[0] || null)} 
              required 
              className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-80 cursor-pointer" 
            />
            {file && (
              <p className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-border-light dark:border-border-dark flex justify-end">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-black text-white dark:bg-white dark:text-black rounded-xl font-medium tracking-wide hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm text-sm"
          >
            <Upload className="w-4 h-4" />
            {loading ? 'Uploading & Processing Note...' : 'Upload Class Note'}
          </button>
        </div>
      </form>
    </div>
  );
}