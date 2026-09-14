import React, { useState } from 'react';
import { MembreGroupe } from '../../types';
import { X, ShieldCheck, UserMinus, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';

interface MemberActionModalProps {
  member: MembreGroupe | null;
  groupId: string;
  isMainAdmin?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal d'actions administratives sur un membre (RF-04, RF-16, RF-21)
 */
export const MemberActionModal: React.FC<MemberActionModalProps> = ({
  member,
  groupId,
  isMainAdmin = false,
  onClose,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState<boolean>(false);

  if (!member) return null;

  const handlePromoteAdmin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/groups/${groupId}/admin-secondary`, {
        method: 'POST',
        body: JSON.stringify({ id_membre_utilisateur: member.id_utilisateur })
      });
      setIsLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error?.message || 'Erreur lors de la nomination.');
      }
    } catch (e) {
      setIsLoading(false);
      setError('Erreur réseau.');
    }
  };

  const handleRemoveMember = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/groups/${groupId}/members/${member.id_membre}`, {
        method: 'DELETE'
      });
      setIsLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error?.message || 'Erreur lors du retrait du membre.');
      }
    } catch (e) {
      setIsLoading(false);
      setError('Erreur réseau.');
    }
  };

  const handleSuspectedDecision = async (decision: 'maintenir' | 'retirer') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/groups/${groupId}/suspected-member`, {
        method: 'POST',
        body: JSON.stringify({ id_membre_groupe: member.id_membre, decision })
      });
      setIsLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error?.message || 'Erreur lors de la prise de décision.');
      }
    } catch (e) {
      setIsLoading(false);
      setError('Erreur réseau.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in">
      <div className="bg-surface border border-custom rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base text-text-main">
            Gestion : {member.prenom} {member.nom}
          </h2>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-full hover:bg-surface-2 text-text-dim"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Décision pour membre suspecté (RF-16) */}
        {member.statut === 'suspecte' && (
          <div className="mb-4 p-4 rounded-2xl bg-danger/10 border border-danger/20 space-y-2">
            <p className="text-xs font-bold text-danger flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Membre suspecté pour 2 retards consécutifs</span>
            </p>
            <p className="text-[11px] text-text-dim leading-tight">
              En fin de cycle, vous pouvez décider de maintenir ce membre sous surveillance ou de l&apos;exclure définitivement.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleSuspectedDecision('maintenir')}
                disabled={isLoading}
                className="py-2 px-3 rounded-xl bg-surface border border-custom text-text-main font-bold text-xs"
              >
                Maintenir
              </button>
              <button
                onClick={() => handleSuspectedDecision('retirer')}
                disabled={isLoading}
                className="py-2 px-3 rounded-xl bg-danger text-white font-bold text-xs"
              >
                Exclure
              </button>
            </div>
          </div>
        )}

        {/* Confirmation modale de retrait (RF-21, RF-314) */}
        {showConfirmRemove ? (
          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold text-center">
              Êtes-vous certain de vouloir retirer {member.prenom} {member.nom} du groupe ?
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirmRemove(false)}
                className="py-2.5 rounded-xl border border-custom bg-surface-2 text-text-dim font-bold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={isLoading}
                className="py-2.5 rounded-xl bg-danger text-white font-bold text-xs"
              >
                Confirmer le retrait
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Désigner Admin Secondaire (RF-04) */}
            {isMainAdmin && member.role === 'membre' && (
              <button
                onClick={handlePromoteAdmin}
                disabled={isLoading}
                className="w-full p-3.5 rounded-2xl bg-surface-2 hover:bg-surface border border-custom flex items-center gap-3 text-xs font-bold text-text-main transition-colors"
              >
                <div className="p-2 rounded-xl bg-primary/15 text-primary dark:text-primary-light">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p>Désigner comme 2ᵉ Administrateur</p>
                  <p className="text-[10px] text-text-dim font-normal">Accorde les droits de validation et gestion</p>
                </div>
              </button>
            )}

            {/* Retirer du groupe (RF-21) */}
            {member.role !== 'admin_principal' && (
              <button
                onClick={() => setShowConfirmRemove(true)}
                disabled={isLoading}
                className="w-full p-3.5 rounded-2xl bg-danger/5 hover:bg-danger/10 border border-danger/20 flex items-center gap-3 text-xs font-bold text-danger transition-colors"
              >
                <div className="p-2 rounded-xl bg-danger/15 text-danger">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p>Retirer le membre du groupe</p>
                  <p className="text-[10px] text-danger/70 font-normal">Exclut le membre de la tontine</p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
