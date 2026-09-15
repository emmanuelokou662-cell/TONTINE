import React from 'react';
import { Tour } from '../../types';
import { Calendar, Phone, CheckCircle } from 'lucide-react';
import { formatMediaUrl } from '../../services/apiClient';

interface UpcomingTourBannerProps {
  tour: Tour | null;
  cagnotteMontant: number;
  isAdmin?: boolean;
  onConfirmDistribution?: (tourId: string) => void;
}

/**
 * Bannière d'information sur le tour de distribution imminent (RF-11, RF-238)
 */
export const UpcomingTourBanner: React.FC<UpcomingTourBannerProps> = ({
  tour,
  cagnotteMontant,
  isAdmin = false,
  onConfirmDistribution
}) => {
  if (!tour) return null;

  const benef = tour.membre_groupe?.utilisateur;
  const tourDate = new Date(tour.date_prevue);
  const now = new Date();
  const diffDays = Math.ceil((tourDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isDistributed = tour.statut === 'distribue';

  return (
    <div className="bg-surface border border-custom rounded-3xl p-4 shadow-sm select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-dim flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <span>Prochain tour de réception</span>
        </span>

        {diffDays > 0 ? (
          <span className="text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
            Dans {diffDays} jour{diffDays > 1 ? 's' : ''}
          </span>
        ) : diffDays === 0 ? (
          <span className="text-[11px] font-bold text-warning bg-warning/15 px-2 py-0.5 rounded-full animate-pulse">
            Aujourd&apos;hui
          </span>
        ) : (
          <span className="text-[11px] font-bold text-danger bg-danger/15 px-2 py-0.5 rounded-full">
            Échu ({Math.abs(diffDays)} j)
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Photo du bénéficiaire */}
        <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-custom overflow-hidden flex-shrink-0 flex items-center justify-center">
          {benef?.photo_profil_url ? (
            <img
              src={formatMediaUrl(benef.photo_profil_url)}
              alt="Bénéficiaire"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fb = (e.target as HTMLImageElement).nextElementSibling;
                if (fb) (fb as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{ display: benef?.photo_profil_url ? 'none' : 'flex' }}
            className="w-full h-full items-center justify-center bg-primary/10 text-primary font-bold text-sm"
          >
            {benef?.prenom?.[0] || 'B'}
          </div>
        </div>

        {/* Détails du bénéficiaire */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-text-main truncate">
            {benef?.prenom} {benef?.nom}
          </p>
          <p className="text-xs text-text-dim flex items-center gap-1 font-mono">
            <Phone className="w-3 h-3 text-text-dim" />
            <span>{benef?.contact_paiement}</span>
          </p>
          <p className="text-xs font-bold text-accent mt-0.5">
            Cagnotte : {cagnotteMontant.toLocaleString('fr-FR')} FCFA
          </p>
        </div>
      </div>

      {/* Action Admin : Confirmer le versement (RF-11) */}
      {isAdmin && !isDistributed && onConfirmDistribution && (
        <button
          onClick={() => onConfirmDistribution(tour.id_tour)}
          className="w-full mt-3 py-2 px-3 rounded-xl bg-primary hover:bg-primary-light text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Confirmer le versement de la cagnotte</span>
        </button>
      )}

      {isDistributed && (
        <div className="mt-3 p-2 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center justify-center gap-1.5">
          <CheckCircle className="w-4 h-4" />
          <span>Cagnotte versée et confirmée</span>
        </div>
      )}
    </div>
  );
};
