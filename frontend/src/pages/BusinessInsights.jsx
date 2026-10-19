import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/endpoints';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatCurrency } from '../utils/formatters';
import { SEGMENTS } from '../utils/constants';

export default function BusinessInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getClusters();
      setData(res.clusters || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return <LoadingSpinner fullHeight message="Loading empirical cluster profiles and strategic hypotheses..." />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorAlert
          title="Could not load business insights"
          message={error}
          onRetry={fetchInsights}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strategic Notice Banner */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5 text-indigo-950 shadow-xs">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-indigo-900 text-sm">
              Empirical Observations vs. Strategic Hypotheses
            </h4>
            <p className="text-xs text-indigo-800 leading-relaxed">
              All quantitative metrics below are drawn directly from the verified 2,236 customer dataset. The marketing and retention recommendations represent <span className="font-semibold">testable business hypotheses</span> grounded in observed behavioral traits, not proven historical campaign outcomes. No fabricated conversion uplifts or ROI figures are claimed.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Segment Strategy Cards */}
      <div className="space-y-6">
        {data.map((cluster) => {
          const seg = SEGMENTS[cluster.cluster_id];
          const means = cluster.feature_means || {};

          return (
            <Card
              key={cluster.cluster_id}
              title={cluster.name}
              subtitle={`Cluster #${cluster.cluster_id} — ${cluster.count.toLocaleString()} customers (${cluster.percentage}% share)`}
              headerClassName={`${seg.bgLight} border-b ${seg.border}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* Left: Empirical Observed Data (5 cols) */}
                <div className="lg:col-span-5 space-y-4 pr-0 lg:pr-4 lg:border-r border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span>Observed Baseline Data</span>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    {cluster.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Avg Annual Income</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(means.Income)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Avg Total Spending</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(means.Total_Spending)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Wine Expenditure</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(means.MntWines)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Deals Purchases</span>
                      <span className="font-bold text-slate-900">
                        {means.NumDealsPurchases?.toFixed(1) || '—'} purchases
                      </span>
                    </div>
                  </div>

                  {/* Significant Feature Differentials */}
                  {cluster.significant_diffs?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">
                        Key Statistical Deviations vs Dataset Mean:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.significant_diffs.slice(0, 4).map((d, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                              d.direction === 'Higher'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span>{d.feature}</span>
                            <span className="font-bold">
                              {d.difference_pct > 0 ? `+${d.difference_pct}%` : `${d.difference_pct}%`}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actionable Marketing & Retention Hypotheses (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                    <Target className="h-4 w-4 text-indigo-600" />
                    <span>Marketing & Engagement Hypotheses</span>
                  </div>

                  <div className="space-y-3">
                    {cluster.recommendations && cluster.recommendations.length > 0 ? (
                      cluster.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 hover:bg-slate-50 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-900 block text-xs">
                              Strategy {i + 1}
                            </span>
                            <p className="text-slate-600 leading-relaxed text-xs">
                              {rec}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">No recommendations available.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
