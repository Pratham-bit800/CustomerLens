import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { api } from '../../api/endpoints';

const PAGE_METADATA = {
  '/': {
    title: 'Customer Overview',
    subtitle: 'High-level customer distribution, spending benchmarks, and audience summaries.',
  },
  '/segments': {
    title: 'Customer Segments',
    subtitle: 'Visual behavioral map, group profiles, and demographic comparisons across customer cohorts.',
  },
  '/customers': {
    title: 'Customer Directory',
    subtitle: 'Search, filter, and inspect individual customer records alongside group benchmarks.',
  },
  '/predict': {
    title: 'Customer Group Finder',
    subtitle: 'Estimate which customer group a profile most resembles based on spending and lifestyle habits.',
  },
  '/business-insights': {
    title: 'Business Insights',
    subtitle: 'Actionable marketing strategies, channel preferences, and spending profiles by customer group.',
  },
  '/model-insights': {
    title: 'How Customer Lens Works',
    subtitle: 'Understand how customer data is processed, grouped, and matched to support business decisions.',
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
