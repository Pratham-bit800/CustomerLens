import React from 'react';
import { SEGMENTS } from '../../utils/constants';

export default function SegmentBadge({ clusterId, clusterName, size = 'sm', showDot = true }) {
  const segment = SEGMENTS[clusterId] || {
    name: clusterName || `Cluster ${clusterId}`,
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeDot: 'bg-slate-400',
  };

  const displayName = clusterName || segment.name;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs font-medium',
    md: 'px-3 py-1.5 text-sm font-medium',
    lg: 'px-3.5 py-2 text-base font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${segment.badge} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${segment.badgeDot}`}
          aria-hidden="true"
        />
      )}
      <span>{displayName}</span>
    </span>
  );
}
