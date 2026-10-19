import React, { useState, useEffect } from 'react';
import {
  Filter,
  TrendingUp,
  TrendingDown,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../api/endpoints';
import Card from '../components/common/Card';
import SegmentBadge from '../components/common/SegmentBadge';
import PCAScatterPlot from '../components/charts/PCAScatterPlot';
import FeatureComparisonChart from '../components/charts/FeatureComparisonChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatCurrency } from '../utils/formatters';
import { SEGMENTS, FEATURE_LABELS } from '../utils/constants';

// Business strategies for each customer group
const GROUP_STRATEGIES = {
  0: {
    title: 'Value & Family Staples',
    focus: 'Emphasize family-sized bundles, weekend discount vouchers, and grocery essentials.',
    channels: 'Web store with clear deal filters and in-store coupon mailers.',
  },
  1: {
    title: 'VIP Loyalty & Luxury Pairings',
    focus: 'Promote curated wine collections, gourmet meat pairings, and personalized concierge offers.',
    channels: 'Catalog mailers, private tasting invites, and premium loyalty perks.',
  },
  2: {
    title: 'Essential Discounts & Digital Deals',
    focus: 'Highlight everyday low prices, flash sales on basics, and easy digital checkout.',
    channels: 'Email newsletters, web banners, and targeted discount reminders.',
  },
  3: {
    title: 'Exclusive Launches & Fast Action',
    focus: 'Offer early-bird access to premium catalog items, limited editions, and high-engagement promotions.',
    channels: 'Direct digital campaigns, catalog previews, and responsive mobile promotions.',
  },
};

export default function SegmentExplorer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(''); // '' for all
  const [comparisonMetric, setComparisonMetric] = useState('Income');
  const [pointLimit, setPointLimit] = useState(2236); // All 2,236 points
  const [expandedCoords, setExpandedCoords] = useState({});

  const toggleCoords = (clusterId) => {
    setExpandedCoords((prev) => ({
      ...prev,
      [clusterId]: !prev[clusterId],
    }));
  };

  const fetchClusters = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getClusters(pointLimit < 2236 ? pointLimit : undefined);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pointLimit]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  if (loading) {
    return <LoadingSpinner fullHeight message="Loading customer groups and behavioral map..." />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorAlert
          title="Could not load customer group data"
          message={error}
          onRetry={fetchClusters}
        />
      </div>
    );
  }

  const { clusters, pca_points } = data;

  const comparisonMetricsList = [
    { key: 'Income', label: 'Annual Income ($)' },
    { key: 'Total_Spending', label: 'Total Spending ($)' },
    { key: 'Recency', label: 'Days Since Last Order' },
    { key: 'Age', label: 'Customer Age (Years)' },
    { key: 'Total_Children', label: 'Children in Household' },
    { key: 'NumWebVisitsMonth', label: 'Monthly Web Visits' },
    { key: 'NumDealsPurchases', label: 'Deals Purchases' },
    { key: 'NumStorePurchases', label: 'In-Store Purchases' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Filter className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Filter by Customer Group</h3>
            <p className="text-xs text-slate-500">
              Focus on a specific audience or compare all 4 groups side by side
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCluster('')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              selectedCluster === ''
                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Groups (2,236 Customers)
          </button>

          {clusters.map((c) => {
            const isSelected = selectedCluster === String(c.cluster_id);
            const segMeta = SEGMENTS[c.cluster_id];
            return (
              <button
                key={c.cluster_id}
                type="button"
                onClick={() => setSelectedCluster(String(c.cluster_id))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  isSelected
                    ? `${segMeta.bgLight} ${segMeta.textDark} ${segMeta.border} ring-2 ring-indigo-500/20 font-semibold shadow-xs`
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: segMeta.color }}
                />
                <span>{segMeta.shortName}</span>
                <span className="text-[10px] text-slate-400">({c.percentage}%)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Segment Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {clusters.map((cluster) => {
          const segMeta = SEGMENTS[cluster.cluster_id];
          const isSelected = selectedCluster === String(cluster.cluster_id);
          return (
            <div
              key={cluster.cluster_id}
              onClick={() =>
                setSelectedCluster(
                  isSelected ? '' : String(cluster.cluster_id)
                )
              }
              className={`cursor-pointer rounded-xl border bg-white p-4 shadow-xs transition-all hover:border-slate-300 ${
                isSelected ? `ring-2 ring-indigo-500 ${segMeta.border}` : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <SegmentBadge clusterId={cluster.cluster_id} clusterName={cluster.name} size="xs" />
                <span className="text-xs font-semibold text-slate-400">
                  Group {cluster.cluster_id}
                </span>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900">
                  {cluster.count.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  {cluster.percentage}% of customer base
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Avg Income:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(cluster.feature_means?.Income)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Total Spend:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(cluster.feature_means?.Total_Spending)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Behavioral Map (2D Overview) */}
      <Card
        title="Customer Behavioral Map (2D Overview)"
        subtitle={
          pointLimit < 2236
            ? `Viewing a sample of ${pca_points?.length?.toLocaleString() || pointLimit} customers. Customers with similar spending and family habits appear close together.`
            : 'Visual map grouping all 2,236 customers by purchasing volume and family profile. Customers with similar habits cluster naturally together.'
        }
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sample:</span>
            <select
              value={pointLimit}
              onChange={(e) => setPointLimit(Number(e.target.value))}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value={2236}>All Customers (2,236)</option>
              <option value={1000}>Sample 1,000</option>
              <option value={500}>Sample 500</option>
            </select>
          </div>
        }
      >
        <PCAScatterPlot
          points={pca_points}
          centroids={clusters}
          selectedCluster={selectedCluster}
        />
      </Card>

      {/* Feature Comparison Chart across Segments */}
      <Card
        title="Compare Customer Groups by Attribute"
        subtitle="Compare key characteristics like income, total spending, and shopping channels across all 4 groups"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Metric:</span>
            <select
              value={comparisonMetric}
              onChange={(e) => setComparisonMetric(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500"
            >
              {comparisonMetricsList.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <FeatureComparisonChart
          clusters={clusters}
          metricKey={comparisonMetric}
          metricLabel={
            comparisonMetricsList.find((m) => m.key === comparisonMetric)?.label
          }
        />
      </Card>

      {/* Detailed Customer Group Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clusters
          .filter(
            (c) =>
              selectedCluster === '' || c.cluster_id === Number(selectedCluster)
          )
          .map((cluster) => {
            const seg = SEGMENTS[cluster.cluster_id];
            const strategy = GROUP_STRATEGIES[cluster.cluster_id];
            const showCoords = Boolean(expandedCoords[cluster.cluster_id]);

            return (
              <Card
                key={cluster.cluster_id}
                title={cluster.name}
                subtitle={`Group #${cluster.cluster_id} — ${cluster.count.toLocaleString()} customers (${cluster.percentage}% of audience)`}
                headerClassName={`${seg.bgLight} border-b ${seg.border}`}
              >
                <div className="space-y-4 text-xs">
                  {/* Plain Language Group Description */}
                  <p className="text-slate-600 leading-relaxed">
                    {cluster.description}
                  </p>

                  {/* Business Strategy Callout */}
                  {strategy && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-indigo-950 text-xs">
                        <Target className="h-4 w-4 text-indigo-600" />
                        <span>Recommended Approach: {strategy.title}</span>
                      </div>
                      <p className="text-indigo-900 leading-relaxed text-[11px]">
                        {strategy.focus}
                      </p>
                      <div className="text-[11px] text-indigo-700">
                        <span className="font-semibold">Best Channels:</span> {strategy.channels}
                      </div>
                    </div>
                  )}

                  {/* Distinct Characteristics vs Average Customer */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Key Differences vs Overall Customer Average:
                    </h4>
                    {cluster.significant_diffs?.length > 0 ? (
                      <div className="space-y-1.5">
                        {cluster.significant_diffs.slice(0, 5).map((diff, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                          >
                            <span className="text-slate-700">
                              {FEATURE_LABELS[diff.feature] || diff.feature}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-600">
                                {diff.cluster_average.toLocaleString()} vs {diff.overall_average.toLocaleString()}
                              </span>
                              <span
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  diff.direction === 'Higher'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {diff.direction === 'Higher' ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {diff.difference_pct > 0 ? `+${diff.difference_pct}%` : `${diff.difference_pct}%`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Characteristics track closely with the overall company average.
                      </p>
                    )}
                  </div>

                  {/* Collapsible Technical Coordinates (Layered info for Data Scientists) */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleCoords(cluster.cluster_id)}
                      className="flex items-center justify-between w-full text-[11px] font-medium text-slate-500 hover:text-slate-800 py-1 transition-colors"
                    >
                      <span>Technical Embedding Position (3D PCA Center)</span>
                      {showCoords ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {showCoords && (
                      <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 text-[11px] font-mono grid grid-cols-3 gap-2 text-slate-700">
                        <div>PC1: <span className="font-bold">{cluster.centroid.pc1}</span></div>
                        <div>PC2: <span className="font-bold">{cluster.centroid.pc2}</span></div>
                        <div>PC3: <span className="font-bold">{cluster.centroid.pc3}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
