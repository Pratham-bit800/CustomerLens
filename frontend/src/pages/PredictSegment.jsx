import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../api/endpoints';
import Card from '../components/common/Card';
import SegmentBadge from '../components/common/SegmentBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatDelta } from '../utils/formatters';
import { PRESET_PROFILES } from '../utils/constants';

const INITIAL_FORM = {
  year_birth: 1975,
  education: 'Graduation',
  marital_status: 'Married',
  income: 52000,
  kidhome: 1,
  teenhome: 0,
  dt_customer: '2013-05-15',
  recency: 45,
  mnt_wines: 250,
  mnt_fruits: 20,
  mnt_meat_products: 120,
  mnt_fish_products: 25,
  mnt_sweet_products: 15,
  mnt_gold_prods: 25,
  num_deals_purchases: 2,
  num_web_purchases: 4,
  num_catalog_purchases: 2,
  num_store_purchases: 5,
  num_web_visits_month: 5,
  complain: 0,
  response: 0,
};

export default function PredictSegment() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyPreset = (preset) => {
    setForm({ ...preset.data });
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Cast numeric fields properly
    const payload = {
      year_birth: Number(form.year_birth),
      education: String(form.education),
      marital_status: String(form.marital_status),
      income: Number(form.income),
      kidhome: Number(form.kidhome),
      teenhome: Number(form.teenhome),
      dt_customer: String(form.dt_customer),
      recency: Number(form.recency),
      mnt_wines: Number(form.mnt_wines),
      mnt_fruits: Number(form.mnt_fruits),
      mnt_meat_products: Number(form.mnt_meat_products),
      mnt_fish_products: Number(form.mnt_fish_products),
      mnt_sweet_products: Number(form.mnt_sweet_products),
      mnt_gold_prods: Number(form.mnt_gold_prods),
      num_deals_purchases: Number(form.num_deals_purchases),
      num_web_purchases: Number(form.num_web_purchases),
      num_catalog_purchases: Number(form.num_catalog_purchases),
      num_store_purchases: Number(form.num_store_purchases),
      num_web_visits_month: Number(form.num_web_visits_month),
      complain: Number(form.complain),
      response: Number(form.response),
    };

    try {
      const res = await api.predictSegment(payload);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Historical Data Limitation Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-950">
              Important Historical Model & Data Constraints
            </h4>
            <p className="text-amber-800 leading-relaxed">
              This pipeline uses fixed training anchors: <span className="font-mono font-semibold">Age = 2026 - Year_Birth</span> and customer tenure calculated relative to <span className="font-mono font-semibold">2014-06-29</span> (latest enrolment in training dataset).
              Enrolment dates after <span className="font-semibold">2014-06-29</span> produce negative tenure values and are strictly rejected by the backend validation schema. Income must be &lt; $600,000 (training outlier bound).
            </p>
          </div>
        </div>
      </div>

      {/* Preset Profiles Selector */}
      <Card
        title="Quick Test Presets"
        subtitle="Load pre-configured customer archetypes to test the model in 1 click"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_PROFILES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                  {preset.name}
                </span>
                <Sparkles className="h-3 w-3 text-slate-400 group-hover:text-indigo-500" />
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Main Grid: Form (Left) & Prediction Result (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <Card
            title="Customer Profile Input"
            subtitle="Enter demographic, financial, and transactional attributes"
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm(INITIAL_FORM)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="submit"
                  form="predict-form"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{loading ? 'Classifying...' : 'Classify Customer'}</span>
                </button>
              </div>
            }
          >
            <form id="predict-form" onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Demographics Group */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-2.5">
                  1. Demographics & Household
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Birth Year (1940–2008)
                    </label>
                    <input
                      type="number"
                      min={1940}
                      max={2008}
                      required
                      value={form.year_birth}
                      onChange={(e) => handleChange('year_birth', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Education
                    </label>
                    <select
                      value={form.education}
                      onChange={(e) => handleChange('education', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                    >
                      <option value="Graduation">Graduation</option>
                      <option value="PhD">PhD</option>
                      <option value="Master">Master</option>
                      <option value="2n Cycle">2n Cycle</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Marital Status
                    </label>
                    <select
                      value={form.marital_status}
                      onChange={(e) => handleChange('marital_status', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                    >
                      <option value="Married">Married</option>
                      <option value="Together">Together</option>
                      <option value="Single">Single</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widow">Widow</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Annual Income ($)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={599999}
                      step={100}
                      required
                      value={form.income}
                      onChange={(e) => handleChange('income', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Kids at Home (0–3)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      required
                      value={form.kidhome}
                      onChange={(e) => handleChange('kidhome', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Teens at Home (0–3)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      required
                      value={form.teenhome}
                      onChange={(e) => handleChange('teenhome', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Enrolment Date & Recency */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-2.5">
                  2. Enrolment & Engagement Activity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Enrolment Date (≤ 2014-06-29)
                    </label>
                    <input
                      type="date"
                      max="2014-06-29"
                      required
                      value={form.dt_customer}
                      onChange={(e) => handleChange('dt_customer', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Recency (Days since last purchase: 0–99)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      required
                      value={form.recency}
                      onChange={(e) => handleChange('recency', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Product Category Expenditures */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-2.5">
                  3. Category Spending ($)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Wines (0–1500)</label>
                    <input
                      type="number"
                      min={0}
                      max={1500}
                      value={form.mnt_wines}
                      onChange={(e) => handleChange('mnt_wines', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Meat (0–1725)</label>
                    <input
                      type="number"
                      min={0}
                      max={1725}
                      value={form.mnt_meat_products}
                      onChange={(e) => handleChange('mnt_meat_products', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Fish (0–259)</label>
                    <input
                      type="number"
                      min={0}
                      max={259}
                      value={form.mnt_fish_products}
                      onChange={(e) => handleChange('mnt_fish_products', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Fruits (0–200)</label>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={form.mnt_fruits}
                      onChange={(e) => handleChange('mnt_fruits', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Sweets (0–263)</label>
                    <input
                      type="number"
                      min={0}
                      max={263}
                      value={form.mnt_sweet_products}
                      onChange={(e) => handleChange('mnt_sweet_products', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Gold (0–362)</label>
                    <input
                      type="number"
                      min={0}
                      max={362}
                      value={form.mnt_gold_prods}
                      onChange={(e) => handleChange('mnt_gold_prods', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Purchasing Channels & Campaigns */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-2.5">
                  4. Purchasing Channels & Marketing Campaigns
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Deals (0–15)</label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={form.num_deals_purchases}
                      onChange={(e) => handleChange('num_deals_purchases', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Web Purchases (0–27)</label>
                    <input
                      type="number"
                      min={0}
                      max={27}
                      value={form.num_web_purchases}
                      onChange={(e) => handleChange('num_web_purchases', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Catalog (0–28)</label>
                    <input
                      type="number"
                      min={0}
                      max={28}
                      value={form.num_catalog_purchases}
                      onChange={(e) => handleChange('num_catalog_purchases', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Store (0–13)</label>
                    <input
                      type="number"
                      min={0}
                      max={13}
                      value={form.num_store_purchases}
                      onChange={(e) => handleChange('num_store_purchases', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Web Visits / Mo (0–20)</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={form.num_web_visits_month}
                      onChange={(e) => handleChange('num_web_visits_month', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Response (0 or 1)</label>
                    <select
                      value={form.response}
                      onChange={(e) => handleChange('response', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white font-mono"
                    >
                      <option value={0}>0 (No campaign accepted)</option>
                      <option value={1}>1 (Accepted campaign)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" message="" />
                      <span>Computing 3D PCA projection & assigning centroid...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Classify Customer Segment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Prediction Results Column */}
        <div className="lg:col-span-5 space-y-6">
          {error && (
            <ErrorAlert
              title="Validation or Prediction Error"
              message={error}
            />
          )}

          {result ? (
            <Card
              title="Prediction Output"
              subtitle="Assigned via NearestCentroid surrogate in 3D PCA space"
              className="border-indigo-200 shadow-md ring-1 ring-indigo-500/10"
            >
              <div className="space-y-5 text-xs">
                {/* Result Hero Banner */}
                <div className="rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 mb-1">
                    Predicted Segment Assignment
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xl font-bold">
                      {result.cluster_name}
                    </span>
                    <SegmentBadge
                      clusterId={result.assigned_cluster}
                      clusterName={result.cluster_name}
                      size="sm"
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                    {result.cluster_description}
                  </p>
                </div>

                {/* Distance to Centroid & Disclaimer */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">Distance to Centroid:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {result.distance_to_centroid}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">PCA Coordinates:</span>
                    <span className="font-mono text-slate-700">
                      ({result.pca_coordinates.pc1}, {result.pca_coordinates.pc2}, {result.pca_coordinates.pc3})
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                    <span className="font-semibold text-slate-700">Methodological Note: </span>
                    Centroid distance is an absolute Euclidean metric in 3D PCA space, not a calibrated probability or confidence percentage.
                  </div>
                </div>

                {/* Assignment Caveat */}
                {result.assignment_caveat && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] leading-relaxed">
                        {result.assignment_caveat}
                      </p>
                    </div>
                  </div>
                )}

                {/* Benchmark Deviations (>15%) */}
                {result.benchmark_comparison?.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] mb-2">
                      Feature Comparison vs Cluster Mean
                    </h4>
                    <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                      {result.benchmark_comparison.map((b, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 text-[11px]">
                          <span className="font-medium text-slate-700">{b.feature}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-900">
                              {b.customer_value} vs {b.cluster_average}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                b.direction === 'Higher'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {formatDelta(b.difference_pct)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] mb-2">
                      Suggested Segment Actions
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card
              title="Awaiting Classification"
              subtitle="Submit the customer profile form on the left to generate inference"
            >
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Sparkles className="h-10 w-10 text-slate-300 mb-3" />
                <h4 className="text-sm font-semibold text-slate-700">Ready for Inference</h4>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Fill in the 21 customer attributes or choose one of the preset archetypes above to see real-time segment assignment.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
