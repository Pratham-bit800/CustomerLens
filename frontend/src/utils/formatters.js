/**
 * formatters.js — Standardized data presentation formatting.
 */

/**
 * Format currency amounts in USD ($1,250 or $1,250.00).
 */
export function formatCurrency(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(val);
}

/**
 * Format numbers with thousand separators (2,236).
 */
export function formatNumber(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(val);
}

/**
 * Format percentages (40.5% or 40.47%).
 */
export function formatPercent(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${Number(val).toFixed(decimals)}%`;
}

/**
 * Format difference delta with +/- prefix.
 */
export function formatDelta(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const num = Number(val);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}
