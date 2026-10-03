export const dynamic = 'force-dynamic';
'use client';

import { useState } from 'react';
import { parseExcelFile, ParsedStudentRow } from '@/lib/excel';
import { Table } from '@/components/ui/Table';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, UploadCloud, FileSpreadsheet } from 'lucide-react';

export default function StudentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParsedStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError('');
    setReport(null);
    
    try {
      const parsed = await parseExcelFile(selectedFile);
      setPreviewData(parsed);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file.');
    }
  };

  const handleUpload = async () => {
    if (previewData.length === 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: previewData }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Import failed');
      
      setReport(result);
      setPreviewData([]); // Clear preview on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const previewColumns = [
    { header: 'Register No', accessor: 'registerNumber' as const },
    { header: 'Name', accessor: 'name' as const },
    { header: 'Department', accessor: 'departmentName' as const },
    { header: 'Year', accessor: 'currentYear' as const },
    { header: 'Batch', accessor: 'batch' as const },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-6">
      <div className="border-b border-border-light dark:border-border-dark pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Import Students</h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">Upload an Excel (.xlsx, .xls) file to add or update records in bulk.</p>
        </div>
        <Link href="/students" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </Link>
      </div>

      {!report ? (
        <div className="space-y-6">
          {/* Upload Zone */}
          <div className="p-8 border-2 border-dashed border-border-light dark:border-border-dark rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-liquid text-center space-y-4">
            <UploadCloud className="w-10 h-10 mx-auto text-gray-400" />
            <div>
              <p className="font-medium text-sm">Upload Student Excel or CSV File</p>
              <p className="text-xs text-gray-500 mt-1">Accepts .xlsx, .xls, or .csv. Headers: Register No, Name, Department, Year, Batch.</p>
            </div>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileChange} 
              className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-80 cursor-pointer"
            />
            {error && <p className="mt-2 text-red-500 text-sm font-medium">{error}</p>}
          </div>

          {/* Preview Section */}
          {previewData.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <h3 className="text-lg font-medium">Data Preview ({previewData.length} valid rows)</h3>
                </div>
                <button 
                  onClick={handleUpload} 
                  disabled={loading}
                  className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer text-sm font-medium"
                >
                  {loading ? 'Importing...' : 'Confirm & Import Students'}
                </button>
              </div>
              <Table 
                data={previewData.slice(0, 100)}
                columns={previewColumns} 
                keyField="registerNumber"
              />
              {previewData.length > 100 && (
                <p className="text-xs text-gray-500 text-center mt-2">Showing 100 of {previewData.length} rows.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Success Report */
        <div className="p-8 rounded-2xl bg-white/60 dark:bg-black/60 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-xl text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto" />
          <h2 className="text-2xl font-light">Import Complete</h2>
          <div className="flex justify-center gap-8 text-lg font-medium mt-6">
            <div className="bg-gray-500/10 px-6 py-3 rounded-xl border border-gray-500/20">
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider block">Total Rows</span>
              <span className="text-2xl">{report.total}</span>
            </div>
            <div className="bg-green-500/10 px-6 py-3 rounded-xl border border-green-500/20">
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider block">New Students</span>
              <span className="text-2xl text-green-600 dark:text-green-400">{report.new}</span>
            </div>
            <div className="bg-blue-500/10 px-6 py-3 rounded-xl border border-blue-500/20">
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider block">Updated</span>
              <span className="text-2xl text-blue-600 dark:text-blue-400">{report.updated}</span>
            </div>
          </div>
          {report.errors && report.errors.length > 0 && (
            <div className="mt-6 text-left p-4 bg-red-50 dark:bg-red-950/30 rounded border border-red-100 dark:border-red-900 h-48 overflow-y-auto text-sm text-red-600 dark:text-red-400">
              <p className="font-bold mb-2">Errors / Skipped Rows:</p>
              <ul className="list-disc pl-4 space-y-1">
                {report.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          <div className="pt-6 flex justify-end">
            <Link href="/students" className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-80 transition-opacity text-sm font-medium">
              View Students Directory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
