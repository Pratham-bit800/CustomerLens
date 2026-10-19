import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../api/endpoints';
import Card from '../components/common/Card';
import SegmentBadge from '../components/common/SegmentBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatDelta } from '../utils/formatters';
import { PRESET_PROFILES } from '../utils/constants';

const INITIAL_FORM = {
  year_birth: 1985,
  education: 'Graduation',
  marital_status: 'Married',
  income: 52000,
  kidhome: 1,
  teenhome: 0,
  dt_customer: '2025-05-15',
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

const CURRENT_DATE_STRING = new Date().toISOString().split('T')[0];
const MAX_BIRTH_YEAR = new Date().getFullYear() - 18;

export default function PredictSegment() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showTechnicalNotice, setShowTechnicalNotice] = useState(false);
  const [showTechnicalResult, setShowTechnicalResult] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyPreset = (preset) => {
    setForm(preset.data);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      year_birth: Number(form.year_birth),
      education: form.education,
      marital_status: form.marital_status,
      income: Number(form.income),
      kidhome: Number(form.kidhome),
      teenhome: Number(form.teenhome),
      dt_customer: form.dt_customer,
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
      {/* Business-Friendly Welcome Banner */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 text-indigo-950 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-semibold text-indigo-950 text-sm">
                Customer Group Finder
              </h4>
              <p className="text-xs text-indigo-900 leading-relaxed">
                Enter a customer’s demographic and purchasing information to find which existing customer group they most resemble. This helps you select relevant marketing campaigns, discount offers, and product recommendations tailored to their lifestyle.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTechnicalNotice(!showTechnicalNotice)}
            className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 shrink-0 inline-flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-lg border border-indigo-200/80 transition-colors"
          >
            <span>{showTechnicalNotice ? 'Hide Technical Note' : 'Methodology Note'}</span>
            {showTechnicalNotice ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {showTechnicalNotice && (
          <div className="mt-3 pt-3 border-t border-indigo-200/60 text-xs text-indigo-900 leading-relaxed space-y-1">
            <p>
              <span className="font-semibold">Assignment Architecture:</span> Inputs are standardized with our pre-trained scaler, projected into 3D PCA space, and matched against cluster centroids using a NearestCentroid surrogate (achieving 96.29% agreement with the reference Agglomerative clustering).
            </p>
            <p>
              <span className="font-semibold">Extrapolation Handling:</span> Both modern and historical dates are supported. Incomes &gt; $162,397 or tenures &gt; 699 days represent low-density extrapolation regions and are transparently flagged with non-fatal warnings.
            </p>
          </div>
        )}
      </div>

      {/* Preset Profiles Selector */}
      <Card
        title="Test with Example Customer Profiles"
        subtitle="Click any archetype below to populate the form with realistic customer figures in 1 click"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_PROFILES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                  {preset.name}
                </span>
                <Sparkles className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500" />
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
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
            title="Customer Profile Details"
            subtitle="Enter household, financial, and shopping habits to estimate the customer group"
            actions={
              <button
                type="button"
                onClick={() => setForm(INITIAL_FORM)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Form</span>
              </button>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Demographics & Household */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-2.5">
                  1. Household & Demographics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Birth Year (Age ≥ 18)
                    </label>
                    <input
                      type="number"
                      min={1925}
                      max={MAX_BIRTH_YEAR}
                      required
                      value={form.year_birth}
                      onChange={(e) => handleChange('year_birth', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Education Level
                    </label>
                    <select
                      value={form.education}
                      onChange={(e) => handleChange('education', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                    >
                      <option value="Graduation">Graduation (Bachelor's)</option>
                      <option value="PhD">PhD</option>
                      <option value="Master">Master's</option>
                      <option value="2n Cycle">2nd Cycle (Advanced)</option>
                      <option value="Basic">Basic (High School)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Relationship Status
                    </label>
                    <select
                      value={form.marital_status}
                      onChange={(e) => handleChange('marital_status', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                    >
                      <option value="Married">Married (Partner)</option>
                      <option value="Together">Living Together (Partner)</option>
                      <option value="Single">Single (Solo)</option>
                      <option value="Divorced">Divorced (Solo)</option>
                      <option value="Widow">Widow (Solo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Young Children at Home (0–2)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={2}
                      value={form.kidhome}
                      onChange={(e) => handleChange('kidhome', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Teenagers at Home (0–2)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={2}
                      value={form.teenhome}
                      onChange={(e) => handleChange('teenhome', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Financials & Enrollment */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-2.5">
                  2. Household Income & Enrollment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Annual Income ($)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000000}
                      step="any"
                      required
                      value={form.income}
                      onChange={(e) => handleChange('income', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Typical customer income: $20,000 – $120,000
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Enrolment Date (≤ Today)
                    </label>
                    <input
                      type="date"
                      max={CURRENT_DATE_STRING}
                      required
                      value={form.dt_customer}
                      onChange={(e) => handleChange('dt_customer', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-slate-700 font-medium mb-1">
                    Days Since Last Order (Recency: 0–99 days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    required
                    value={form.recency}
                    onChange={(e) => handleChange('recency', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Product Spending */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-2.5">
                  3. Spending by Category (Past 2 Years in $)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Wines</label>
                    <input
                      type="number"
                      min={0}
                      max={1493}
                      value={form.mnt_wines}
                      onChange={(e) => handleChange('mnt_wines', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Meat Products</label>
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
                    <label className="block text-slate-700 font-medium mb-1">Fish Products</label>
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
                    <label className="block text-slate-700 font-medium mb-1">Fruits</label>
                    <input
                      type="number"
                      min={0}
                      max={199}
                      value={form.mnt_fruits}
                      onChange={(e) => handleChange('mnt_fruits', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Sweets</label>
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
                    <label className="block text-slate-700 font-medium mb-1">Gold Products</label>
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
                  4. Purchasing Channels & Promotion History
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Deals Purchases</label>
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
                    <label className="block text-slate-700 font-medium mb-1">Web Purchases</label>
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
                    <label className="block text-slate-700 font-medium mb-1">Catalog Purchases</label>
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
                    <label className="block text-slate-700 font-medium mb-1">In-Store Purchases</label>
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
                    <label className="block text-slate-700 font-medium mb-1">Web Visits / Month</label>
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
                    <label className="block text-slate-700 font-medium mb-1">Accepted Promotion?</label>
                    <select
                      value={form.response}
                      onChange={(e) => handleChange('response', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                    >
                      <option value={0}>No (0)</option>
                      <option value={1}>Yes (1)</option>
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
                      <span>Matching customer against group benchmarks...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Find Matching Customer Group</span>
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
              title="Input Error"
              message={error}
            />
          )}

          {result ? (
            <Card
              title="Customer Group Match"
              subtitle="Estimated customer group based on closest lifestyle and spending alignment"
              className="border-indigo-200 shadow-md ring-1 ring-indigo-500/10"
            >
              <div className="space-y-5 text-xs">
                {/* Result Hero Banner */}
                <div className="rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 mb-1">
                    Best Matching Customer Group
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

                {/* Match Proximity Explanation */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">Profile Match Distance:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {result.distance_to_centroid}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This score measures how close this customer’s profile is to the typical center of this group. Lower values indicate a closer, more typical fit. (This is a geometric proximity score, not a percentage or probability).
                  </p>

                  {/* Collapsible Technical Result Data */}
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowTechnicalResult(!showTechnicalResult)}
                      className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <span>Technical Map Coordinates</span>
                      {showTechnicalResult ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {showTechnicalResult && (
                      <div className="mt-2 text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                        PC1: {result.pca_coordinates.pc1}, PC2: {result.pca_coordinates.pc2}, PC3: {result.pca_coordinates.pc3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Extrapolation Warnings (if any inputs exceed training bounds) */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <span className="font-semibold text-amber-950 text-xs">
                          Notice: Customer profile is outside standard training bounds
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900 leading-relaxed">
                          {result.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-amber-800 pt-1">
                          The system estimated the closest matching group, but this customer represents an unusually high income or tenure compared to our core dataset.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Benchmark Comparison vs Group Mean */}
                {result.benchmark_comparison?.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] mb-2">
                      How This Customer Compares to the Group Average
                    </h4>
                    <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                      {result.benchmark_comparison.map((b, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 text-[11px]">
                          <span className="font-medium text-slate-700">{b.feature}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-medium">
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

                {/* Business Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] mb-2">
                      Recommended Marketing Actions
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
              title="Ready to Find Customer Group"
              subtitle="Submit the customer profile form on the left or click an archetype above"
            >
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Sparkles className="h-10 w-10 text-slate-300 mb-3" />
                <h4 className="text-sm font-semibold text-slate-700">Awaiting Customer Details</h4>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Fill in the customer information or choose one of the pre-configured examples above to see their closest matching customer group.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
