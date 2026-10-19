import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { SEGMENTS } from '../../utils/constants';

function ComparisonTooltip({ active, payload, metricLabel }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md text-xs">
        <div className="font-semibold text-slate-900 mb-1">{d.name}</div>
        <div className="text-slate-600">
          {metricLabel || 'Value'}:{' '}
          <span className="font-bold text-slate-900">
            {typeof d.value === 'number'
              ? d.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
              : d.value}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function FeatureComparisonChart({
  clusters = [],
  metricKey = 'Income',
  metricLabel = 'Annual Income ($)',
}) {
  if (!clusters || clusters.length === 0) return null;

  const data = clusters.map((c) => ({
    name: SEGMENTS[c.cluster_id]?.shortName || `Group ${c.cluster_id}`,
    cluster_id: c.cluster_id,
    value: c.feature_means?.[metricKey] || 0,
    color: SEGMENTS[c.cluster_id]?.color || '#6366F1',
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          />
          <Tooltip content={<ComparisonTooltip metricLabel={metricLabel} />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Bar key={`bar-${entry.cluster_id}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
