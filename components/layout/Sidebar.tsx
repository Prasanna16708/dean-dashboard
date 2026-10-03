'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  BookOpen, 
  Lock, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Building2, 
  Shield, 
  Database, 
  Settings,
  LogOut
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Staff', path: '/staff', icon: UserCog },
    { name: 'Class Notes', path: '/notes', icon: BookOpen },
    { name: 'Timetable', path: '/timetable', icon: Calendar },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Attendance', path: '/attendance', icon: CheckCircle },
    { name: 'Disciplinary', path: '/disciplinary', icon: AlertTriangle },
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Backups', path: '/backups', icon: Database },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-border-light dark:border-border-dark bg-white/50 dark:bg-black/50 backdrop-blur-liquid flex flex-col z-50 transition-all duration-300 overflow-y-auto no-scrollbar">
      
      <div className="p-8 border-b border-border-light dark:border-border-dark">
        <h2 className="text-xl font-light tracking-widest uppercase text-black dark:text-white">DEAN</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105' 
                  : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white hover:scale-105'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold tracking-widest uppercase">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-light dark:border-border-dark flex flex-col gap-4">
        {/* Theme Toggle Guaranteed to Render Here */}
        <ThemeToggle />
        
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold tracking-widest uppercase rounded-xl border border-border-light dark:border-border-dark hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}