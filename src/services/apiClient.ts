import { ApiResponse } from '../types';

const ACCESS_TOKEN_KEY = 'tontine_access_token';
const REFRESH_TOKEN_KEY = 'tontine_refresh_token';

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setAuthTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Résout dynamiquement l'URL de base pour les requêtes API
 * Lit exclusivement la variable d'environnement VITE_URL ou VITE_API_URL
 */
export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_URL || (import.meta as any).env?.VITE_API_URL || '';
  if (!envUrl) return '';
  return envUrl.toString().trim().replace(/\/+$/, '');
};

export const formatApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    // Si l'endpoint commence déjà par /api, éviter de doubler
    const path = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
    return `${baseUrl}${path}`;
  }
  return cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
};

/**
 * Client HTTP Fetch sécurisé avec rafraîchissement silencieux de jeton JWT
 */
export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = formatApiUrl(endpoint);
  const token = getAccessToken();

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ne pas forcer Content-Type si c'est du FormData (upload de photo/reçu)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data: ApiResponse<T> = await response.json();

    // Si le jeton d'accès a expiré (401), tenter le rafraîchissement
    if (response.status === 401 && getRefreshToken() && !endpoint.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise<ApiResponse<T>>((resolve, reject) => {
          failedQueue.push({
            resolve: async (newToken: string) => {
              headers.set('Authorization', `Bearer ${newToken}`);
              const retryRes = await fetch(url, { ...options, headers });
              resolve(await retryRes.json());
            },
            reject
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshRes = await fetch(formatApiUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: getRefreshToken() })
        });

        const refreshData: ApiResponse<{ accessToken: string; refreshToken: string }> = await refreshRes.json();

        if (refreshRes.ok && refreshData.data) {
          setAuthTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
          processQueue(null, refreshData.data.accessToken);

          headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
          const retryRes = await fetch(url, { ...options, headers });
          return await retryRes.json();
        } else {
          clearAuthTokens();
          processQueue(new Error('Session expirée'), null);
          window.location.href = '/login';
          return data;
        }
      } catch (refreshErr) {
        clearAuthTokens();
        processQueue(refreshErr, null);
        window.location.href = '/login';
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Impossible de joindre le serveur. Mode hors-ligne actif.'
      }
    };
  }
};
