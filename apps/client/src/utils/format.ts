export const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`.trim();

export const initialsOf = (u: { firstName: string; lastName: string }) =>
  `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?';

export function formatDate(iso?: string | null, lang = 'en'): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(lang, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string | null, lang = 'en'): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(lang, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatMoney(amount: number, currency: string, lang = 'en'): string {
  try {
    return new Intl.NumberFormat(lang, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

// validările backend întorc un array de mesaje: afișăm primul
export function apiErrorMessage(err: any, fallback: string): string {
  const message = err?.response?.data?.message;
  return (Array.isArray(message) ? message[0] : message) || fallback;
}