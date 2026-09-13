import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function guestTokenKey(token: string) {
  return `earbore-guest-token-${token}`;
}

export function createPublicShareClient(token: string) {
  const client = axios.create({ baseURL: `${API_BASE_URL}/public-share/${token}` });

  client.interceptors.request.use((config) => {
    const guestToken = localStorage.getItem(guestTokenKey(token));
    if (guestToken) {
      config.headers = config.headers || {};
      config.headers['x-guest-token'] = guestToken;
    }
    return config;
  });

  return client;
}

export async function joinShareLink(token: string, displayName?: string) {
  const client = createPublicShareClient(token);
  const { data } = await client.post('/join', { displayName });
  localStorage.setItem(guestTokenKey(token), data.guestToken);
  return data.link as { id: string; ownerId: string; accessLevel: 'READ_ONLY' | 'EDIT'; label?: string };
}