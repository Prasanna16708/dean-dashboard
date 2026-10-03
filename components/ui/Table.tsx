import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode) | string;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField?: keyof T | string;
  keyExtractor?: (row: T, index?: number) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: string | ((row: T) => string);
}

export function Table<T>({ 
  data, 
  columns, 
  keyField, 
  keyExtractor, 
  emptyMessage = "No data found.",
  onRowClick,
  rowClassName 
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-border-light dark:border-border-dark rounded-xl bg-white/30 dark:bg-black/30 backdrop-blur-liquid text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const getRowKey = (row: T, index: number) => {
    if (keyExtractor) return keyExtractor(row, index);
    if (keyField) return String((row as Record<string, unknown>)[String(keyField)] ?? index);
    return String(index);
  };

  const renderCellValue = (value: unknown): React.ReactNode => {
    if (value == null) return '-';
    if (React.isValidElement(value)) return value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '-';
      }
    }
    return String(value);
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border-light dark:border-border-dark bg-white/50 dark:bg-black/50 backdrop-blur-liquid shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-smoke-white dark:bg-[#111] sticky top-0 z-10">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={`px-6 py-4 font-medium tracking-wide border-b border-border-light dark:border-border-dark text-gray-600 dark:text-gray-300 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light dark:border-border-dark">
          {data.map((row, index) => (
            <tr 
              key={getRowKey(row, index)} 
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${typeof rowClassName === 'function' ? rowClassName(row) : (rowClassName || '')}`}
            >
              {columns.map((col, i) => {
                const rawValue = typeof col.accessor === 'function' ? col.accessor(row) : (row as Record<string, unknown>)[String(col.accessor)];
                const value = renderCellValue(rawValue);
                return (
                  <td key={i} className={`px-6 py-4 font-light ${col.className || ''}`}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}