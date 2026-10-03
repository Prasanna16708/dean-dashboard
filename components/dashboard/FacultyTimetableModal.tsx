'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Pencil, 
  Check, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  RotateCcw, 
  Save, 
  Sparkles,
  AlertCircle,
  Eye
} from 'lucide-react';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export type DayOfWeek = typeof DAYS[number];

export const DEFAULT_PERIOD_TIMES = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:15 - 12:15',
  '12:15 - 01:15',
  '02:00 - 03:00',
  '03:00 - 04:00',
  '04:00 - 05:00',
];

export interface TimetableSchedule {
  periodTimes: string[];
  schedule: Record<string, string[]>;
  updatedAt?: string;
}

export interface FacultyTimetableModalProps {
  staff: {
    id: string;
    staffId: string;
    name: string;
    designation?: string;
    department?: {
      id?: string;
      name?: string;
    };
    timetables?: Array<{
      id: string;
      version: number;
      scheduleData?: string | null;
      uploadedAt?: string | Date;
    }>;
  };
  initialEditMode?: boolean;
  onClose: () => void;
  onSaved?: (updatedStaffId: string, newScheduleData: string, newVersion: number) => void;
}

export function FacultyTimetableModal({
  staff,
  initialEditMode = false,
  onClose,
  onSaved
}: FacultyTimetableModalProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isLoading, setIsLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 7 Period Times
  const [periodTimes, setPeriodTimes] = useState<string[]>([...DEFAULT_PERIOD_TIMES]);

  // 5 Days x 7 Slots Matrix
  const [grid, setGrid] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const day of DAYS) {
      initial[day] = Array(7).fill('');
    }
    return initial;
  });

  const [activeVersion, setActiveVersion] = useState<number>(1);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load existing schedule on open
  useEffect(() => {
    async function loadTimetable() {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/timetable?staffId=${encodeURIComponent(staff.id)}`);
        const data = await res.json();
        
        if (data.timetable) {
          setActiveVersion(data.timetable.version || 1);
          if (data.timetable.uploadedAt) {
            setLastUpdated(new Date(data.timetable.uploadedAt).toLocaleDateString());
          }

          if (data.timetable.parsedSchedule) {
            const parsed = data.timetable.parsedSchedule;
            if (Array.isArray(parsed.periodTimes) && parsed.periodTimes.length === 7) {
              setPeriodTimes(parsed.periodTimes);
            }
            if (parsed.schedule) {
              const loadedGrid: Record<string, string[]> = {};
              for (const day of DAYS) {
                const daySlots = Array.isArray(parsed.schedule[day]) ? parsed.schedule[day] : [];
                loadedGrid[day] = Array.from({ length: 7 }, (_, i) => daySlots[i] || '');
              }
              setGrid(loadedGrid);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load timetable:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTimetable();
  }, [staff.id]);

  const handleCellChange = (day: string, periodIndex: number, value: string) => {
    setGrid(prev => {
      const updatedDay = [...prev[day]];
      updatedDay[periodIndex] = value;
      return {
        ...prev,
        [day]: updatedDay
      };
    });
  };

  const handlePeriodTimeChange = (index: number, value: string) => {
    setPeriodTimes(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleResetTimings = () => {
    setPeriodTimes([...DEFAULT_PERIOD_TIMES]);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all class entries in this timetable?')) {
      const empty: Record<string, string[]> = {};
      for (const day of DAYS) {
        empty[day] = Array(7).fill('');
      }
      setGrid(empty);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staff.id,
          periodTimes,
          schedule: grid
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save timetable');
      }

      setSuccessMsg('Timetable saved successfully!');
      if (data.timetable) {
        setActiveVersion(data.timetable.version);
        setLastUpdated(new Date().toLocaleDateString());
        if (onSaved) {
          onSaved(staff.id, data.timetable.scheduleData, data.timetable.version);
        }
      }

      setTimeout(() => {
        setIsEditing(false);
        setSuccessMsg('');
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Error saving timetable');
    } finally {
      setSaveLoading(false);
    }
  };

  // Count assigned hours
  const totalAssignedHours = Object.values(grid).reduce((total, daySlots) => {
    return total + daySlots.filter(cell => cell.trim().length > 0).length;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121212] border border-border-light dark:border-border-dark rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-border-light dark:border-border-dark flex flex-wrap items-center justify-between gap-4 bg-smoke-white/40 dark:bg-black/30">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-medium text-black dark:text-white tracking-wide">
                  {staff.name}
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-gray-600 dark:text-gray-300 font-medium">
                  {staff.staffId}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 font-medium">
                  v{activeVersion} Active
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span>{staff.designation || 'Faculty Member'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-gray-400" />
                  {staff.department?.name || 'General Department'}
                </span>
                {lastUpdated && (
                  <>
                    <span>•</span>
                    <span className="text-gray-400">Updated: {lastUpdated}</span>
                  </>
                )}
                <span>•</span>
                <span className="font-medium text-black dark:text-white">
                  {totalAssignedHours} / 35 Hours Assigned
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition-opacity shadow-sm cursor-pointer"
                title="Edit Timetable"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Timetable</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-xl border border-border-light dark:border-border-dark text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                  title="Clear all entries"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saveLoading}
                  className="px-3 py-1.5 rounded-xl border border-border-light dark:border-border-dark text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {saveLoading ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Timetable</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 rounded-xl text-xs flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body / Timetable Content */}
        <div className="p-5 sm:p-6 overflow-x-auto overflow-y-auto space-y-6 flex-1">
          
          {/* Timing Editor Header Bar when Editing */}
          {isEditing && (
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Configure Period Timings (7 Hours)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetTimings}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  title="Reset to default college timings"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default Timings</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {periodTimes.map((time, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                      Hour {idx + 1}
                    </label>
                    <input
                      type="text"
                      value={time}
                      onChange={e => handlePeriodTimeChange(idx, e.target.value)}
                      placeholder="e.g. 09:00 - 10:00"
                      className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-[#1a1a1a] border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timetable Table Grid */}
          <div className="border border-border-light dark:border-border-dark rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-[#121212]">
            <table className="w-full border-collapse text-left min-w-[760px]">
              {/* Header Row */}
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark bg-smoke-white/60 dark:bg-black/40">
                  <th className="p-3.5 text-xs font-bold uppercase tracking-widest text-gray-500 w-28 border-r border-border-light dark:border-border-dark text-center">
                    Day / Hour
                  </th>
                  {periodTimes.map((time, idx) => (
                    <th key={idx} className="p-3 text-center border-r last:border-r-0 border-border-light dark:border-border-dark">
                      <div className="text-xs font-bold tracking-wider text-black dark:text-white uppercase">
                        Hour {idx + 1}
                      </div>
                      <div className="text-[11px] font-mono font-medium text-gray-500 mt-0.5 tracking-tight">
                        {time || `Period ${idx + 1}`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows for Monday to Friday */}
              <tbody>
                {DAYS.map((day, dayIndex) => {
                  const daySlots = grid[day] || Array(7).fill('');
                  return (
                    <tr 
                      key={day} 
                      className={`border-b last:border-b-0 border-border-light dark:border-border-dark transition-colors ${
                        dayIndex % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.015] dark:bg-white/[0.015]'
                      }`}
                    >
                      {/* Day Label Cell */}
                      <td className="p-3.5 font-semibold text-xs text-black dark:text-white border-r border-border-light dark:border-border-dark text-center bg-black/5 dark:bg-white/5">
                        <span className="tracking-wider uppercase">{day}</span>
                      </td>

                      {/* 7 Period Slot Cells */}
                      {daySlots.map((slotValue, periodIdx) => {
                        return (
                          <td 
                            key={periodIdx} 
                            className="p-2 border-r last:border-r-0 border-border-light dark:border-border-dark text-center align-middle"
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={slotValue}
                                onChange={e => handleCellChange(day, periodIdx, e.target.value)}
                                placeholder="Class code"
                                className="w-full px-2 py-2 text-xs text-center rounded-xl bg-white dark:bg-[#1a1a1a] border border-border-light dark:border-border-dark focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-all placeholder:text-gray-400 font-medium"
                              />
                            ) : (
                              <div className="min-h-[44px] flex items-center justify-center p-1">
                                {slotValue && slotValue.trim() ? (
                                  <div className="w-full py-1.5 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark hover:border-black/30 dark:hover:border-white/30 transition-all text-xs font-semibold text-black dark:text-white shadow-xs">
                                    {slotValue}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-700 text-xs select-none">
                                    —
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Instructions / Status */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 px-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                <span>Active Period: Class Assigned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700 inline-block"></span>
                <span>Empty: Free Period</span>
              </div>
            </div>

            {!isEditing ? (
              <p className="text-[11px] text-gray-400">
                Tip: Click the <strong className="text-black dark:text-white">Edit Timetable</strong> button above to update periods or timings.
              </p>
            ) : (
              <p className="text-[11px] text-gray-400">
                Type freely in any period to assign classes, and click <strong className="text-black dark:text-white">Save Timetable</strong>.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
