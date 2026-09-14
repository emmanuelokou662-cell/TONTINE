import React, { useState, useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { GroupCard } from '../components/dashboard/GroupCard';
import { RotationWheel } from '../components/dashboard/RotationWheel';
import { UpcomingTourBanner } from '../components/dashboard/UpcomingTourBanner';
import { apiFetch } from '../services/apiClient';
import { Plus, ArrowUpRight, ShieldAlert, Sparkles } from 'lucide-react';
import { Tour } from '../types';

interface DashboardPageProps {
  onOpenDeclarePayment: () => void;
  onOpenManageGroup: () => void;
  onOpenCreateOrJoin: () => void;
  onConfirmDistribution: (tourId: string) => void;
}

/**
 * Page principale Tableau de Bord (Dashboard) de la PWA Tontine
 */
export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenDeclarePayment,
  onOpenManageGroup,
  onOpenCreateOrJoin,
  onConfirmDistribution
}) => {
  const { activeGroup, groups, isLoading: groupLoading } = useGroup();
  const { user } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [membersUpToDate, setMembersUpToDate] = useState<number>(0);

  useEffect(() => {
    if (activeGroup) {
      loadDashboardData(activeGroup.id_groupe);
    }
  }, [activeGroup?.id_groupe]);

  const loadDashboardData = async (groupId: string) => {
    try {
      const res = await apiFetch<any>(`/groups/${groupId}`);
      if (res.success && res.data) {
        const cycle = res.data.cycles?.[0];
        if (cycle && cycle.tours) {
          setTours(cycle.tours);
        }

        const members = res.data.membres || [];
        // Calculer les membres à jour (ceux ayant au moins un dépôt confirmé)
        const upToDate = members.filter((m: any) => m.transactions?.some((t: any) => t.statut === 'confirme')).length;
        setMembersUpToDate(upToDate || Math.min(members.length, 1));
      }
    } catch (e) {
      console.warn('Erreur chargement dashboard :', e);
    }
  };

  if (groupLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-text-dim">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Chargement de votre tontine...</p>
      </div>
    );
  }

  // État si l'utilisateur n'a aucun groupe actif
  if (!activeGroup || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-accent/15 text-accent flex items-center justify-center mb-4 shadow-sm">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-xl text-text-main mb-2">
          Bienvenue, {user?.prenom} !
        </h2>
        <p className="text-xs text-text-dim max-w-xs mb-6">
          Vous n&apos;avez pas encore intégré de groupe de tontine. Créez votre propre groupe ou rejoignez-en un via son code d&apos;accès.
        </p>
        <button
          onClick={onOpenCreateOrJoin}
          className="btn-cta text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Créer ou Rejoindre un groupe</span>
        </button>
      </div>
    );
  }

  const montantCotisation = activeGroup.cycle_en_cours?.montant_cotisation || 0;
  const totalCagnotte = montantCotisation * (activeGroup.nombre_membres || 10);
  const isAdmin = activeGroup.role === 'admin_principal' || activeGroup.role === 'admin_secondaire';
  const upcomingTour = tours.find((t) => t.statut === 'en_attente') || tours[0] || null;

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* Alerte si le membre est suspecté pour impayés consécutifs (RF-15) */}
      {activeGroup.statut_membre === 'suspecte' && (
        <div className="p-3.5 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p className="leading-tight">
            <span className="font-bold">Attention :</span> Deux retards consécutifs ont été détectés sur votre compte. Veuillez régulariser vos cotisations.
          </p>
        </div>
      )}

      {/* 1. Carte Groupe avec dégradé bleu nuit signature (RF-443) */}
      <GroupCard
        group={activeGroup}
        membersUpToDateCount={membersUpToDate}
        totalMembersCount={activeGroup.nombre_membres || 10}
        onManageClick={isAdmin ? onOpenManageGroup : undefined}
      />

      {/* 2. Bannière du tour imminent (RF-11) */}
      <UpcomingTourBanner
        tour={upcomingTour}
        cagnotteMontant={totalCagnotte}
        isAdmin={isAdmin}
        onConfirmDistribution={onConfirmDistribution}
      />

      {/* 3. Roue de Rotation Signature de la tontine (RF-441) */}
      <RotationWheel tours={tours} cagnotteMontant={totalCagnotte} />

      {/* Bouton d'action rapide flottant CTA orange pour déclarer une cotisation (RF-06) */}
      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-30 pointer-events-none">
        <button
          onClick={onOpenDeclarePayment}
          className="btn-cta w-full shadow-2xl pointer-events-auto flex items-center justify-center gap-2 text-sm"
        >
          <ArrowUpRight className="w-5 h-5" />
          <span>Déclarer une cotisation</span>
        </button>
      </div>
    </div>
  );
};
