'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggle = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  if (!mounted) {
    return (
      <div className="px-4 py-2 text-xs font-medium uppercase rounded-full border border-border-light dark:border-border-dark bg-white/80 dark:bg-black/80 backdrop-blur-liquid text-black dark:text-white shadow-sm flex items-center gap-2">
        <Sun className="w-3.5 h-3.5" /> Light Mode
      </div>
    );
  }

  return (
    <button 
      onClick={toggle}
      className="px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-full border border-border-light dark:border-border-dark bg-white/80 dark:bg-black/80 backdrop-blur-liquid hover:bg-black/5 dark:hover:bg-white/5 transition-all text-black dark:text-white shadow-sm flex items-center gap-2 cursor-pointer"
      title="Toggle Light / Dark Mode"
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-blue-600" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}