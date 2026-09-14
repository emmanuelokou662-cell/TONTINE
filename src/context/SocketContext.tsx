import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socketClient } from '../services/socketClient';
import { useAuth } from './AuthContext';
import { useGroup } from './GroupContext';

import { getAccessToken } from '../services/apiClient';

interface LiveToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'payment';
}

interface SocketContextType {
  isConnected: boolean;
  activeRoom: string | null;
  joinGroupRoom: (groupId: string) => void;
  leaveGroupRoom: (groupId: string) => void;
  on: (event: string, callback: (...args: any[]) => void) => () => void;
  emit: (event: string, data?: any) => void;
  liveToasts: LiveToast[];
  dismissToast: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { activeGroup, refreshGroups } = useGroup();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [liveToasts, setLiveToasts] = useState<LiveToast[]>([]);

  const addToast = useCallback((title: string, message: string, type: LiveToast['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setLiveToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);

    // Auto suppression après 5 secondes
    setTimeout(() => {
      setLiveToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setLiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Gestion de la connexion / déconnexion selon l'état d'authentification
  useEffect(() => {
    if (isAuthenticated) {
      const currentToken = getAccessToken();
      if (currentToken) {
        socketClient.updateAuthToken(currentToken);
      }
      const socket = socketClient.connect();

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      setIsConnected(socket.connected);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    } else {
      socketClient.disconnect();
      setIsConnected(false);
      setActiveRoom(null);
    }
  }, [isAuthenticated]);

  // 2. Gestion des salons de groupe (Rooms) selon le groupe actif sélectionné
  useEffect(() => {
    if (isAuthenticated && activeGroup?.id_groupe) {
      socketClient.joinGroup(activeGroup.id_groupe);
      setActiveRoom(`group:${activeGroup.id_groupe}`);

      return () => {
        socketClient.leaveGroup(activeGroup.id_groupe);
      };
    }
  }, [isAuthenticated, activeGroup?.id_groupe]);

  // 3. Écouteurs globaux temps réel pour les notifications et rafraîchissements automatiques
  useEffect(() => {
    if (!isAuthenticated) return;

    // A. Cotisation déclarée dans le groupe
    const unsubDeclared = socketClient.on('payment:declared', (data: any) => {
      console.log('⚡ [Live] Nouvelle cotisation déclarée :', data);
      const nom = data?.transaction?.nom || 'Un membre';
      const montant = data?.transaction?.montant ? `${Number(data.transaction.montant).toLocaleString('fr-FR')} FCFA` : '';
      addToast('Cotisation Déclarée', `${nom} a déclaré un versement de ${montant}.`, 'payment');
      refreshGroups();
    });

    // B. Cotisation validée par l'administrateur
    const unsubValidated = socketClient.on('payment:validated', (data: any) => {
      console.log('⚡ [Live] Cotisation validée :', data);
      addToast('Cotisation Validée', 'Une cotisation a été validée avec succès.', 'success');
      refreshGroups();
    });

    // C. Cotisation rejetée
    const unsubRejected = socketClient.on('payment:rejected', (data: any) => {
      console.log('⚡ [Live] Cotisation rejetée :', data);
      addToast('Cotisation Rejetée', 'Une cotisation a été rejetée.', 'warning');
      refreshGroups();
    });

    // D. Cagnotte distribuée
    const unsubTour = socketClient.on('tour:distributed', (data: any) => {
      console.log('⚡ [Live] Cagnotte distribuée :', data);
      addToast('Cagnotte Distribuée', 'Le versement de la cagnotte a été effectué.', 'success');
      refreshGroups();
    });

    // E. Nouveau membre ayant rejoint
    const unsubMember = socketClient.on('member:joined', (data: any) => {
      console.log('⚡ [Live] Nouveau membre rejoint :', data);
      addToast('Nouveau Membre', 'Un nouveau membre a rejoint la tontine.', 'info');
      refreshGroups();
    });

    // F. Notification directe utilisateur
    const unsubNotif = socketClient.on('notification:new', (data: any) => {
      console.log('⚡ [Live] Notification reçue :', data);
      if (data?.notification?.message) {
        addToast('Notification Tontine', data.notification.message, 'info');
      }
    });

    return () => {
      unsubDeclared();
      unsubValidated();
      unsubRejected();
      unsubTour();
      unsubMember();
      unsubNotif();
    };
  }, [isAuthenticated, addToast, refreshGroups]);

  const joinGroupRoom = useCallback((groupId: string) => {
    socketClient.joinGroup(groupId);
    setActiveRoom(`group:${groupId}`);
  }, []);

  const leaveGroupRoom = useCallback((groupId: string) => {
    socketClient.leaveGroup(groupId);
    if (activeRoom === `group:${groupId}`) {
      setActiveRoom(null);
    }
  }, [activeRoom]);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    return socketClient.on(event, callback);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketClient.emit(event, data);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        activeRoom,
        joinGroupRoom,
        leaveGroupRoom,
        on,
        emit,
        liveToasts,
        dismissToast
      }}
    >
      {children}

      {/* Rendu des Toasts Temps Réel Flottants (Live Notifications) */}
      <div className="fixed top-16 right-4 left-4 sm:left-auto sm:w-80 z-50 pointer-events-none space-y-2 select-none">
        {liveToasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 flex items-start gap-3 cursor-pointer ${
              toast.type === 'success'
                ? 'bg-success/90 border-success text-white'
                : toast.type === 'payment'
                ? 'bg-accent/95 border-accent text-white'
                : toast.type === 'warning'
                ? 'bg-danger/90 border-danger text-white'
                : 'bg-surface/95 dark:bg-surface/95 border-custom text-text-main'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-display font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>{toast.title}</span>
              </div>
              <p className="text-[11px] mt-0.5 opacity-90 leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="text-xs opacity-70 hover:opacity-100 font-bold px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket doit être utilisé au sein d\'un SocketProvider');
  }
  return context;
};
