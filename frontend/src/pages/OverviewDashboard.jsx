import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Layers,
  DollarSign,
  ShoppingCart,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Database,
} from 'lucide-react';
import { api } from '../api/endpoints';
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import SegmentBadge from '../components/common/SegmentBadge';
import SegmentDistributionChart from '../components/charts/SegmentDistributionChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function OverviewDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'pie'
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOverview();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return <LoadingSpinner fullHeight message="Loading customer overview metrics..." />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorAlert
          title="Could not load overview metrics"
          message={error}
          onRetry={fetchOverview}
        />
      </div>
    );
  }

  const {
    total_customers,
    total_segments,
    cluster_distribution,
    overall_averages,
  } = data;

  return (
    <div className="space-y-6">
      {/* Platform Welcome & Summary Banner */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              Customer Intelligence Platform
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Understand Customer Behavior & Buying Habits
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              CustomerLens organizes 2,236 customer profiles into 4 distinct buying groups based on purchasing habits, income, and household needs — helping you tailor marketing strategies and identify growth opportunities.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <Link
              to="/segments"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-colors"
            >
              <span>Explore Customer Groups</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/predict"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <span>Find a Customer's Group</span>
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Customers Analyzed"
          value={formatNumber(total_customers)}
          subtitle="Active customer accounts"
          icon={Users}
          badge="Customer Base"
          badgeType="default"
        />
        <MetricCard
          title="Customer Groups"
          value={total_segments}
          subtitle="Distinct buying behaviors identified"
          icon={Layers}
          badge="Core Groups"
          badgeType="primary"
        />
        <MetricCard
          title="Average Household Income"
          value={formatCurrency(overall_averages?.income)}
          subtitle="Across all customer households"
          icon={DollarSign}
        />
        <MetricCard
          title="Average Total Spending"
          value={formatCurrency(overall_averages?.total_spending)}
          subtitle="Lifetime spend across all products"
          icon={ShoppingCart}
        />
      </div>

      {/* Secondary Cohort Averages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Average Customer Age</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {overall_averages?.age?.toFixed(1)} <span className="text-xs font-normal text-slate-500">years</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Typical age range: 45–65</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Purchase Recency</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {overall_averages?.recency?.toFixed(1)} <span className="text-xs font-normal text-slate-500">days</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Average time since last order</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Children in Household</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {overall_averages?.total_children?.toFixed(2)} <span className="text-xs font-normal text-slate-500">per home</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Kids and teenagers combined</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Segment Distribution Chart */}
        <div className="lg:col-span-7">
          <Card
            title="Customer Distribution by Group"
            subtitle="Customer volume and proportion across the 4 key customer segments"
            actions={
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartType === 'bar'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Bar Chart
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('pie')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartType === 'pie'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Donut
                </button>
              </div>
            }
          >
            <SegmentDistributionChart
              data={cluster_distribution}
              type={chartType}
            />
          </Card>
        </div>

        {/* Right: Segment Quick Profiles List */}
        <div className="lg:col-span-5">
          <Card
            title="Customer Group Summaries"
            subtitle="Overview of each customer group's profile and size"
          >
            <div className="space-y-3">
              {cluster_distribution.map((cluster) => {
                return (
                  <div
                    key={cluster.cluster_id}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <SegmentBadge
                        clusterId={cluster.cluster_id}
                        clusterName={cluster.name}
                        size="sm"
                      />
                      <span className="text-xs font-semibold text-slate-900">
                        {cluster.count.toLocaleString()} customers ({cluster.percentage}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {cluster.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Key Analytical Findings Section */}
      <Card
        title="Executive Takeaways & Marketing Opportunities"
        subtitle="Practical conclusions drawn from customer spending and demographic data"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Largest Audience: Budget Family Households (40.5%)</span>
            </div>
            <p>
              905 customers represent the volume backbone of the customer base. They have children at home and prioritize budget-friendly staples, value bundles, and seasonal discounts.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              <span>Top Revenue Drivers: Affluent Partner Shoppers (23.9%)</span>
            </div>
            <p>
              534 high-income customers drive the highest revenue per account ($1,281 avg. spend), purchasing heavily in premium wine and gourmet meats. Best candidates for VIP loyalty programs and premium pairings.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Price-Sensitive: Budget Solo Parents (19.9%)</span>
            </div>
            <p>
              444 single-parent households managing careful family budgets ($129 avg. spend). Frequent web visitors who look for clear promotions, digital coupons, and everyday essentials.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Most Receptive: Affluent Independent Spenders (15.8%)</span>
            </div>
            <p>
              353 single professionals with high purchasing power ($1,299 avg. spend). They exhibit the highest campaign response rate (29.2%) and respond enthusiastically to new product launches.
            </p>
          </div>
        </div>

        {/* Collapsible Layer for Technical Background */}
        <div className="mt-5 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-600" />
              <span>Data Methodology & Technical Specifications (For Technical Reviewers)</span>
            </div>
            {showTechnicalDetails ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <span className="font-semibold text-slate-800">Dataset & Transformation:</span> 22 original transaction and demographic variables were preprocessed into 18 standardized features (StandardScaler) with median imputation for missing income values.
              </p>
              <p>
                <span className="font-semibold text-slate-800">Clustering Methodology:</span> Customers were partitioned using Ward-linkage Agglomerative Clustering (k=4), which achieved a silhouette score of 0.3793, outperforming K-Means (0.3581).
              </p>
              <p>
                <span className="font-semibold text-slate-800">Dimensionality Reduction:</span> PCA projects the 18 standardized features into 3 orthogonal principal components explaining 44.95% cumulative variance.
              </p>
              <p>
                <span className="font-semibold text-slate-800">Operational Matching:</span> A NearestCentroid classifier in 3D PCA space acts as an operational surrogate for real-time customer matching (96.29% in-sample agreement, ARI = 0.8947).
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
