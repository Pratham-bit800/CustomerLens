import React from 'react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'default',
  trend = null, // { value: '+12%', isPositive: true }
}) {
  const badgeStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {badge && (
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${badgeStyles[badgeType] || badgeStyles.default}`}>
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
          {trend && (
            <span className={`font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
