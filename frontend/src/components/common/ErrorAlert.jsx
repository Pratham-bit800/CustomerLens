import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({
  title = 'Failed to load data',
  message,
  onRetry,
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 text-rose-900 shadow-xs">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          <p className="mt-1 text-xs text-rose-700 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search terms or clearing your segment filters.',
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
