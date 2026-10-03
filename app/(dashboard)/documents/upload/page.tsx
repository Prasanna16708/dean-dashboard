'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Upload, FileText } from 'lucide-react';

export default function UploadFacultyDocumentPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; staffId: string; designation: string }>>([]);
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/staff/list')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStaffList(data);
        } else {
          // Fallback fetch from regular staff endpoint
          fetch('/api/staff')
            .then(r => r.json())
            .then(d => {
              if (Array.isArray(d)) setStaffList(d);
            });
        }
      })
      .catch(() => {
        fetch('/api/staff')
          .then(r => r.json())
          .then(d => {
            if (Array.isArray(d)) setStaffList(d);
          })
          .catch(() => setStaffList([]));
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId || !name || !file) {
      setError('Please fill all required fields and select a file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15MB limit.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('staffId', staffId);
    formData.append('name', name);
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload document');

      router.push('/documents');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="mb-8 border-b border-border-light dark:border-border-dark pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Upload Faculty Document</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Attach certificates, service records, and research publications (up to 15MB)</p>
        </div>
        <Link 
          href="/documents" 
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-xl space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Faculty Member *</label>
          {staffList.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <p>No faculty members found in the database yet.</p>
              <Link href="/staff/import" className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium hover:opacity-80">
                Import Staff First
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
              className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
            >
              <option value="">Select Faculty / Staff...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.staffId}) {s.designation ? `- ${s.designation}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Document Title / Name *</label>
          <input
            type="text"
            placeholder="e.g., Ph.D Degree Certificate / Service Agreement"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Document File * (PDF, DOCX, PNG, JPG)</label>
          <div className="p-6 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl bg-black/5 dark:bg-white/5 text-center">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-80 cursor-pointer"
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
            {loading ? 'Uploading & Processing...' : 'Upload Document'}
          </button>
        </div>
      </form>
    </div>
  );
}
