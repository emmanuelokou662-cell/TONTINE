import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { useGroup } from '../context/GroupContext';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { AdminValidationModal } from '../components/transactions/AdminValidationModal';
import { apiFetch } from '../services/apiClient';
import { db, cacheTransactions } from '../db/indexedDB';
import { useSocket } from '../context/SocketContext';
import { Filter, Receipt, X } from 'lucide-react';

interface TransactionsPageProps {
  onOpenDeclarePayment: () => void;
}

/**
 * Page Historique des Transactions financières (RF-08) avec filtres et support Hors-Ligne
 */
export const TransactionsPage: React.FC<TransactionsPageProps> = ({ onOpenDeclarePayment }) => {
  const { activeGroup } = useGroup();
  const { on } = useSocket();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statutFilter, setStatutFilter] = useState<string>('tous');
  const [typeFilter, setTypeFilter] = useState<string>('tous');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [selectedTxForValidation, setSelectedTxForValidation] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isAdmin = activeGroup?.role === 'admin_principal' || activeGroup?.role === 'admin_secondaire';

  const loadTransactions = async () => {
    if (!activeGroup) return;
    setIsLoading(true);

    // 1. Chargement instantané depuis le cache IndexedDB
    try {
      const cached = await db.cachedTransactions.toArray();
      if (cached.length > 0) {
        setTransactions(cached);
      }
    } catch (e) {
      console.warn('Erreur cache transactions :', e);
    }

    // 2. Synchronisation en ligne
    if (navigator.onLine) {
      try {
        const res = await apiFetch<Transaction[]>(`/transactions/group/${activeGroup.id_groupe}`);
        if (res.success && res.data) {
          setTransactions(res.data);
          await cacheTransactions(res.data);
        }
      } catch (err) {
        console.warn('Erreur chargement transactions en ligne :', err);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadTransactions();
  }, [activeGroup?.id_groupe]);

  // Actualisation temps réel lors de nouveaux paiements ou validations
  useEffect(() => {
    const unsub1 = on('payment:declared', () => loadTransactions());
    const unsub2 = on('payment:validated', () => loadTransactions());
    const unsub3 = on('payment:rejected', () => loadTransactions());
    const unsub4 = on('tour:distributed', () => loadTransactions());
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [on, activeGroup?.id_groupe]);

  const filteredTransactions = transactions.filter((t) => {
    const matchStatut = statutFilter === 'tous' || t.statut === statutFilter;
    const matchType = typeFilter === 'tous' || t.type === typeFilter;
    return matchStatut && matchType;
  });

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* En-tête avec titre et bouton de déclaration */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-xl text-text-main">
            Historique financier
          </h2>
          <p className="text-xs text-text-dim">Relevé des dépôts et retraits de la tontine</p>
        </div>

        <button
          onClick={onOpenDeclarePayment}
          className="btn-cta text-xs py-2 px-3 flex items-center gap-1.5 shadow-sm"
        >
          <span>Cotiser</span>
        </button>
      </div>

      {/* Barre de filtres (RF-215) */}
      <div className="bg-surface border border-custom rounded-2xl p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-dim mb-1">
          <Filter className="w-3.5 h-3.5 text-accent" />
          <span>Filtres de consultation</span>
        </div>

        {/* Filtres par type */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 border-b border-custom">
          {[
            { id: 'tous', label: 'Tous flux' },
            { id: 'depot', label: 'Dépôts' },
            { id: 'retrait', label: 'Retraits' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === tab.id
                  ? 'bg-primary text-white font-bold'
                  : 'bg-surface-2 text-text-dim hover:text-text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtres par statut */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'tous', label: 'Tous statuts' },
            { id: 'en_attente', label: 'En attente' },
            { id: 'confirme', label: 'Confirmés' },
            { id: 'rejete', label: 'Rejetés' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatutFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                statutFilter === tab.id
                  ? 'bg-accent text-white font-semibold'
                  : 'bg-surface-2 text-text-dim hover:text-text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des transactions */}
      {isLoading && transactions.length === 0 ? (
        <div className="p-8 text-center text-text-dim text-xs">Chargement de l&apos;historique...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="p-8 rounded-3xl bg-surface border border-custom text-center text-text-dim">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">Aucune transaction trouvée pour ces filtres.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <TransactionItem
              key={tx.id_transaction}
              transaction={tx}
              isAdmin={isAdmin}
              onViewProof={(url) => setSelectedProofUrl(url)}
              onValidateClick={(targetTx) => setSelectedTxForValidation(targetTx)}
            />
          ))}
        </div>
      )}

      {/* Modal Zoom Capture de Reçu */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div className="relative max-w-sm w-full bg-surface rounded-3xl overflow-hidden p-2">
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedProofUrl} alt="Reçu" className="w-full max-h-[75vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {/* Modal de validation réservé aux admins (RF-07) */}
      {selectedTxForValidation && (
        <AdminValidationModal
          transaction={selectedTxForValidation}
          onClose={() => setSelectedTxForValidation(null)}
          onSuccess={loadTransactions}
        />
      )}
    </div>
  );
};
