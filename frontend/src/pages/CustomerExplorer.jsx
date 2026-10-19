import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  User,
} from 'lucide-react';
import { api } from '../api/endpoints';
import Card from '../components/common/Card';
import SegmentBadge from '../components/common/SegmentBadge';
import LoadingSpinner, { SkeletonRow } from '../components/common/LoadingSpinner';
import ErrorAlert, { EmptyState } from '../components/common/ErrorAlert';
import { formatCurrency } from '../utils/formatters';
import { SEGMENTS, FEATURE_LABELS } from '../utils/constants';

export default function CustomerExplorer() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [sortBy, setSortBy] = useState('customer_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected customer for detail drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch paginated customers
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCustomers({
        page,
        limit,
        clusterId: clusterFilter !== '' ? Number(clusterFilter) : null,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, clusterFilter, debouncedSearch, sortBy, sortOrder]);

  // Fetch customer detail when selected
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDetail(null);
      return;
    }

    let isMounted = true;
    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const detail = await api.getCustomer(selectedCustomerId);
        if (isMounted) setCustomerDetail(detail);
      } catch (err) {
        if (isMounted) setDetailError(err.message);
      } finally {
        if (isMounted) setDetailLoading(false);
      }
    }

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedCustomerId]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer ID (e.g., 5524)..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter & Page Size Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Segment:</span>
            <select
              value={clusterFilter}
              onChange={(e) => {
                setClusterFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">All Segments</option>
              {Object.values(SEGMENTS).map((seg) => (
                <option key={seg.id} value={seg.id}>
                  Cluster {seg.id}: {seg.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Rows Per Page */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Rows:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card
        title={`Customer Records (${total.toLocaleString()} total)`}
        subtitle={`Page ${page} of ${totalPages} — Sorted by ${sortBy} (${sortOrder})`}
      >
        {error ? (
          <ErrorAlert title="Failed to retrieve customers" message={error} onRetry={fetchCustomers} />
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th
                    className="px-5 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort('customer_id')}
                  >
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort('cluster_id')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Segment</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort('age')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Age</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort('income')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Income</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort('total_spending')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Spending</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort('recency')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Recency</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Education</th>
                  <th className="px-4 py-3">Household</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} columns={9} />)
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        title="No matching customers"
                        description="Try modifying your search query or reset the segment filter."
                      />
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.customer_id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedCustomerId(c.customer_id)}
                    >
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                        #{c.customer_id}
                      </td>
                      <td className="px-4 py-3.5">
                        <SegmentBadge
                          clusterId={c.cluster_id}
                          clusterName={c.cluster_name}
                          size="xs"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{c.age} yrs</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {formatCurrency(c.income)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {formatCurrency(c.total_spending)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {c.recency}d ago
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{c.education}</td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {c.living_with} ({c.total_children} kids)
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomerId(c.customer_id);
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 mt-2 border-t border-slate-100 text-xs text-slate-600">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {total > 0 ? (page - 1) * limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(page * limit, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{total.toLocaleString()}</span> customers
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2 font-medium text-slate-700">
              Page {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Customer Detail Drawer / Side Panel */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end">
          <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Customer #{selectedCustomerId}
                  </h3>
                  <p className="text-xs text-slate-500">Comprehensive Customer Intelligence Card</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {detailLoading ? (
                <LoadingSpinner message="Fetching customer details..." fullHeight />
              ) : detailError ? (
                <ErrorAlert title="Failed to load customer details" message={detailError} />
              ) : customerDetail ? (
                <>
                  {/* Segment Assignment Banner */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Assigned Cluster
                      </span>
                      <SegmentBadge
                        clusterId={customerDetail.cluster_id}
                        clusterName={customerDetail.cluster_name}
                        size="md"
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200/80">
                      <div>
                        <span className="text-slate-500">PCA Coordinate 1:</span>
                        <span className="ml-1 font-mono font-semibold text-slate-900">
                          {customerDetail.pc1}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">PCA Coordinate 2:</span>
                        <span className="ml-1 font-mono font-semibold text-slate-900">
                          {customerDetail.pc2}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Demographics & Household */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Demographics & Household
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-slate-500 block">Age / Year Birth</span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {customerDetail.age} yrs ({customerDetail.year_birth})
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-slate-500 block">Education</span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {customerDetail.education}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-slate-500 block">Marital Status / Living</span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {customerDetail.marital_status} ({customerDetail.living_with})
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-slate-500 block">Total Children</span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {customerDetail.total_children} (Kids + Teens)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financials & Engagement */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Financials & Activity
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-slate-500 block">Annual Income</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(customerDetail.income)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-slate-500 block">Total Spending</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(customerDetail.total_spending)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-slate-500 block">Tenure (Days)</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {customerDetail.customer_tenure_days}d
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category Spending Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Category Spend Breakdown
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg border border-slate-100 p-2.5 bg-white">
                        <span className="text-slate-400 block text-[10px]">Wines</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(customerDetail.mnt_wines)}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-100 p-2.5 bg-white">
                        <span className="text-slate-400 block text-[10px]">Meat</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(customerDetail.mnt_meat_products)}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-100 p-2.5 bg-white">
                        <span className="text-slate-400 block text-[10px]">Fish</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(customerDetail.mnt_fish_products)}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-100 p-2.5 bg-white">
                        <span className="text-slate-400 block text-[10px]">Fruits</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(customerDetail.mnt_fruits)}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-100 p-2.5 bg-white">
                        <span className="text-slate-400 block text-[10px]">Sweets</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(customerDetail.mnt_sweet_products)}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-100 p-2.5 bg-white">
                        <span className="text-slate-400 block text-[10px]">Gold Products</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(customerDetail.mnt_gold_prods)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cluster Benchmark Comparison (18 Features) */}
                  {customerDetail.cluster_benchmark && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Cluster Benchmark (Customer vs Cluster #{customerDetail.cluster_id} Mean)
                      </h4>
                      <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
                            <tr>
                              <th className="px-3 py-2">Feature</th>
                              <th className="px-3 py-2">Customer Value</th>
                              <th className="px-3 py-2">Cluster Mean</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Object.entries(customerDetail.cluster_benchmark).map(
                              ([feature, clusterAvg]) => {
                                // Match customer's raw value
                                const rawVal = customerDetail[feature.toLowerCase()] ?? customerDetail[feature];
                                return (
                                  <tr key={feature} className="hover:bg-slate-50/50">
                                    <td className="px-3 py-2 font-medium text-slate-700">
                                      {FEATURE_LABELS[feature] || feature}
                                    </td>
                                    <td className="px-3 py-2 font-semibold text-slate-900 font-mono">
                                      {rawVal !== undefined
                                        ? typeof rawVal === 'number'
                                          ? rawVal.toLocaleString()
                                          : String(rawVal)
                                        : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-slate-500 font-mono">
                                      {typeof clusterAvg === 'number'
                                        ? clusterAvg.toFixed(2)
                                        : clusterAvg}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
