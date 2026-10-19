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
  Info,
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
    return <LoadingSpinner fullHeight message="Fetching customer overview data..." />;
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
              Unsupervised ML Segmentation
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Customer Intelligence & Behavioral Segments
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              CustomerLens transforms raw transaction history and demographic profiles into 4 verified behavioral segments derived through PCA dimensionality reduction and Agglomerative Clustering (k=4).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <Link
              to="/segments"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-colors"
            >
              <span>Explore Segments</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/predict"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <span>Predict Customer</span>
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Customers"
          value={formatNumber(total_customers)}
          subtitle="4 extreme outliers removed during cleaning"
          icon={Users}
          badge="Cleaned Dataset"
          badgeType="default"
        />
        <MetricCard
          title="Discovered Segments"
          value={total_segments}
          subtitle="Agglomerative (Ward linkage, k=4)"
          icon={Layers}
          badge="Optimal Clusters"
          badgeType="primary"
        />
        <MetricCard
          title="Average Household Income"
          value={formatCurrency(overall_averages?.income)}
          subtitle="Median imputed across 24 missing records"
          icon={DollarSign}
        />
        <MetricCard
          title="Average Total Spending"
          value={formatCurrency(overall_averages?.total_spending)}
          subtitle="Across 6 product categories (wines, meat, etc.)"
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
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Average Recency</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {overall_averages?.recency?.toFixed(1)} <span className="text-xs font-normal text-slate-500">days since purchase</span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Children / Household</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {overall_averages?.total_children?.toFixed(2)} <span className="text-xs font-normal text-slate-500">kids + teens</span>
            </p>
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
            title="Cluster Distribution"
            subtitle="Customer count and proportion across the 4 Agglomerative clusters"
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
            title="Segment Profiles Summary"
            subtitle="Identified behavioral segments and customer volumes"
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
        title="Key Analytical Findings"
        subtitle="Empirical conclusions derived from PCA coordinates and feature distributions"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Plurality in Budget Households (Cluster 0)</span>
            </div>
            <p>
              Cluster 0 represents 40.47% (905 customers) of the platform. They are characterized by moderate incomes, partner households, and strong price sensitivity with consistent deal shopping.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              <span>High-LTV Spend Concentrated in Cluster 1</span>
            </div>
            <p>
              Cluster 1 (23.88%, 534 customers) displays the highest average spending, driven by high wine and meat purchases, coupled with low deal seeking and predominantly adult households.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Solo Parents Face Budget Constraints (Cluster 2)</span>
            </div>
            <p>
              Cluster 2 (19.86%, 444 customers) consists of single parents with smaller incomes. They make heavy use of web visits and promotions, spending less on premium luxury catalog categories.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Highest Campaign Responsiveness in Cluster 3</span>
            </div>
            <p>
              Cluster 3 (15.79%, 353 customers) is the most receptive cohort to marketing campaigns, with high engagement rates and solid discretionary purchasing power among solo individuals.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            Pipeline Note: 22 raw attributes were transformed into 18 standardized features, reduced to 3 PCA dimensions (capturing 44.95% cumulative variance) prior to Agglomerative Clustering.
          </span>
        </div>
      </Card>
    </div>
  );
}
