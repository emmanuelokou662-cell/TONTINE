import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, WifiOff, Lock } from 'lucide-react';
import { MoyenPaiement } from '../../types';
import { apiFetch } from '../../services/apiClient';
import { queueOfflinePayment } from '../../db/indexedDB';

interface PaymentDeclareModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  defaultAmount?: number;
  onSuccess: () => void;
}

/**
 * Modal de déclaration d'une cotisation Mobile Money avec support Hors-Ligne (RF-06, RF-201)
 * Le montant est strictement fixé par la tontine et non modifiable par le cotisant.
 */
export const PaymentDeclareModal: React.FC<PaymentDeclareModalProps> = ({
  isOpen,
  onClose,
  groupId,
  defaultAmount = 0,
  onSuccess
}) => {
  const [montant, setMontant] = useState<number>(defaultAmount);
  const [moyenPaiement, setMoyenPaiement] = useState<MoyenPaiement>('MTN_Money');
  const [txNumber, setTxNumber] = useState<string>('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultAmount) {
      setMontant(defaultAmount);
    }
  }, [defaultAmount, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('La capture ne doit pas dépasser 5 Mo.');
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || montant <= 0 || !txNumber.trim()) {
      setError('Veuillez renseigner le montant et le numéro de transaction.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Cas 1 : Mode Hors-Ligne (RF-201) -> Sauvegarde dans IndexedDB
    if (!navigator.onLine) {
      try {
        await queueOfflinePayment({
          id_groupe: groupId,
          montant,
          moyen_paiement: moyenPaiement,
          numero_tx_operateur: txNumber.trim(),
          preuve_blob: proofFile || undefined
        });

        setIsLoading(false);
        alert('Cotisation enregistrée hors-ligne ! Elle sera automatiquement envoyée dès le retour de votre connexion.');
        onSuccess();
        onClose();
        return;
      } catch (dbErr) {
        setIsLoading(false);
        setError('Impossible d\'enregistrer hors-ligne.');
        return;
      }
    }

    // Cas 2 : En ligne -> Envoi direct vers l'API REST
    const formData = new FormData();
    formData.append('id_groupe', groupId);
    formData.append('montant', montant.toString());
    formData.append('moyen_paiement', moyenPaiement);
    formData.append('numero_tx_operateur', txNumber.trim());
    if (proofFile) formData.append('preuve', proofFile);

    try {
      const res = await apiFetch('/transactions/declare', {
        method: 'POST',
        body: formData
      });

      setIsLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error?.message || 'Erreur lors de la déclaration.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError('Erreur réseau.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in">
      <div className="bg-surface border border-custom rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-text-main">
            Déclarer une cotisation
          </h2>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-full hover:bg-surface-2 text-text-dim"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!navigator.onLine && (
          <div className="p-3 mb-4 rounded-xl bg-warning/15 border border-warning/30 text-warning text-xs font-semibold flex items-center gap-2">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>Mode hors-ligne : la déclaration sera synchronisée automatiquement à la reconnexion.</span>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Choix de l'opérateur Mobile Money */}
          <div>
            <label className="block text-xs font-semibold text-text-dim mb-1.5">
              Moyen de paiement Mobile Money *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMoyenPaiement('MTN_Money')}
                className={`p-3 rounded-2xl border text-xs font-display font-bold flex items-center justify-center gap-2 transition-all ${
                  moyenPaiement === 'MTN_Money'
                    ? 'border-accent bg-accent/10 text-accent shadow-sm'
                    : 'border-custom bg-surface-2 text-text-dim'
                }`}
              >
                <span>🟡 MTN Money</span>
              </button>

              <button
                type="button"
                onClick={() => setMoyenPaiement('Wave')}
                className={`p-3 rounded-2xl border text-xs font-display font-bold flex items-center justify-center gap-2 transition-all ${
                  moyenPaiement === 'Wave'
                    ? 'border-accent bg-accent/10 text-accent shadow-sm'
                    : 'border-custom bg-surface-2 text-text-dim'
                }`}
              >
                <span>🔵 Wave</span>
              </button>
            </div>
          </div>

          {/* Montant fixé par la tontine (Non modifiable) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-text-dim">
                Montant de la cotisation *
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
                <Lock className="w-3 h-3" /> Fixé par la tontine
              </span>
            </div>
            <div className="w-full px-4 py-3 rounded-2xl bg-surface-2 border border-custom flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-display font-black text-text-main tracking-tight">
                  {montant > 0 ? Number(montant).toLocaleString('fr-FR') : '0'}
                </span>
                <span className="text-sm font-bold text-accent">FCFA</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-dim bg-surface px-2.5 py-1 rounded-xl border border-custom/60">
                <Lock className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-medium">Non modifiable</span>
              </div>
            </div>
          </div>

          {/* Numéro de transaction opérateur (anti-doublon RF-210) */}
          <div>
            <label className="block text-xs font-semibold text-text-dim mb-1">
              Numéro de transaction opérateur (SMS/Reçu) *
            </label>
            <input
              type="text"
              required
              value={txNumber}
              onChange={(e) => setTxNumber(e.target.value)}
              placeholder="Ex : CI260601.1234.A00123"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-custom text-xs font-mono text-text-main focus:border-accent focus:outline-none"
            />
          </div>

          {/* Upload de la capture de reçu (RF-198) */}
          <div>
            <label className="block text-xs font-semibold text-text-dim mb-1.5">
              Capture d&apos;écran du reçu / SMS (Recommandé)
            </label>
            <label className="border-2 border-dashed border-custom rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-accent bg-surface-2 transition-colors">
              {proofPreview ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden">
                  <img src={proofPreview} alt="Reçu" className="w-full h-full object-contain" />
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-text-dim mb-1" />
                  <span className="text-xs font-semibold text-text-main">Ajouter une capture</span>
                  <span className="text-[10px] text-text-dim">JPG, PNG (max 5 Mo)</span>
                </>
              )}
              <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-cta w-full mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="text-xs font-semibold">Enregistrement...</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Soumettre la cotisation</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
