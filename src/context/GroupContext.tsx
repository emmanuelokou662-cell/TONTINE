import React, { createContext, useContext, useEffect, useState } from 'react';
import { Groupe } from '../types';
import { apiFetch } from '../services/apiClient';
import { db, cacheGroups } from '../db/indexedDB';
import { useAuth } from './AuthContext';

interface GroupContextType {
  groups: Groupe[];
  activeGroup: Groupe | null;
  isLoading: boolean;
  selectGroup: (groupId: string) => void;
  refreshGroups: () => Promise<void>;
  createGroupAction: (input: { nom_groupe: string; mot_de_passe_groupe: string; periodicite: string; montant_cotisation: number }) => Promise<{ success: boolean; error?: string }>;
  joinGroupAction: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

const ACTIVE_GROUP_KEY = 'tontine_active_group_id';

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<Groupe[]>([]);
  const [activeGroup, setActiveGroup] = useState<Groupe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadGroups = async () => {
    if (!isAuthenticated) {
      setGroups([]);
      setActiveGroup(null);
      return;
    }

    setIsLoading(true);

    // 1. Chargement instantané depuis le cache IndexedDB
    try {
      const cached = await db.cachedGroups.toArray();
      if (cached.length > 0) {
        setGroups(cached);
        const savedActiveId = localStorage.getItem(ACTIVE_GROUP_KEY);
        const active = cached.find((g) => g.id_groupe === savedActiveId) || cached[0];
        setActiveGroup(active);
      }
    } catch (e) {
      console.warn('Erreur lecture cache groupes :', e);
    }

    // 2. Synchronisation depuis le serveur
    try {
      const res = await apiFetch<Groupe[]>('/groups/my');
      if (res.success && res.data) {
        setGroups(res.data);
        await cacheGroups(res.data);

        const savedActiveId = localStorage.getItem(ACTIVE_GROUP_KEY);
        const active = res.data.find((g) => g.id_groupe === savedActiveId) || res.data[0] || null;
        setActiveGroup(active);
      }
    } catch (err) {
      console.warn('Erreur chargement des groupes en ligne :', err);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, [isAuthenticated]);

  const selectGroup = (groupId: string) => {
    const found = groups.find((g) => g.id_groupe === groupId);
    if (found) {
      setActiveGroup(found);
      localStorage.setItem(ACTIVE_GROUP_KEY, groupId);
    }
  };

  const createGroupAction = async (input: {
    nom_groupe: string;
    mot_de_passe_groupe: string;
    periodicite: string;
    montant_cotisation: number;
  }) => {
    try {
      const res = await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify(input)
      });

      if (res.success) {
        await loadGroups();
        return { success: true };
      }
      return { success: false, error: res.error?.message || 'Erreur lors de la création du groupe.' };
    } catch (e: any) {
      return { success: false, error: 'Erreur de connexion.' };
    }
  };

  const joinGroupAction = async (password: string) => {
    try {
      const res = await apiFetch('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ mot_de_passe_groupe: password })
      });

      if (res.success) {
        await loadGroups();
        return { success: true };
      }
      return { success: false, error: res.error?.message || 'Erreur lors de l\'adhésion au groupe.' };
    } catch (e: any) {
      return { success: false, error: 'Erreur de connexion.' };
    }
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        isLoading,
        selectGroup,
        refreshGroups: loadGroups,
        createGroupAction,
        joinGroupAction
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = (): GroupContextType => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup doit être utilisé au sein d\'un GroupProvider');
  }
  return context;
};
