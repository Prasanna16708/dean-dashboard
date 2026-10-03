'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, CheckCircle2, Shield, ArrowRight, Database } from 'lucide-react';

interface RolloverResults {
  graduated: number;
  promotedTo4: number;
  promotedTo3: number;
  promotedTo2: number;
  totalAffected: number;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [results, setResults] = useState<RolloverResults | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleExecuteRollover = async () => {
    setLoading(true);
    setError('');
    setShowConfirm(false);

    try {
      const res = await fetch('/api/settings/rollover', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Rollover execution failed.');
      }
      
      setResults(data.results);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error executing rollover. Check server logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl space-y-8">
      <div className="border-b border-border-light dark:border-border-dark pb-6">
        <h1 className="text-3xl font-light tracking-wide">System Settings</h1>
        <p className="text-sm text-gray-500 mt-2 tracking-wide">Advanced administrative controls and end-of-year batch progression</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Results Card */}
      {results && (
        <div className="p-8 rounded-2xl bg-white/60 dark:bg-black/60 backdrop-blur-liquid border border-green-500/30 shadow-xl space-y-6">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-6 h-6" />
            <h2 className="text-xl font-medium">Academic Year Rollover Completed</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            All student batches have been successfully cascaded forward and an automatic safety database backup was saved.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-center">
              <span className="text-xs text-gray-500 block uppercase font-bold tracking-wider">I → II Year</span>
              <span className="text-2xl font-light mt-1 block">{results.promotedTo2}</span>
            </div>
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-center">
              <span className="text-xs text-gray-500 block uppercase font-bold tracking-wider">II → III Year</span>
              <span className="text-2xl font-light mt-1 block">{results.promotedTo3}</span>
            </div>
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-center">
              <span className="text-xs text-gray-500 block uppercase font-bold tracking-wider">III → IV Year</span>
              <span className="text-2xl font-light mt-1 block">{results.promotedTo4}</span>
            </div>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
              <span className="text-xs text-green-700 dark:text-green-300 block uppercase font-bold tracking-wider">Graduated</span>
              <span className="text-2xl font-light text-green-700 dark:text-green-300 mt-1 block">{results.graduated}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setResults(null)}
              className="px-5 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-xl hover:opacity-80 transition-opacity"
            >
              Dismiss Summary
            </button>
          </div>
        </div>
      )}

      {/* Rollover Card */}
      <div className="p-8 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg">Academic Year Rollover</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Executes the end-of-year batch progression in a single safe transaction:
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                Automatic SQLite Pre-Rollover safety backup created
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                IV Year students archived to <strong className="text-black dark:text-white">Graduated</strong>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                III Year promoted to <strong className="text-black dark:text-white">IV Year</strong>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                II Year promoted to <strong className="text-black dark:text-white">III Year</strong>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                I Year promoted to <strong className="text-black dark:text-white">II Year</strong> (leaving I Year slot open for incoming batch)
              </li>
            </ul>
          </div>

          <button 
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3.5 bg-red-600 text-white rounded-xl font-medium tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 shadow-md shrink-0 text-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing Cascade...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Start Academic Rollover
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/95 dark:bg-[#121212]/95 backdrop-blur-liquid border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-xl font-medium">Confirm Academic Year Rollover</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This action is <strong className="text-black dark:text-white">permanent</strong> and will batch-promote all active students (I → II → III → IV) and archive IV Year students as Graduated.
            </p>

            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-black dark:text-white">Pre-check summary:</p>
              <p>• A safety backup will be automatically generated.</p>
              <p>• Audit log entry will record the Dean ID and timestamps.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 text-sm rounded-xl border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRollover}
                disabled={loading}
                className="px-6 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}