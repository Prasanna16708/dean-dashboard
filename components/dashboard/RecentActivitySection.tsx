'use client';

import { useMemo, useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Users, 
  UserCog, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Building2, 
  Database, 
  RotateCcw, 
  Activity, 
  Search,
  Filter,
  Trash2,
  Check
} from 'lucide-react';

export interface ActivityLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: string | null;
  timestamp: string | Date;
  admin: {
    name: string;
    email: string;
  };
}

interface RecentActivitySectionProps {
  activities: ActivityLogItem[];
}

function getActionInfo(action: string, entity: string) {
  const upper = action.toUpperCase();
  const entityUpper = entity.toUpperCase();

  if (upper.includes('TIMETABLE')) {
    return {
      title: upper.includes('SAVED') ? 'Configured Faculty Timetable' : 'Updated Faculty Timetable',
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60'
    };
  }
  if (upper.includes('STUDENT')) {
    return {
      title: upper.includes('IMPORT') 
        ? 'Imported Students via Spreadsheet' 
        : upper.includes('CREATE') 
        ? 'Enrolled New Student' 
        : upper.includes('UPDATE')
        ? 'Updated Student Profile'
        : 'Deleted Student Record',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'
    };
  }
  if (upper.includes('STAFF')) {
    return {
      title: upper.includes('IMPORT')
        ? 'Imported Faculty via Spreadsheet'
        : upper.includes('CREATE')
        ? 'Added New Faculty Member'
        : upper.includes('UPDATE')
        ? 'Updated Faculty Details'
        : 'Removed Faculty Member',
      icon: UserCog,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60'
    };
  }
  if (upper.includes('ATTENDANCE')) {
    return {
      title: 'Imported Attendance Register',
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
    };
  }
  if (upper.includes('DISCIPLINARY')) {
    return {
      title: 'Logged Disciplinary Action',
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
    };
  }
  if (upper.includes('NOTE')) {
    return {
      title: 'Uploaded Class Note / Material',
      icon: BookOpen,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60'
    };
  }
  if (upper.includes('DOCUMENT')) {
    return {
      title: 'Uploaded Faculty Document',
      icon: FileText,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60'
    };
  }
  if (upper.includes('BACKUP')) {
    return {
      title: 'Created Database Backup',
      icon: Database,
      color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/60'
    };
  }
  if (upper.includes('DEPARTMENT')) {
    return {
      title: 'Created Department',
      icon: Building2,
      color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60'
    };
  }
  if (upper.includes('ROLLOVER')) {
    return {
      title: 'Academic Year Rollover',
      icon: RotateCcw,
      color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800/60'
    };
  }

  return {
    title: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    icon: Activity,
    color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'
  };
}

function formatRelativeTime(dateInput: string | Date) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function parseMetadata(meta: string | null) {
  if (!meta) return null;
  try {
    const parsed = JSON.parse(meta);
    if (typeof parsed === 'object' && parsed !== null) {
      const entries = Object.entries(parsed);
      if (entries.length === 0) return null;
      return entries
        .filter(([k]) => !['staffId', 'adminId'].includes(k))
        .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${String(v)}`)
        .join(' • ');
    }
  } catch {
    // If not JSON, return as plain text
  }
  return meta;
}

export function RecentActivitySection({ activities }: RecentActivitySectionProps) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredActivities = useMemo(() => {
    return activities.filter(item => {
      const matchesSearch = 
        !search ||
        item.action.toLowerCase().includes(search.toLowerCase()) ||
        item.entity.toLowerCase().includes(search.toLowerCase()) ||
        (item.metadata || '').toLowerCase().includes(search.toLowerCase()) ||
        item.admin.name.toLowerCase().includes(search.toLowerCase());

      const matchesFilter = 
        filter === 'ALL' || 
        item.entity.toLowerCase() === filter.toLowerCase() ||
        item.action.toLowerCase().includes(filter.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [activities, search, filter]);

  return (
    <div className="mt-16 space-y-6">
      {/* Section Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-black/60 backdrop-blur-liquid border border-border-light dark:border-border-dark shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-light tracking-wide text-black dark:text-white">
                What Has Been Done
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                <Check className="w-3 h-3" />
                Live Log
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 tracking-wide">
              Recent administrative updates and operations across the college
            </p>
          </div>

          {/* Auto-Delete 3 Days Notice Badge */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-gray-600 dark:text-gray-300">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Auto-deletes after 3 days</span>
            </span>
          </div>
        </div>

        {/* Search & Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search recent activity..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/50 dark:bg-black/50 border border-border-light dark:border-border-dark focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'All Activities', value: 'ALL' },
              { label: 'Timetable', value: 'FacultyTimetable' },
              { label: 'Students', value: 'Student' },
              { label: 'Staff', value: 'Staff' },
              { label: 'Attendance', value: 'attendance' },
              { label: 'Disciplinary', value: 'disciplinary' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  filter === tab.value
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white border border-border-light dark:border-border-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feed List */}
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border-light dark:border-border-dark rounded-xl space-y-2">
            <Clock className="w-8 h-8 mx-auto text-gray-400 opacity-60" />
            <p className="text-sm font-medium text-black dark:text-white">
              No recent activity recorded in the last 3 days.
            </p>
            <p className="text-xs text-gray-500">
              Any actions you take (creating timetables, enrolling students, importing attendance) will appear here and automatically clear after 72 hours.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map(item => {
              const info = getActionInfo(item.action, item.entity);
              const Icon = info.icon;
              const metaText = parseMetadata(item.metadata);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#121212] border border-border-light dark:border-border-dark hover:border-black/30 dark:hover:border-white/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${info.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-black dark:text-white">
                          {info.title}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-gray-500 border border-border-light dark:border-border-dark">
                          {item.entity}
                        </span>
                      </div>
                      {metaText && (
                        <p className="text-xs text-gray-500 truncate font-mono text-[11px]">
                          {metaText}
                        </p>
                      )}
                      <div className="text-[11px] text-gray-400 flex items-center gap-2">
                        <span>By {item.admin?.name || 'System Admin'}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <span className="text-xs font-medium text-gray-500 font-mono px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
