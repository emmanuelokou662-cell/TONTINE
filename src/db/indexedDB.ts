import Dexie, { type Table } from 'dexie';
import {
  Groupe,
  MembreGroupe,
  Transaction,
  Utilisateur,
  NotificationItem,
  OfflinePendingTransaction
} from '../types';

/**
 * Base de données IndexedDB locale Dexie.js (Section 2.2 Offline First)
 */
export class TontineDatabase extends Dexie {
  offlineQueue!: Table<OfflinePendingTransaction, number>;
  cachedGroups!: Table<Groupe, string>;
  cachedMembers!: Table<MembreGroupe, string>;
  cachedTransactions!: Table<Transaction, string>;
  cachedProfile!: Table<Utilisateur, string>;
  cachedNotifications!: Table<NotificationItem, string>;

  constructor() {
    super('TontinePWADatabase');

    this.version(1).stores({
      offlineQueue: '++id, id_groupe, created_at',
      cachedGroups: 'id_groupe, nom_groupe',
      cachedMembers: 'id_membre, id_groupe, id_utilisateur',
      cachedTransactions: 'id_transaction, id_membre_groupe, created_at',
      cachedProfile: 'id_utilisateur',
      cachedNotifications: 'id_notification, id_utilisateur, created_at'
    });
  }
}

export const db = new TontineDatabase();

/**
 * Sauvegarder une cotisation dans la file d'attente hors-ligne (RF-06, RF-201)
 */
export const queueOfflinePayment = async (
  item: Omit<OfflinePendingTransaction, 'id' | 'created_at' | 'sync_attempts'>
): Promise<number> => {
  return db.offlineQueue.add({
    ...item,
    created_at: new Date().toISOString(),
    sync_attempts: 0
  });
};

/**
 * Mettre en cache la liste des groupes
 */
export const cacheGroups = async (groups: Groupe[]): Promise<void> => {
  await db.cachedGroups.clear();
  await db.cachedGroups.bulkPut(groups);
};

/**
 * Mettre en cache les membres d'un groupe
 */
export const cacheMembers = async (members: MembreGroupe[]): Promise<void> => {
  await db.cachedMembers.bulkPut(members);
};

/**
 * Mettre en cache les transactions d'un groupe
 */
export const cacheTransactions = async (transactions: Transaction[]): Promise<void> => {
  await db.cachedTransactions.bulkPut(transactions);
};

/**
 * Mettre en cache le profil utilisateur
 */
export const cacheProfile = async (profile: Utilisateur): Promise<void> => {
  await db.cachedProfile.put(profile);
};
