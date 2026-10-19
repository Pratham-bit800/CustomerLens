/**
 * endpoints.js — Dedicated API functions mapping 1-to-1 with backend routes.
 */
import { apiRequest } from './client';

export const api = {
  /** Check server health and cluster counts */
  getHealth: () => apiRequest('/health'),

  /** Overview dataset and cluster distribution summary */
  getOverview: () => apiRequest('/overview'),

  /** Cluster profiles with PCA scatter coordinates */
  getClusters: (samplePcaPoints) =>
    apiRequest('/clusters', {
      params: samplePcaPoints ? { sample_pca_points: samplePcaPoints } : null,
    }),

  /** Specific cluster profile by ID */
  getCluster: (clusterId) => apiRequest(`/clusters/${clusterId}`),

  /** Paginated customer list with sorting, segment filter, and search */
  getCustomers: ({ page = 1, limit = 25, clusterId = null, search = '', sortBy = 'customer_id', sortOrder = 'asc' } = {}) =>
    apiRequest('/customers', {
      params: {
        page,
        limit,
        cluster_id: clusterId !== null && clusterId !== '' ? clusterId : undefined,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    }),

  /** Single customer detail with 18-feature cluster benchmark */
  getCustomer: (customerId) => apiRequest(`/customers/${customerId}`),

  /** Predict segment for a new customer profile */
  predictSegment: (formData) =>
    apiRequest('/predict-segment', {
      method: 'POST',
      body: formData,
    }),

  /** Model architecture, PCA variance, and validation metadata */
  getModelInfo: () => apiRequest('/model-info'),
};

export default api;
