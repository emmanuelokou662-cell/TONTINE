// Types TypeScript complets pour la PWA Tontine
// Respect strict de la modélisation et du Cahier des Charges

export type RoleMembre = 'admin_principal' | 'admin_secondaire' | 'membre';
export type StatutMembre = 'actif' | 'suspecte' | 'retire';
export type PeriodiciteCycle =
  | '1jour'
  | '2jours'
  | '3jours'
  | '4jours'
  | '5jours'
  | '1semaine'
  | '2semaines'
  | '1mois'
  | '2mois'
  | '1an';
export type StatutCycle = 'en_cours' | 'termine';
export type StatutTour = 'en_attente' | 'distribue' | 'saute';
export type TypeTransaction = 'depot' | 'retrait';
export type MoyenPaiement = 'MTN_Money' | 'Wave';
export type StatutTransaction = 'en_attente' | 'confirme' | 'rejete' | 'reporte';
export type ThemeMode = 'clair' | 'sombre';

export interface Utilisateur {
  id_utilisateur: string;
  nom: string;
  prenom: string;
  contact_paiement: string;
  email: string;
  email_verifie: boolean;
  ville: string;
  photo_profil_url: string;
  theme_preference: ThemeMode;
  created_at: string;
}

export interface Groupe {
  id_groupe: string;
  nom_groupe: string;
  id_admin_principal: string;
  id_admin_secondaire?: string | null;
  periodicite: PeriodiciteCycle;
  statut: 'actif' | 'cloture';
  created_at: string;
  role?: RoleMembre;
  statut_membre?: StatutMembre;
  credit_reporte?: number;
  retards_consecutifs?: number;
  nombre_membres?: number;
  admin_principal?: Partial<Utilisateur>;
  admin_secondaire?: Partial<Utilisateur> | null;
  cycle_en_cours?: Cycle | null;
  membres?: MembreGroupe[];
}

export interface MembreGroupe {
  id_membre: string;
  id_utilisateur: string;
  nom: string;
  prenom: string;
  contact_paiement: string;
  photo_profil_url: string;
  ville?: string;
  role: RoleMembre;
  statut: StatutMembre;
  credit_reporte: number;
  retards_consecutifs: number;
  date_adhesion: string;
  derniere_cotisation_statut?: StatutTransaction | 'aucune';
}

export interface Cycle {
  id_cycle: string;
  id_groupe: string;
  numero_cycle: number;
  montant_cotisation: number;
  date_debut: string;
  date_fin?: string | null;
  statut: StatutCycle;
  tours?: Tour[];
}

export interface Tour {
  id_tour: string;
  id_cycle: string;
  id_membre_groupe: string;
  ordre_passage: number;
  date_prevue: string;
  statut: StatutTour;
  membre_groupe?: {
    id: string;
    role: RoleMembre;
    utilisateur: Partial<Utilisateur>;
  };
}

export interface Transaction {
  id_transaction: string;
  id_membre_groupe: string;
  id_tour?: string | null;
  type: TypeTransaction;
  montant: number;
  moyen_paiement: MoyenPaiement;
  numero_tx_operateur: string;
  preuve_capture_url?: string | null;
  statut: StatutTransaction;
  motif_rejet?: string | null;
  id_validateur?: string | null;
  created_at: string;
  synced_at?: string | null;
  membre_groupe?: {
    utilisateur: Partial<Utilisateur>;
  };
  validateur?: Partial<Utilisateur> | null;
}

export interface NotificationItem {
  id_notification: string;
  id_utilisateur: string;
  id_groupe?: string | null;
  type: string;
  message: string;
  lue: boolean;
  created_at: string;
}

export interface MessageItem {
  id_message: string;
  id_groupe: string;
  id_expediteur: string;
  id_destinataire: string;
  contenu: string;
  lu: boolean;
  created_at: string;
  expediteur?: Partial<Utilisateur>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface OfflinePendingTransaction {
  id?: number;
  id_groupe: string;
  id_tour?: string;
  montant: number;
  moyen_paiement: MoyenPaiement;
  numero_tx_operateur: string;
  preuve_blob?: Blob;
  created_at: string;
  sync_attempts: number;
}
