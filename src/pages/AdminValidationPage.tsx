import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { useGroup } from '../context/GroupContext';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { AdminValidationModal } from '../components/transactions/AdminValidationModal';
import { apiFetch } from '../services/apiClient';
import { useSocket } from '../context/SocketContext';
import { ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';

interface AdminValidationPageProps {
  onBack: () => void;
}

/**
 * Page Dédiée de Validation des Cotisations en attente pour les Administrateurs (RF-07)
 */
export const AdminValidationPage: React.FC<AdminValidationPageProps> = ({ onBack }) => {
  const { activeGroup } = useGroup();
  const { on } = useSocket();
  const [pendingTxs, setPendingTxs] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadPending = async () => {
    if (!activeGroup) return;
    setIsLoading(true);
    try {
      const res = await apiFetch<Transaction[]>(
        `/transactions/group/${activeGroup.id_groupe}?statut=en_attente`
      );
      if (res.success && res.data) {
        setPendingTxs(res.data);
      }
    } catch (e) {
      console.warn('Erreur chargement transactions en attente :', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPending();
  }, [activeGroup?.id_groupe]);

  // Réactivité Temps Réel : actualise immédiatement la liste dès qu'une cotisation est déclarée/validée/rejetée
  useEffect(() => {
    const unsub1 = on('payment:declared', () => loadPending());
    const unsub2 = on('payment:validated', () => loadPending());
    const unsub3 = on('payment:rejected', () => loadPending());
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [on, activeGroup?.id_groupe]);

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="touch-target p-2 rounded-full hover:bg-surface-2 text-text-dim"
          aria-label="Retour"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="font-display font-extrabold text-xl text-text-main flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary dark:text-primary-light" />
            <span>Validations en attente</span>
          </h2>
          <p className="text-xs text-text-dim">
            {pendingTxs.length} cotisation{pendingTxs.length > 1 ? 's' : ''} à vérifier
          </p>
        </div>
      </div>

      {/* Liste des cotisations à valider */}
      {isLoading ? (
        <div className="p-8 text-center text-text-dim text-xs">Recherche des cotisations...</div>
      ) : pendingTxs.length === 0 ? (
        <div className="p-10 rounded-3xl bg-surface border border-custom text-center text-text-dim">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-success" />
          <h3 className="font-display font-bold text-sm text-text-main mb-1">Toutes les cotisations sont à jour</h3>
          <p className="text-xs">Aucun versement en attente de vérification pour ce groupe.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingTxs.map((tx) => (
            <TransactionItem
              key={tx.id_transaction}
              transaction={tx}
              isAdmin={true}
              onValidateClick={(target) => setSelectedTx(target)}
            />
          ))}
        </div>
      )}

      {/* Modal d'arbitrage */}
      {selectedTx && (
        <AdminValidationModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onSuccess={loadPending}
        />
      )}
    </div>
  );
};
