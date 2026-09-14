import React from 'react';
import { Transaction } from '../../types';
import { Badge } from '../common/Badge';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  onViewProof?: (url: string) => void;
  onValidateClick?: (tx: Transaction) => void;
  isAdmin?: boolean;
}

/**
 * Composant d'affichage d'une ligne de transaction financière (RF-08, RF-214)
 */
export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onViewProof,
  onValidateClick,
  isAdmin = false
}) => {
  const isDeposit = transaction.type === 'depot';
  const member = transaction.membre_groupe?.utilisateur;

  const getStatusBadge = () => {
    switch (transaction.statut) {
      case 'confirme':
        return (
          <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>
            Confirmé
          </Badge>
        );
      case 'en_attente':
        return (
          <Badge variant="warning" icon={<Clock className="w-3 h-3" />}>
            En attente
          </Badge>
        );
      case 'rejete':
        return (
          <Badge variant="danger" icon={<XCircle className="w-3 h-3" />}>
            Rejeté
          </Badge>
        );
      case 'reporte':
        return <Badge variant="neutral">Reporté</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-surface border border-custom rounded-2xl p-4 shadow-sm select-none">
      <div className="flex items-start justify-between gap-3">
        {/* Icône de type Dépôt / Retrait */}
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isDeposit
              ? 'bg-success/10 text-success'
              : 'bg-primary/10 text-primary dark:text-primary-light'
          }`}
        >
          {isDeposit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>

        {/* Détails de la transaction */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-sm text-text-main truncate">
              {isDeposit ? 'Cotisation' : 'Distribution Cagnotte'}
              {member && ` — ${member.prenom} ${member.nom}`}
            </h4>
            <span
              className={`font-display font-bold text-sm ${
                isDeposit ? 'text-success' : 'text-primary dark:text-primary-light'
              }`}
            >
              {isDeposit ? '+' : '-'}
              {transaction.montant.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-text-dim">
            <span className="font-medium font-mono">{transaction.moyen_paiement}</span>
            <span>•</span>
            <span className="truncate font-mono">{transaction.numero_tx_operateur}</span>
          </div>

          <p className="text-[10px] text-text-dim mt-0.5">
            {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>

          {/* Motif de rejet visible par le membre (RF-216) */}
          {transaction.statut === 'rejete' && transaction.motif_rejet && (
            <div className="mt-2 p-2 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[11px]">
              <span className="font-semibold">Motif du rejet : </span>
              {transaction.motif_rejet}
            </div>
          )}
        </div>
      </div>

      {/* Barre d'actions et statut */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-custom">
        <div>{getStatusBadge()}</div>

        <div className="flex items-center gap-2">
          {transaction.preuve_capture_url && onViewProof && (
            <button
              onClick={() => onViewProof(transaction.preuve_capture_url!)}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 touch-target px-2 py-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Voir reçu</span>
            </button>
          )}

          {isAdmin && transaction.statut === 'en_attente' && onValidateClick && (
            <button
              onClick={() => onValidateClick(transaction)}
              className="text-xs font-bold text-white bg-primary hover:bg-primary-light px-3 py-1 rounded-xl shadow-sm transition-colors"
            >
              Vérifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
