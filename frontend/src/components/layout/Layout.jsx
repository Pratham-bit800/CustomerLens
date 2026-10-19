import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { api } from '../../api/endpoints';

const PAGE_METADATA = {
  '/': {
    title: 'Overview Dashboard',
    subtitle: 'High-level customer distribution, key cohort averages, and ML segmentation summary.',
  },
  '/segments': {
    title: 'Segment Explorer',
    subtitle: 'Interactive 3D PCA projection (PC1 vs PC2), cluster centroids, and feature comparisons.',
  },
  '/customers': {
    title: 'Customer Explorer',
    subtitle: 'Search, filter, and inspect individual customer records with 18-feature cluster benchmarks.',
  },
  '/predict': {
    title: 'Predict Customer Segment',
    subtitle: 'Real-time inference using NearestCentroid in 3D PCA space with historical data constraints.',
  },
  '/business-insights': {
    title: 'Business Insights',
    subtitle: 'Segment-by-segment behavioral findings and actionable marketing retention hypotheses.',
  },
  '/model-insights': {
    title: 'Model Insights',
    subtitle: 'Machine learning architecture, PCA variance, silhouette scores, and held-out cross-validation.',
  },
};

export default function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    isHealthy: false,
    customers_loaded: null,
    cluster_counts: null,
    checked: false,
  });

  const location = useLocation();
  const currentMeta = PAGE_METADATA[location.pathname] || {
    title: 'Customer Lens',
    subtitle: 'Customer Intelligence Platform',
  };

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const data = await api.getHealth();
        if (isMounted) {
          setBackendStatus({
            isHealthy: data.status === 'healthy',
            customers_loaded: data.customers_loaded,
            cluster_counts: data.cluster_counts,
            checked: true,
          });
        }
      } catch (err) {
        if (isMounted) {
          setBackendStatus({
            isHealthy: false,
            customers_loaded: null,
            cluster_counts: null,
            checked: true,
            error: err.message,
          });
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Persistent Sidebar */}
      <Sidebar
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        backendStatus={backendStatus}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          backendStatus={backendStatus}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ backendStatus }} />
        </main>
      </div>
    </div>
  );
}
