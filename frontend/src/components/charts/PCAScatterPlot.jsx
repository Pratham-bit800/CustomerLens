import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { SEGMENTS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

function ScatterTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isCentroid = data.isCentroid;
    const segment = SEGMENTS[data.cluster_id];

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg text-xs max-w-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-900 pb-1.5 border-b border-slate-100">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: segment?.color || '#6366F1' }}
          />
          <span className="truncate">
            {isCentroid ? `Group Center: ${segment?.name}` : `Customer #${data.customer_id}`}
          </span>
        </div>

        <div className="mt-2 space-y-1 text-slate-600">
          <div className="flex justify-between">
            <span>Customer Group:</span>
            <span className="font-semibold text-slate-900">{segment?.shortName || `Group ${data.cluster_id}`}</span>
          </div>
          {!isCentroid ? (
            <>
              <div className="flex justify-between">
                <span>Annual Income:</span>
                <span className="font-medium text-slate-900">{formatCurrency(data.income)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Spending:</span>
                <span className="font-medium text-slate-900">{formatCurrency(data.total_spending)}</span>
              </div>
              <div className="flex justify-between">
                <span>Education & Household:</span>
                <span className="font-medium text-slate-900">{data.education} · {data.living_with}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Map Coordinates:</span>
                <span className="font-mono">
                  ({data.pc1.toFixed(2)}, {data.pc2.toFixed(2)})
                </span>
              </div>
            </>
          ) : (
            <div className="text-[11px] text-slate-500 pt-1">
              Represents the typical spending and demographic center for this customer group.
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default function PCAScatterPlot({
  points = [],
  centroids = [],
  selectedCluster = null,
  onPointClick = null,
}) {
  // Filter points if a specific cluster is selected
  const filteredPoints = useMemo(() => {
    if (selectedCluster === null || selectedCluster === undefined || selectedCluster === '') {
      return points;
    }
    return points.filter((p) => p.cluster_id === Number(selectedCluster));
  }, [points, selectedCluster]);

  // Prepare centroids data
  const centroidPoints = useMemo(() => {
    return centroids.map((c) => ({
      customer_id: `C${c.cluster_id}`,
      pc1: c.centroid.pc1,
      pc2: c.centroid.pc2,
      cluster_id: c.cluster_id,
      isCentroid: true,
    }));
  }, [centroids]);

  return (
    <div className="w-full">
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              type="number"
              dataKey="pc1"
              name="Spending & Income Axis"
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              label={{
                value: 'Spending & Income Level (Lower Spend ← → Higher Spend)',
                position: 'insideBottom',
                offset: -14,
                fontSize: 11,
                fill: '#64748B',
              }}
            />
            <YAxis
              type="number"
              dataKey="pc2"
              name="Family Structure Axis"
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              label={{
                value: 'Family & Household Dynamics (Solo Living ← → Family with Kids)',
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                fontSize: 11,
                fill: '#64748B',
              }}
            />
            <Tooltip content={<ScatterTooltip />} />
            
            {/* Customer points */}
            <Scatter
              name="Customers"
              data={filteredPoints}
              shape="circle"
              onClick={(p) => onPointClick?.(p)}
            >
              {filteredPoints.map((entry, index) => (
                <Cell
                  key={`point-${index}`}
                  fill={SEGMENTS[entry.cluster_id]?.color || '#6366F1'}
                  fillOpacity={0.65}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                />
              ))}
            </Scatter>

            {/* Cluster Centroids */}
            <Scatter
              name="Group Centers"
              data={centroidPoints}
              shape="cross"
            >
              {centroidPoints.map((entry, index) => (
                <Cell
                  key={`centroid-${index}`}
                  fill="#0F172A"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 px-2 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400 opacity-60" />
            <span>Individual Customer Profile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-sm">✕</span>
            <span>Group Benchmark Center (Typical Customer)</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400">
          Showing {filteredPoints.length.toLocaleString()} customer profiles
        </div>
      </div>
    </div>
  );
}
