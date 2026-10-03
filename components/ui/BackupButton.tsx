'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BackupButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBackup = async () => {
    if (!confirm("Generate a new manual backup?")) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      if (!res.ok) throw new Error('Backup failed');
      
      alert('Backup completed successfully!');
      router.refresh();
    } catch (error) {
      alert('Error creating backup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleBackup} 
      disabled={loading}
      className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-80 transition-opacity disabled:opacity-50"
    >
      {loading ? 'Creating...' : 'Create Manual Backup'}
    </button>
  );
}
