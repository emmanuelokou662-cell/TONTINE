import { db } from '../db/indexedDB';
import { apiFetch } from './apiClient';

type SyncListener = (status: { isOnline: boolean; pendingCount: number; isSyncing: boolean }) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineStatusChange(true));
      window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  private async notify() {
    const pendingCount = await db.offlineQueue.count();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners.forEach((l) => l({ isOnline, pendingCount, isSyncing: this.isSyncing }));
  }

  private async handleOnlineStatusChange(isOnline: boolean) {
    if (isOnline) {
      console.log('🌐 Connexion rétablie. Lancement de la synchronisation hors-ligne...');
      await this.syncOfflineQueue();
    }
    this.notify();
  }

  /**
   * Synchronise les cotisations en attente stockées dans IndexedDB vers le serveur (RF-06, RF-201)
   */
  public async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let synced = 0;
    let failed = 0;

    try {
      const pendingItems = await db.offlineQueue.toArray();

      for (const item of pendingItems) {
        try {
          const formData = new FormData();
          formData.append('id_groupe', item.id_groupe);
          if (item.id_tour) formData.append('id_tour', item.id_tour);
          formData.append('montant', item.montant.toString());
          formData.append('moyen_paiement', item.moyen_paiement);
          formData.append('numero_tx_operateur', item.numero_tx_operateur);
          if (item.preuve_blob) {
            formData.append('preuve', item.preuve_blob, 'recu-offline.jpg');
          }

          const response = await apiFetch('/transactions/declare', {
            method: 'POST',
            body: formData
          });

          if (response.success) {
            if (item.id) await db.offlineQueue.delete(item.id);
            synced++;
          } else {
            if (item.id) {
              await db.offlineQueue.update(item.id, {
                sync_attempts: item.sync_attempts + 1
              });
            }
            failed++;
          }
        } catch (itemErr) {
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return { synced, failed };
  }
}

export const syncManager = new SyncManager();
