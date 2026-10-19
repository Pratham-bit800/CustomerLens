import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  BarChart2,
  Info,
} from 'lucide-react';
import { api } from '../api/endpoints';
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatPercent } from '../utils/formatters';

export default function ModelInsights() {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchModelInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getModelInfo();
      setModelInfo(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  if (loading) {
    return <LoadingSpinner fullHeight message="Loading machine learning pipeline architecture..." />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorAlert
          title="Could not load model metadata"
          message={error}
          onRetry={fetchModelInfo}
        />
      </div>
    );
  }

  const {
    pca_components,
    pca_explained_variance,
    pca_cumulative_variance,
    algorithms_evaluated,
    final_algorithm,
    final_n_clusters,
    final_linkage,
    silhouette_score,
    feature_engineering,
    encoding_details,
    scaling_details,
    outlier_removal,
    prediction_method,
    limitations,
  } = modelInfo;

  return (
    <div className="space-y-6">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Final Algorithm"
          value={final_algorithm}
          subtitle={`Linkage: ${final_linkage}, k=${final_n_clusters}`}
          icon={Cpu}
          badge="Production ML"
          badgeType="primary"
        />
        <MetricCard
          title="Silhouette Score"
          value={silhouette_score?.toFixed(4)}
          subtitle="Outperformed KMeans (0.3581)"
          icon={BarChart2}
          badge="Cluster Quality"
          badgeType="success"
        />
        <MetricCard
          title="PCA Cumulative Variance"
          value={formatPercent(pca_cumulative_variance * 100, 2)}
          subtitle={`${pca_components} components from 18 features`}
          icon={Layers}
          badge="Compression"
        />
        <MetricCard
          title="Surrogate Fidelity"
          value={`${prediction_method?.validation?.in_sample_agreement_pct || 96.29}%`}
          subtitle={`ARI = ${prediction_method?.validation?.in_sample_ARI || 0.8947} (In-Sample)`}
          icon={CheckCircle}
          badge="Surrogate Fidelity"
          badgeType="primary"
        />
      </div>

      {/* Critical Methodological Note on Surrogate Fidelity */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950 shadow-xs">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-indigo-950">
              Evaluation Clarification: In-Sample Surrogate Fidelity, Not Predictive Accuracy
            </h4>
            <p className="text-indigo-800 leading-relaxed">
              Because Agglomerative hierarchical clustering produces non-parametric partitions without an out-of-sample decision boundary, the inference endpoint uses a <span className="font-semibold">NearestCentroid surrogate in 3D PCA space</span>. The reported in-sample fidelity ({prediction_method?.validation?.in_sample_agreement_pct || 96.29}%, ARI = {prediction_method?.validation?.in_sample_ARI || 0.8947}) measures how closely the surrogate reproduces the reference Agglomerative clustering on the 2,236 historical customers. A 5-fold cross-validation evaluated subset stability ({prediction_method?.validation?.mean_held_out_agreement_pct}% ± {prediction_method?.validation?.std_held_out_agreement_pct}%). These metrics do not establish generalization to unseen customers, and Euclidean centroid distance is not a probability.
            </p>
          </div>
        </div>
      </div>

      {/* Algorithm Evaluation Comparison Table */}
      <Card
        title="Unsupervised Algorithm Benchmarks"
        subtitle="Evaluation of clustering methods explored during the experimental EDA phase"
      >
        <div className="overflow-x-auto -mx-5 -my-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3">Algorithm</th>
                <th className="px-4 py-3">Clusters (k)</th>
                <th className="px-4 py-3">Selection Method</th>
                <th className="px-4 py-3">Silhouette Score</th>
                <th className="px-4 py-3">Deployment Status</th>
                <th className="px-5 py-3">Decision Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {algorithms_evaluated?.map((algo, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {algo.algorithm}
                  </td>
                  <td className="px-4 py-3 font-mono">{algo.n_clusters}</td>
                  <td className="px-4 py-3 text-slate-600">{algo.selection_method || 'Ward Linkage'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {algo.silhouette_score}
                  </td>
                  <td className="px-4 py-3">
                    {algo.selected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        Selected Model
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        Evaluated Baseline
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600 max-w-xs">{algo.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dimensionality Reduction & Variance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Principal Component Analysis (PCA)"
          subtitle="Variance retention across the 3 selected principal components"
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-2.5">
              {pca_explained_variance?.map((variance, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>Component {idx + 1} (PC{idx + 1})</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatPercent(variance * 100, 2)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${(variance / 0.25) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Cumulative Explained Variance:</span>
              <span className="font-mono font-bold text-indigo-600 text-sm">
                {formatPercent(pca_cumulative_variance * 100, 2)}
              </span>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-900 text-[11px] leading-relaxed">
              <span className="font-semibold">Information Compression Note: </span>
              Approximately 55.05% of the feature variance is not captured in the 3D PCA projection. Dimensionality reduction simplifies clustering and separates primary purchasing axes, but eliminates higher-order residual variance.
            </div>
          </div>
        </Card>

        {/* Feature Engineering & Preprocessing */}
        <Card
          title="Preprocessing & Feature Transformations"
          subtitle="Pipeline stages converting raw attributes into 18 standardized features"
        >
          <div className="space-y-3 text-xs">
            <div>
              <h5 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                Engineered Features
              </h5>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                {feature_engineering?.map((fe, i) => (
                  <li key={i}>{fe}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h5 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Encoding & Scaling
              </h5>
              <p className="text-slate-600 leading-relaxed">
                {encoding_details?.type} applied to <span className="font-mono">Education</span> (3 levels) and <span className="font-mono">Living_With</span> (2 levels), yielding 5 dummy variables. {scaling_details}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h5 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Outlier Elimination
              </h5>
              <p className="text-slate-600">
                {outlier_removal?.rows_removed} records removed where Age ≥ 90 or Income ≥ $600,000. Customer IDs: [{outlier_removal?.removed_customer_ids?.join(', ')}]. Dataset reduced from {outlier_removal?.rows_before} to {outlier_removal?.rows_after} customers.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Surrogate Cluster Agreement & Stability Breakdown */}
      <Card
        title="Surrogate Cluster Agreement & Subsample Stability"
        subtitle="Agreement metrics across clusters (5-Fold cross-validation subset stability)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {Object.entries(prediction_method?.validation?.per_cluster_accuracy || {}).map(
            ([cid, acc]) => (
              <div key={cid} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-slate-500 block text-[11px]">
                  Cluster {cid} Agreement
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
                  {acc}%
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {cid === '0' ? 'Borders Cluster 1 on income axis' : 'High boundary separation'}
                </span>
              </div>
            )
          )}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
          <p>
            Primary Confusion: <span className="font-semibold text-slate-800">{prediction_method?.validation?.primary_confusion}</span> accounts for ~77% of all surrogate disagreements. In-sample agreement (fitted centroids tested against full training set) was 96.29%.
          </p>
        </div>
      </Card>

      {/* Model Limitations Checklist */}
      <Card
        title="Documented System & Data Limitations"
        subtitle="Transparent operational bounds for portfolio and demonstration review"
      >
        <div className="space-y-2.5 text-xs">
          {limitations?.map((limitation, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/30 text-slate-700"
            >
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="leading-relaxed">{limitation}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
