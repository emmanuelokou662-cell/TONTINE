import React from 'react';
import { MembreGroupe } from '../../types';
import { Badge } from '../common/Badge';
import { Phone, ShieldCheck, BellRing, MoreVertical } from 'lucide-react';
import { formatMediaUrl } from '../../services/apiClient';

interface MemberCardProps {
  member: MembreGroupe;
  isAdmin?: boolean;
  onRemindClick?: (member: MembreGroupe) => void;
  onManageClick?: (member: MembreGroupe) => void;
}

/**
 * Composant Carte Membre (RF-20, RF-306)
 * Affiche la photo, le nom, le rôle, le statut de cotisation et les actions de relance (RF-19)
 */
export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isAdmin = false,
  onRemindClick,
  onManageClick
}) => {
  const isUpToDate = member.derniere_cotisation_statut === 'confirme';
  const isSuspected = member.statut === 'suspecte';

  return (
    <div className="bg-surface border border-custom rounded-2xl p-3.5 shadow-sm select-none">
      <div className="flex items-center justify-between">
        {/* Photo et identité */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-full bg-surface-2 border border-custom flex-shrink-0 overflow-hidden flex items-center justify-center">
            {member.photo_profil_url ? (
              <img
                src={formatMediaUrl(member.photo_profil_url)}
                alt={member.prenom}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fb = (e.target as HTMLImageElement).nextElementSibling;
                  if (fb) (fb as HTMLElement).style.display = 'flex';
                }}
              />
            ) : null}
            <div
              style={{ display: member.photo_profil_url ? 'none' : 'flex' }}
              className="w-full h-full items-center justify-center bg-primary/10 text-primary font-bold text-xs"
            >
              {member.prenom?.[0] || 'M'}
            </div>
            {member.role !== 'membre' && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-white p-0.5 rounded-full shadow-sm">
                <ShieldCheck className="w-3 h-3" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-display font-bold text-xs text-text-main truncate">
                {member.prenom} {member.nom}
              </h4>
              {member.role === 'admin_principal' && (
                <span className="text-[9px] font-bold bg-primary/15 text-primary dark:text-primary-light px-1.5 py-0.2 rounded-md">
                  Admin 1
                </span>
              )}
              {member.role === 'admin_secondaire' && (
                <span className="text-[9px] font-bold bg-primary-light/15 text-primary-light px-1.5 py-0.2 rounded-md">
                  Admin 2
                </span>
              )}
            </div>

            <p className="text-[11px] text-text-dim flex items-center gap-1 font-mono mt-0.5">
              <Phone className="w-3 h-3 text-text-dim" />
              <span>{member.contact_paiement}</span>
            </p>
          </div>
        </div>

        {/* Badges de statut de cotisation (RF-18, RF-294) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSuspected ? (
            <Badge variant="danger" size="sm">
              Suspecté (2 retards)
            </Badge>
          ) : isUpToDate ? (
            <Badge variant="success" size="sm">
              À jour ✅
            </Badge>
          ) : (
            <Badge variant="warning" size="sm">
              En attente ⏳
            </Badge>
          )}

          {/* Action de relance manuelle pour l'admin (RF-19) */}
          {isAdmin && !isUpToDate && onRemindClick && (
            <button
              onClick={() => onRemindClick(member)}
              className="p-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent transition-colors touch-target"
              aria-label="Relancer ce membre"
              title="Envoyer un rappel push"
            >
              <BellRing className="w-4 h-4" />
            </button>
          )}

          {/* Menu d'actions administrateur */}
          {isAdmin && onManageClick && (
            <button
              onClick={() => onManageClick(member)}
              className="p-1.5 rounded-xl hover:bg-surface-2 text-text-dim transition-colors touch-target"
              aria-label="Gérer ce membre"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
