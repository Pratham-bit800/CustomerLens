import React from 'react';

export default function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = 'p-5',
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs ${className}`}>
      {(title || subtitle || actions) && (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 px-5 py-4 gap-2 ${headerClassName}`}>
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
