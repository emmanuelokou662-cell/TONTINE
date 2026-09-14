import React, { createContext, useContext, useEffect, useState } from 'react';
import { Utilisateur } from '../types';
import { apiFetch, setAuthTokens, clearAuthTokens, getAccessToken } from '../services/apiClient';
import { db, cacheProfile } from '../db/indexedDB';

interface AuthContextType {
  user: Utilisateur | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (contact: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  register: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUser = async () => {
    setIsLoading(true);
    // 1. Récupération préalable depuis le cache IndexedDB (accès immédiat offline)
    try {
      const cached = await db.cachedProfile.toCollection().first();
      if (cached) {
        setUser(cached);
      }
    } catch (e) {
      console.warn('Erreur lecture cache profil :', e);
    }

    // 2. Si connecté avec un token, rafraîchir depuis le serveur
    if (getAccessToken()) {
      try {
        const response = await apiFetch<Utilisateur>('/auth/me');
        if (response.success && response.data) {
          setUser(response.data);
          await cacheProfile(response.data);
        }
      } catch (err) {
        console.warn('Impossible de rafraîchir le profil en ligne :', err);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (contact: string, pin: string) => {
    try {
      const response = await apiFetch<{ user: Utilisateur; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ contact_paiement: contact, code_pin: pin })
        }
      );

      if (response.success && response.data) {
        setAuthTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
        setUser(response.data.user);
        await cacheProfile(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.error?.message || 'Identifiants invalides.' };
      }
    } catch (err: any) {
      return { success: false, error: 'Erreur réseau lors de la connexion.' };
    }
  };

  const register = async (formData: FormData) => {
    try {
      const response = await apiFetch<{ user: Utilisateur; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/register',
        {
          method: 'POST',
          body: formData
        }
      );

      if (response.success && response.data) {
        setAuthTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
        setUser(response.data.user);
        await cacheProfile(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.error?.message || 'Erreur lors de la création du compte.' };
      }
    } catch (err: any) {
      return { success: false, error: 'Erreur réseau lors de l\'inscription.' };
    }
  };

  const logout = () => {
    clearAuthTokens();
    setUser(null);
    db.cachedProfile.clear();
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
};
