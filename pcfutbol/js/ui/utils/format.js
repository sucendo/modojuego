/**
 * Formateadores (evitar duplicados por toda la UI).
 */

export function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

export function formatPercent(v) {
  // v esperado 0..1
  if (v == null || Number.isNaN(v)) return '-';
  const x = clamp(Number(v), 0, 1);
  return `${Math.round(x * 100)}%`;
}

export function formatCurrency(value, currency = '€') {
  if (value == null || Number.isNaN(Number(value))) return '-';
  const n = Math.round(Number(value));
  // separador miles simple (ES)
  const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${s}${currency}`;
}

export function formatDateDMY(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '-';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
}