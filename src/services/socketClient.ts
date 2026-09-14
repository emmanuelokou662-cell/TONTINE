import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './apiClient';

/**
 * Résout l'URL du serveur WebSocket / Socket.IO
 * Supporte VITE_URL, VITE_API_URL ou le domaine local courant
 */
const getSocketServerUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_URL || (import.meta as any).env?.VITE_API_URL || '';
  if (envUrl) {
    return envUrl.toString().trim().replace(/\/+$/, '').replace(/\/api$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

type EventCallback = (...args: any[]) => void;

/**
 * Cerveau Global Socket.IO Frontend pour TONTINE PWA
 * Gère la connexion singleton, la reconnexion automatique, l'authentification et les salons
 */
class SocketClient {
  private socket: Socket | null = null;
  private currentGroupId: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isManuallyDisconnected = false;

  /**
   * Initialise et connecte le socket si ce n'est pas déjà fait
   */
  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.isManuallyDisconnected = false;
    const serverUrl = getSocketServerUrl();
    const token = getAccessToken();

    this.socket = io(serverUrl, {
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log(`⚡ [Socket.IO Frontend] Connecté au serveur temps réel (${this.socket?.id})`);
      // Rejoindre le groupe actif s'il existait avant déconnexion
      if (this.currentGroupId) {
        this.joinGroup(this.currentGroupId);
      }
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.IO Frontend] Erreur de connexion WebSocket :', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.IO Frontend] Déconnecté du serveur temps réel (${reason})`);
      if (!this.isManuallyDisconnected && reason === 'io server disconnect') {
        // Le serveur a forcé la déconnexion (ex: token expiré), retenter la connexion
        this.socket?.connect();
      }
    });

    // Réattacher tous les écouteurs enregistrés
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb);
      });
    });

    return this.socket;
  }

  /**
   * Déconnecte proprement le socket
   */
  public disconnect(): void {
    this.isManuallyDisconnected = true;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🛑 [Socket.IO Frontend] Socket déconnecté manuellement.');
    }
  }

  /**
   * Met à jour le jeton d'authentification du socket après un rafraîchissement de token ou login
   */
  public updateAuthToken(token: string): void {
    if (this.socket) {
      this.socket.auth = { token };
      if (this.socket.connected) {
        this.socket.disconnect().connect();
      }
    }
  }

  /**
   * Rejoindre le salon temps réel d'un groupe de tontine
   */
  public joinGroup(groupId: string): void {
    if (!groupId) return;
    this.currentGroupId = groupId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_group', groupId);
      console.log(`👥 [Socket.IO Frontend] Rejoint le groupe group:${groupId}`);
    }
  }

  /**
   * Quitter le salon temps réel d'un groupe
   */
  public leaveGroup(groupId: string): void {
    if (!groupId) return;
    if (this.currentGroupId === groupId) {
      this.currentGroupId = null;
    }
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_group', groupId);
      console.log(`👋 [Socket.IO Frontend] Quitté le groupe group:${groupId}`);
    }
  }

  /**
   * Écouter un événement temps réel avec désinscription automatique
   */
  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Retourne la fonction de nettoyage
    return () => {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback);
      }
    };
  }

  /**
   * Émettre un événement vers le serveur
   */
  public emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ [Socket.IO Frontend] Impossible d'émettre '${event}' : socket non connecté.`);
    }
  }

  /**
   * Vérifie si le socket est actuellement connecté
   */
  public isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  /**
   * Retourne l'instance brute de Socket.IO si besoin
   */
  public getRawSocket(): Socket | null {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
