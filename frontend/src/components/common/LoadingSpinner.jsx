import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  message = 'Loading data from backend...',
  size = 'md',
  fullHeight = false,
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-8 text-slate-500 ${
        fullHeight ? 'min-h-[400px]' : ''
      }`}
    >
      <Loader2 className={`animate-spin text-indigo-600 ${sizeClasses[size] || sizeClasses.md}`} />
      {message && <p className="text-sm font-medium text-slate-600">{message}</p>}
    </div>
  );
}

export function SkeletonRow({ columns = 5 }) {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-slate-200 rounded-md w-full"></div>
        </td>
      ))}
    </tr>
  );
}
