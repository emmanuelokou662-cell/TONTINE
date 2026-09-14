import React, { useState } from 'react';
import { MembreGroupe } from '../../types';
import { ArrowUp, ArrowDown, Check, User } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';

interface TourOrderListProps {
  cycleId: string;
  members: MembreGroupe[];
  onSuccess: () => void;
}

/**
 * Organisateur de l'ordre de passage des membres pour le cycle (RF-09, RF-230)
 */
export const TourOrderList: React.FC<TourOrderListProps> = ({ cycleId, members, onSuccess }) => {
  const [orderedMembers, setOrderedMembers] = useState<MembreGroupe[]>(members);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const moveMember = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedMembers.length) return;

    const updated = [...orderedMembers];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setOrderedMembers(updated);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    setError(null);

    const payload = {
      id_cycle: cycleId,
      ordres: orderedMembers.map((m, idx) => ({
        id_membre_groupe: m.id_membre,
        ordre_passage: idx + 1
      }))
    };

    try {
      const res = await apiFetch('/transactions/tour-order', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setIsSaving(false);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error?.message || 'Erreur lors de l\'enregistrement de l\'ordre.');
      }
    } catch (e) {
      setIsSaving(false);
      setError('Erreur réseau.');
    }
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim">
          Organisez l&apos;ordre de distribution des membres pour ce cycle.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Liste ordonnée des membres */}
      <div className="space-y-2">
        {orderedMembers.map((member, index) => (
          <div
            key={member.id_membre}
            className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-custom shadow-sm"
          >
            <div className="flex items-center gap-3">
              {/* Numéro d'ordre */}
              <div className="w-7 h-7 rounded-xl bg-accent text-white font-display font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                {index + 1}
              </div>

              {/* Photo & Nom */}
              <div className="w-8 h-8 rounded-full bg-surface-2 overflow-hidden flex items-center justify-center">
                {member.photo_profil_url ? (
                  <img src={member.photo_profil_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-text-dim" />
                )}
              </div>

              <span className="font-display font-bold text-xs text-text-main truncate max-w-[140px]">
                {member.prenom} {member.nom}
              </span>
            </div>

            {/* Boutons Monter / Descendre */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveMember(index, 'up')}
                className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim disabled:opacity-30 touch-target"
                aria-label="Monter d'un rang"
              >
                <ArrowUp className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={index === orderedMembers.length - 1}
                onClick={() => moveMember(index, 'down')}
                className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim disabled:opacity-30 touch-target"
                aria-label="Descendre d'un rang"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton de sauvegarde */}
      <button
        onClick={handleSaveOrder}
        disabled={isSaving}
        className="btn-cta w-full text-xs flex items-center justify-center gap-2 mt-4"
      >
        <Check className="w-4 h-4" />
        <span>{isSaving ? 'Enregistrement...' : 'Valider l\'ordre de passage'}</span>
      </button>
    </div>
  );
};
