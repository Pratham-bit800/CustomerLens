import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Target,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Users,
  Tag,
} from 'lucide-react';
import { api } from '../api/endpoints';
import Card from '../components/common/Card';
import SegmentBadge from '../components/common/SegmentBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatCurrency } from '../utils/formatters';
import { SEGMENTS, FEATURE_LABELS } from '../utils/constants';

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
    return <LoadingSpinner fullHeight message="Loading business insights and customer group strategies..." />;
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
      {/* Executive Quick Answer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Spenders</span>
            <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">Affluent Spenders</div>
          <p className="text-xs text-slate-600 mt-1">
            Over <span className="font-semibold text-slate-900">$1,280+</span> average spend. Dominated by premium wine and gourmet meats.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Most Receptive</span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">Affluent Solo Group</div>
          <p className="text-xs text-slate-600 mt-1">
            <span className="font-semibold text-slate-900">29.2%</span> campaign acceptance rate. Quickest adopters of direct promotional offers.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Largest Audience</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">Budget Households</div>
          <p className="text-xs text-slate-600 mt-1">
            <span className="font-semibold text-slate-900">40.5%</span> of customer base (905 accounts). Key for volume sales and essential staples.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Best Deal Target</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Tag className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">Solo Parents & Budget</div>
          <p className="text-xs text-slate-600 mt-1">
            High price sensitivity. Respond best to discounts, coupons, and multi-buy grocery savings.
          </p>
        </div>
      </div>

      {/* Strategic Notice Banner */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-5 text-indigo-950 shadow-xs">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-indigo-900 text-sm">
              Data-Backed Marketing Guidance
            </h4>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Every figure below is calculated directly from our verified 2,236 customer profiles. The marketing recommendations represent practical, data-supported action plans tailored to each group's real-world shopping habits. (Hypotheses are presented as strategic recommendations; no unverified conversion guarantees or ROI figures are claimed).
            </p>
          </div>
        </div>
      </div>

      {/* 4 Customer Group Strategy Cards */}
      <div className="space-y-6">
        {data.map((cluster) => {
          const seg = SEGMENTS[cluster.cluster_id];
          const means = cluster.feature_means || {};

          return (
            <Card
              key={cluster.cluster_id}
              title={cluster.name}
              subtitle={`Customer Group #${cluster.cluster_id} — ${cluster.count.toLocaleString()} customers (${cluster.percentage}% of customer base)`}
              headerClassName={`${seg.bgLight} border-b ${seg.border}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* Left: Customer Group Profile & Spending Habits (5 cols) */}
                <div className="lg:col-span-5 space-y-4 pr-0 lg:pr-4 lg:border-r border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Observed Group Profile
                    </span>
                    <SegmentBadge
                      clusterId={cluster.cluster_id}
                      clusterName={cluster.name}
                      size="xs"
                    />
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
                      <span className="text-[11px] text-slate-500 block">Wine Spending</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(means.MntWines)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Deals Purchased</span>
                      <span className="font-bold text-slate-900">
                        {means.NumDealsPurchases?.toFixed(1) || '—'} purchases
                      </span>
                    </div>
                  </div>

                  {/* Significant Feature Differentials */}
                  {cluster.significant_diffs?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">
                        Key Differences vs Company Average:
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
                            <span>{FEATURE_LABELS[d.feature] || d.feature}</span>
                            <span className="font-bold">
                              {d.difference_pct > 0 ? `+${d.difference_pct}%` : `${d.difference_pct}%`}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actionable Marketing & Campaign Strategies (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                    <Target className="h-4 w-4 text-indigo-600" />
                    <span>Recommended Marketing Action Plan</span>
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
                              Action {i + 1}
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
