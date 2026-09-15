import React, { useState } from 'react';
import { Transaction } from '../../types';
import { X, Check, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { apiFetch, formatMediaUrl } from '../../services/apiClient';

interface AdminValidationModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal d'arbitrage et de validation/rejet des cotisations réservé aux administrateurs (RF-07)
 */
export const AdminValidationModal: React.FC<AdminValidationModalProps> = ({
  transaction,
  onClose,
  onSuccess
}) => {
  const [motifRejet, setMotifRejet] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;

  const handleValidate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/transactions/validate', {
        method: 'POST',
        body: JSON.stringify({ id_transaction: transaction.id_transaction })
      });
      setIsLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error?.message || 'Erreur lors de la validation.');
      }
    } catch (e: any) {
      setIsLoading(false);
      setError('Erreur de connexion.');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motifRejet.trim()) {
      setError('Le motif de rejet est obligatoire.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/transactions/reject', {
        method: 'POST',
        body: JSON.stringify({
          id_transaction: transaction.id_transaction,
          motif_rejet: motifRejet.trim()
        })
      });
      setIsLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error?.message || 'Erreur lors du rejet.');
      }
    } catch (e: any) {
      setIsLoading(false);
      setError('Erreur de connexion.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="bg-surface border border-custom rounded-3xl max-w-sm w-full p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-custom mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h3 className="font-display font-bold text-sm text-text-main">
              Arbitrage de Cotisation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-dim hover:text-text-main rounded-full hover:bg-surface-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Détails de la transaction */}
        <div className="bg-surface-2 p-3.5 rounded-2xl border border-custom space-y-2 text-xs mb-4">
          <div className="flex justify-between">
            <span className="text-text-dim font-medium">Membre :</span>
            <span className="font-bold text-text-main">
              {transaction.membre_groupe?.utilisateur.prenom} {transaction.membre_groupe?.utilisateur.nom}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-dim font-medium">Montant déclaré :</span>
            <span className="font-display font-extrabold text-accent text-sm">
              {transaction.montant.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-dim font-medium">Moyen :</span>
            <span className="font-semibold text-text-main">{transaction.moyen_paiement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-dim font-medium">N° Transaction :</span>
            <span className="font-mono text-text-main font-semibold">
              {transaction.numero_tx_operateur}
            </span>
          </div>
        </div>

        {/* Capture de reçu jointe */}
        {transaction.preuve_capture_url && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-dim mb-1.5">
              Preuve de paiement jointe :
            </label>
            <div className="rounded-2xl border border-custom overflow-hidden bg-black/10 max-h-56 flex items-center justify-center p-1">
              <img
                src={formatMediaUrl(transaction.preuve_capture_url)}
                alt="Capture reçu"
                className="max-h-52 w-full object-contain rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Formulaire de rejet avec motif obligatoire (RF-07) */}
        {showRejectForm ? (
          <form onSubmit={handleReject} className="space-y-3 pt-2 border-t border-custom">
            <div>
              <label className="block text-xs font-semibold text-danger mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Motif obligatoire du rejet :</span>
              </label>
              <textarea
                required
                rows={3}
                value={motifRejet}
                onChange={(e) => setMotifRejet(e.target.value)}
                placeholder="Ex : Numéro de transaction introuvable sur le relevé MTN Money."
                className="w-full p-3 rounded-xl bg-surface border border-danger/40 text-xs text-text-main focus:outline-none focus:border-danger"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="py-2.5 rounded-xl border border-custom bg-surface-2 text-text-dim font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="py-2.5 rounded-xl bg-danger text-white font-bold text-xs shadow-md"
              >
                Confirmer le Rejet
              </button>
            </div>
          </form>
        ) : (
          /* Boutons d'action Valider / Rejeter */
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={isLoading}
              className="py-3 px-4 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Rejeter</span>
            </button>

            <button
              onClick={handleValidate}
              disabled={isLoading}
              className="py-3 px-4 rounded-xl bg-success hover:bg-success/90 text-white font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-success/20"
            >
              <Check className="w-4 h-4" />
              <span>Valider le dépôt</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
