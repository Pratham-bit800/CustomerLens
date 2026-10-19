import React, { useState, useEffect } from 'react';
import {
  Filter,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { api } from '../api/endpoints';
import Card from '../components/common/Card';
import SegmentBadge from '../components/common/SegmentBadge';
import PCAScatterPlot from '../components/charts/PCAScatterPlot';
import FeatureComparisonChart from '../components/charts/FeatureComparisonChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatCurrency } from '../utils/formatters';
import { SEGMENTS } from '../utils/constants';

export default function SegmentExplorer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(''); // '' for all
  const [comparisonMetric, setComparisonMetric] = useState('Income');
  const [pointLimit, setPointLimit] = useState(2236); // All 2,236 points

  const fetchClusters = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend supports sample_pca_points or returns all
      const res = await api.getClusters(pointLimit < 2236 ? pointLimit : undefined);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [pointLimit]);

  if (loading) {
    return <LoadingSpinner fullHeight message="Loading cluster profiles and PCA projections..." />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorAlert
          title="Could not load segment data"
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
    { key: 'Recency', label: 'Recency (Days)' },
    { key: 'Age', label: 'Age (Years)' },
    { key: 'Total_Children', label: 'Children in Household' },
    { key: 'NumWebVisitsMonth', label: 'Web Visits / Month' },
    { key: 'NumDealsPurchases', label: 'Deals Purchases' },
    { key: 'NumStorePurchases', label: 'Store Purchases' },
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
            <h3 className="text-sm font-semibold text-slate-900">Cluster Selection</h3>
            <p className="text-xs text-slate-500">
              Filter scatter coordinates and feature diffs by cluster
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
            All Clusters (2,236)
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
                <span className="text-xs font-mono font-semibold text-slate-500">
                  #{cluster.cluster_id}
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
                  <span>Avg Spending:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(cluster.feature_means?.Total_Spending)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PCA Scatter Plot Section */}
      <Card
        title="PCA Projection (PC1 vs PC2)"
        subtitle="Customer transaction and demographic embeddings projected into 2D principal component space"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Points:</span>
            <select
              value={pointLimit}
              onChange={(e) => setPointLimit(Number(e.target.value))}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value={2236}>All Points (2,236)</option>
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
        title="Segment Feature Comparisons"
        subtitle="Compare empirical cohort averages across all 4 customer segments"
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

      {/* Detailed Cluster Profiles & Significant Feature Diffs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clusters
          .filter(
            (c) =>
              selectedCluster === '' || c.cluster_id === Number(selectedCluster)
          )
          .map((cluster) => {
            const seg = SEGMENTS[cluster.cluster_id];
            return (
              <Card
                key={cluster.cluster_id}
                title={cluster.name}
                subtitle={`Cluster #${cluster.cluster_id} — ${cluster.count.toLocaleString()} customers (${cluster.percentage}%)`}
                headerClassName={`${seg.bgLight} border-b ${seg.border}`}
              >
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cluster.description}
                  </p>

                  {/* Centroid coordinates */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs font-mono">
                    <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider mb-1 font-sans">
                      Cluster Centroid (PCA Space)
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-slate-800">
                      <div>PC1: <span className="font-bold">{cluster.centroid.pc1}</span></div>
                      <div>PC2: <span className="font-bold">{cluster.centroid.pc2}</span></div>
                      <div>PC3: <span className="font-bold">{cluster.centroid.pc3}</span></div>
                    </div>
                  </div>

                  {/* Statistically Significant Diffs (>15% from overall) */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Significant Feature Deviations (&gt;15% vs Population Mean)
                    </h4>
                    {cluster.significant_diffs?.length > 0 ? (
                      <div className="space-y-1.5">
                        {cluster.significant_diffs.slice(0, 5).map((diff, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                          >
                            <span className="text-slate-700">{diff.feature}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-600">
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
                        No features exceed 15% threshold difference.
                      </p>
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
