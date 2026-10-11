import { API_BASE_URL } from '../i18n/config';

// un singur loc pentru link-ul de donații
export const DONATE_URL = 'https://buymeacoffee.com/earbore';

export type DonateSource = 'header' | 'menu' | 'custom';

// tracking anonim, "fire and forget": nu blochează niciodată utilizatorul
export function trackDonateClick(tier: DonateSource = 'custom') {
  fetch(`${API_BASE_URL}/donations/track-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
    keepalive: true,
  }).catch(() => { });
}