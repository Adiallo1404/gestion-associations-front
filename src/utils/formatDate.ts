/**
 * Format an ISO 8601 date-time string as a French date (DD/MM/YYYY).
 * Returns an em dash if the input is empty or invalid.
 * Shared across list/detail pages to avoid duplicating formatting logic.
 */
export function formatDate(raw?: string): string {
  if (!raw) return '—';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}