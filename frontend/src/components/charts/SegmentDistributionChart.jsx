import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { SEGMENTS } from '../../utils/constants';

export default function SegmentDistributionChart({ data = [], type = 'bar' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-400">
        No distribution data available.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    cluster_id: item.cluster_id,
    name: SEGMENTS[item.cluster_id]?.name || item.name,
    shortName: SEGMENTS[item.cluster_id]?.shortName || item.name,
    count: item.count,
    percentage: item.percentage,
    color: SEGMENTS[item.cluster_id]?.color || '#6366F1',
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span>{d.name}</span>
          </div>
          <div className="text-slate-600 space-y-0.5">
            <div>
              Customers:{' '}
              <span className="font-semibold text-slate-900">
                {d.count.toLocaleString()}
              </span>
            </div>
            <div>
              Share of Base:{' '}
              <span className="font-semibold text-slate-900">
                {d.percentage}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (type === 'pie') {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.cluster_id}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs font-medium text-slate-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="shortName"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => val.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={`bar-${entry.cluster_id}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
