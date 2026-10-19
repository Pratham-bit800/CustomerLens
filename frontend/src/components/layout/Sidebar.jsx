import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Users,
  Sparkles,
  Lightbulb,
  Cpu,
  X,
  Radio,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Customer Overview',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    to: '/segments',
    label: 'Customer Segments',
    icon: Layers,
    badge: '4 Groups',
  },
  {
    to: '/customers',
    label: 'Customer Directory',
    icon: Users,
    badge: '2,236 Customers',
  },
  {
    to: '/predict',
    label: 'Customer Group Finder',
    icon: Sparkles,
    badge: 'Match Profile',
  },
  {
    to: '/business-insights',
    label: 'Business Insights',
    icon: Lightbulb,
    badge: null,
  },
  {
    to: '/model-insights',
    label: 'How Customer Lens Works',
    icon: Cpu,
    badge: 'Methodology',
  },
];

export default function Sidebar({ isOpen, onClose, backendStatus }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-slate-950 border-r border-slate-800/80 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base">CustomerLens</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Analytics
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Customer Intelligence</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Analytics Platform
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold shadow-xs'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4.5 w-4.5 shrink-0 transition-colors group-hover:text-slate-200" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-slate-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Backend Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`relative flex h-2.5 w-2.5 ${
                    backendStatus?.isHealthy ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      backendStatus?.isHealthy ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      backendStatus?.isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </span>
                <span className="text-xs font-medium text-slate-300">
                  {backendStatus?.isHealthy ? 'Analytics Engine Online' : 'Connecting to API...'}
                </span>
              </div>
              <Radio className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>4 Customer Groups</span>
              <span className="font-mono text-slate-400">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
