import React, { useState, useEffect } from 'react';
import { MembreGroupe } from '../types';
import { useGroup } from '../context/GroupContext';
import { MemberCard } from '../components/members/MemberCard';
import { MemberActionModal } from '../components/members/MemberActionModal';
import { apiFetch } from '../services/apiClient';
import { db, cacheMembers } from '../db/indexedDB';
import { useSocket } from '../context/SocketContext';
import { Users, Sparkles, Plus } from 'lucide-react';

interface MembersPageProps {
  onOpenCreateOrJoin: () => void;
}

/**
 * Page Liste des Membres du Groupe (RF-20) avec compteur global (RF-18) et relances (RF-19)
 */
export const MembersPage: React.FC<MembersPageProps> = ({ onOpenCreateOrJoin }) => {
  const { activeGroup } = useGroup();
  const { on } = useSocket();
  const [members, setMembers] = useState<MembreGroupe[]>([]);
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<MembreGroupe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [remindSuccess, setRemindSuccess] = useState<string | null>(null);

  const isAdmin = activeGroup?.role === 'admin_principal' || activeGroup?.role === 'admin_secondaire';
  const isMainAdmin = activeGroup?.role === 'admin_principal';

  const loadMembers = async () => {
    if (!activeGroup) return;
    setIsLoading(true);

    // 1. Cache IndexedDB (accès immédiat offline) (RF-308)
    try {
      const cached = await db.cachedMembers.where('id_groupe').equals(activeGroup.id_groupe).toArray();
      if (cached.length > 0) {
        setMembers(cached);
      }
    } catch (e) {
      console.warn('Erreur cache membres :', e);
    }

    // 2. Synchronisation en ligne
    if (navigator.onLine) {
      try {
        const res = await apiFetch<MembreGroupe[]>(`/groups/${activeGroup.id_groupe}/members`);
        if (res.success && res.data) {
          setMembers(res.data);
          await cacheMembers(res.data);
        }
      } catch (err) {
        console.warn('Erreur chargement membres en ligne :', err);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, [activeGroup?.id_groupe]);

  // Réactivité Temps Réel : nouveaux membres, changements de statut ou validations de paiement
  useEffect(() => {
    const unsub1 = on('member:joined', () => loadMembers());
    const unsub2 = on('member:updated', () => loadMembers());
    const unsub3 = on('member:removed', () => loadMembers());
    const unsub4 = on('payment:validated', () => loadMembers());
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [on, activeGroup?.id_groupe]);

  const handleRemindMember = async (member: MembreGroupe) => {
    try {
      await apiFetch('/notifications/messages', {
        method: 'POST',
        body: JSON.stringify({
          id_groupe: activeGroup!.id_groupe,
          id_destinataire: member.id_utilisateur,
          contenu: `Rappel de l'administrateur : Merci d'effectuer votre cotisation pour le cycle en cours.`
        })
      });
      setRemindSuccess(`Rappel push envoyé avec succès à ${member.prenom} !`);
      setTimeout(() => setRemindSuccess(null), 3500);
    } catch (e) {
      alert('Impossible d\'envoyer le rappel.');
    }
  };

  if (!activeGroup) {
    return (
      <div className="p-10 text-center text-text-dim text-xs">
        Veuillez sélectionner un groupe de tontine.
      </div>
    );
  }

  const membersUpToDate = members.filter((m) => m.derniere_cotisation_statut === 'confirme').length;

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-xl text-text-main flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <span>Membres du groupe</span>
          </h2>
          <p className="text-xs text-text-dim">{activeGroup.nom_groupe} ({members.length}/10 max)</p>
        </div>

        {isAdmin && members.length < 10 && (
          <button
            onClick={onOpenCreateOrJoin}
            className="btn-cta text-xs py-2 px-3 flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Inviter</span>
          </button>
        )}
      </div>

      {remindSuccess && (
        <div className="p-3 rounded-2xl bg-success/15 border border-success/30 text-success text-xs font-semibold text-center animate-in fade-in">
          {remindSuccess}
        </div>
      )}

      {/* Carte du compteur global de cotisation (RF-18, RF-295) */}
      <div className="p-4 rounded-3xl bg-surface border border-custom shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-text-dim">Statut collectif des cotisations</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-display font-extrabold text-2xl text-accent">
              {membersUpToDate}
            </span>
            <span className="text-sm font-bold text-text-dim">/ {members.length} à jour</span>
          </div>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
      </div>

      {/* Liste des membres (RF-20) */}
      {isLoading && members.length === 0 ? (
        <div className="p-8 text-center text-text-dim text-xs">Chargement des membres...</div>
      ) : (
        <div className="space-y-2.5">
          {members.map((m) => (
            <MemberCard
              key={m.id_membre}
              member={m}
              isAdmin={isAdmin}
              onRemindClick={handleRemindMember}
              onManageClick={(target) => setSelectedMemberForAction(target)}
            />
          ))}
        </div>
      )}

      {/* Modal d'actions administratives */}
      {selectedMemberForAction && (
        <MemberActionModal
          member={selectedMemberForAction}
          groupId={activeGroup.id_groupe}
          isMainAdmin={isMainAdmin}
          onClose={() => setSelectedMemberForAction(null)}
          onSuccess={loadMembers}
        />
      )}
    </div>
  );
};
