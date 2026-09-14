import React, { useState } from 'react';
import { Tour } from '../../types';
import { User, Award } from 'lucide-react';

interface RotationWheelProps {
  tours: Tour[];
  cagnotteMontant: number;
}

/**
 * Roue de rotation dynamique de la tontine — Élément visuel signature (RF-441)
 * Illustre le cycle complet, le bénéficiaire actuel et la progression des tours
 */
export const RotationWheel: React.FC<RotationWheelProps> = ({ tours, cagnotteMontant }) => {
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  if (!tours || tours.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-surface border border-custom text-center text-text-dim text-xs">
        Aucun tour de rotation configuré pour ce cycle.
      </div>
    );
  }

  // Tour actuellement en attente le plus prioritaire (bénéficiaire actif)
  const activeTour = tours.find((t) => t.statut === 'en_attente') || tours[0];
  const displayedTour = tours.find((t) => t.id_tour === selectedTourId) || activeTour;

  const totalTours = tours.length;
  const radius = 100;
  const center = 130;

  return (
    <div className="flex flex-col items-center bg-surface border border-custom rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className="font-display font-bold text-sm text-text-main flex items-center gap-1.5">
          <Award className="w-4 h-4 text-accent" />
          <span>Roue de Rotation du Cycle</span>
        </h3>
        <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
          Tour {displayedTour.ordre_passage}/{totalTours}
        </span>
      </div>

      {/* Roue SVG interactive */}
      <div className="relative w-[260px] h-[260px] my-2 select-none">
        <svg className="w-full h-full" viewBox="0 0 260 260">
          {/* Cercle d'arrière-plan avec pointillés */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="6 6"
            className="text-border-custom opacity-60"
          />

          {/* Points des membres positionnés sur le cercle */}
          {tours.map((tour, idx) => {
            const angle = (idx / totalTours) * 2 * Math.PI - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);

            const isCurrent = tour.id_tour === displayedTour.id_tour;
            const isDistributed = tour.statut === 'distribue';
            const isSkipped = tour.statut === 'saute';

            let fillColor = '#EEF2F6';
            let strokeColor = '#E3E8EE';

            if (isDistributed) {
              fillColor = '#2E9E5B';
              strokeColor = '#2E9E5B';
            } else if (isSkipped) {
              fillColor = '#C0392B';
              strokeColor = '#C0392B';
            } else if (isCurrent) {
              fillColor = '#E8833A';
              strokeColor = '#FFFFFF';
            }

            return (
              <g
                key={tour.id_tour}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedTourId(tour.id_tour)}
              >
                {/* Anneau de halo pour le bénéficiaire sélectionné */}
                {isCurrent && (
                  <circle
                    cx={x}
                    cy={y}
                    r="20"
                    fill="#E8833A"
                    opacity="0.25"
                    className="animate-pulse"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  className="shadow-md"
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={isDistributed || isCurrent || isSkipped ? '#FFFFFF' : '#1C2530'}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="Sora, sans-serif"
                >
                  {tour.ordre_passage}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Carte centrale affichant les détails du tour sélectionné */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-accent p-0.5 mb-1 shadow-sm overflow-hidden bg-surface-2 flex items-center justify-center">
            {displayedTour.membre_groupe?.utilisateur.photo_profil_url ? (
              <img
                src={displayedTour.membre_groupe.utilisateur.photo_profil_url}
                alt="Bénéficiaire"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User className="w-6 h-6 text-text-dim" />
            )}
          </div>
          <p className="font-display font-bold text-xs text-text-main truncate max-w-[120px]">
            {displayedTour.membre_groupe?.utilisateur.prenom} {displayedTour.membre_groupe?.utilisateur.nom}
          </p>
          <p className="text-[10px] text-text-dim font-medium">
            {new Date(displayedTour.date_prevue).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short'
            })}
          </p>
          <span className="text-[10px] font-bold text-accent mt-0.5">
            {cagnotteMontant.toLocaleString('fr-FR')} FCFA
          </span>
        </div>
      </div>

      {/* Légende rapide des statuts sous la roue */}
      <div className="flex items-center justify-center gap-4 mt-2 pt-3 border-t border-custom w-full text-[11px] text-text-dim">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />
          <span>Distribué</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
          <span>Bénéficiaire</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-surface-2 border border-custom inline-block" />
          <span>À venir</span>
        </span>
      </div>
    </div>
  );
};
