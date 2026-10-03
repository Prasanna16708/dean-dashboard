'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  data: any[];
  filename: string;
  className?: string;
  label?: string;
}

export function ExportButton({ 
  data, 
  filename, 
  className = "flex items-center gap-2 px-5 py-2.5 bg-white/50 dark:bg-black/50 backdrop-blur-liquid border border-border-light dark:border-border-dark text-black dark:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm font-medium shadow-sm cursor-pointer",
  label = "Export CSV" 
}: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Extract headers
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV string safely
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => {
          let cellData = row[fieldName];
          // Handle objects (like nested department names) and escape commas
          if (typeof cellData === 'object' && cellData !== null) {
            cellData = cellData.name || JSON.stringify(cellData);
          }
          let stringData = String(cellData ?? '');
          if (stringData.includes(',') || stringData.includes('\n') || stringData.includes('"')) {
            stringData = `"${stringData.replace(/"/g, '""')}"`;
          }
          return stringData;
        }).join(',')
      )
    ].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={handleExport}
      className={className}
      title="Export records to CSV"
    >
      <Download className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}