import React from 'react';
import { Menu, Activity, ShieldCheck } from 'lucide-react';
import { SEGMENTS } from '../../utils/constants';

export default function Header({
  title,
  subtitle,
  onOpenMobileNav,
  backendStatus,
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-8 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Segment Color Pill Legend on larger screens */}
        <div className="hidden xl:flex items-center gap-2 pr-2 border-r border-slate-200">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Segments:
          </span>
          {Object.values(SEGMENTS).map((seg) => (
            <div
              key={seg.id}
              className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[11px]">{seg.shortName}</span>
            </div>
          ))}
        </div>

        {/* Backend Live Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <Activity
            className={`h-4 w-4 ${
              backendStatus?.isHealthy ? 'text-emerald-600' : 'text-rose-500 animate-pulse'
            }`}
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800">
              {backendStatus?.isHealthy ? 'Live API' : 'Disconnected'}
            </span>
            {backendStatus?.customers_loaded && (
              <span className="text-slate-500 hidden md:inline ml-1">
                ({backendStatus.customers_loaded.toLocaleString()} customers)
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
