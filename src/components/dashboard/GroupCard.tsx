import React from 'react';
import { Groupe } from '../../types';
import { Users, Calendar, Shield, Sparkles } from 'lucide-react';

interface GroupCardProps {
  group: Groupe;
  membersUpToDateCount?: number;
  totalMembersCount?: number;
  onManageClick?: () => void;
}

/**
 * Carte de groupe avec dégradé bleu nuit signature (Section 11.4 & RF-443)
 * Présente la cagnotte globale, le compteur de membres à jour (RF-18) et le cycle actif
 */
export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  membersUpToDateCount = 0,
  totalMembersCount = 10,
  onManageClick
}) => {
  const montantCotisation = group.cycle_en_cours?.montant_cotisation || 0;
  const cagnotteTotale = montantCotisation * (group.nombre_membres || totalMembersCount);
  const numeroCycle = group.cycle_en_cours?.numero_cycle || 1;

  const getPeriodiciteLabel = (p: string) => {
    switch (p) {
      case '1semaine': return 'Hebdomadaire';
      case '2semaines': return 'Bi-hebdomadaire';
      case '1mois': return 'Mensuelle';
      case '2mois': return 'Bimestrielle';
      default: return p;
    }
  };

  const isAdmin = group.role === 'admin_principal' || group.role === 'admin_secondaire';

  return (
    <div className="card-gradient-primary rounded-3xl p-5 shadow-xl select-none relative overflow-hidden">
      {/* Motifs géométriques décoratifs d'arrière-plan */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute right-12 -bottom-10 w-24 h-24 rounded-full bg-accent/15 pointer-events-none blur-xl" />

      {/* En-tête de la carte */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold backdrop-blur-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" />
            <span>Cycle {numeroCycle}</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/80 text-[10px] font-medium">
            {getPeriodiciteLabel(group.periodicite)}
          </span>
        </div>

        {isAdmin && onManageClick && (
          <button
            onClick={onManageClick}
            className="text-[11px] font-bold text-accent bg-accent/15 hover:bg-accent/25 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            <span>Gérer</span>
          </button>
        )}
      </div>

      {/* Montant de la cagnotte */}
      <div className="mb-5 relative z-10">
        <p className="text-xs font-medium text-white/70 mb-1">Cagnotte totale du tour</p>
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
          {cagnotteTotale.toLocaleString('fr-FR')}{' '}
          <span className="text-sm font-bold text-accent">FCFA</span>
        </h2>
        <p className="text-[11px] text-white/60 mt-0.5">
          Cotisation : {montantCotisation.toLocaleString('fr-FR')} FCFA / membre
        </p>
      </div>

      {/* Pied de carte : Compteur de membres à jour (RF-18, RF-295) */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center gap-1.5 text-white/90">
          <Users className="w-4 h-4 text-accent" />
          <span className="font-semibold">Membres à jour :</span>
          <span className="font-display font-bold text-accent">
            {membersUpToDateCount}/{group.nombre_membres || totalMembersCount}
          </span>
        </div>

        <div className="flex items-center gap-1 text-white/70 text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-white/50" />
          <span>{group.periodicite}</span>
        </div>
      </div>
    </div>
  );
};
