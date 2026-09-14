import React, { useState } from 'react';
import { X, Plus, LogIn, Eye, EyeOff } from 'lucide-react';
import { useGroup } from '../../context/GroupContext';
import { PeriodiciteCycle } from '../../types';

interface CreateOrJoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal pour Créer un groupe ou Rejoindre un groupe existant
 */
export const CreateOrJoinGroupModal: React.FC<CreateOrJoinGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { createGroupAction, joinGroupAction } = useGroup();
  const [tab, setTab] = useState<'join' | 'create'>('join');

  // Création
  const [nomGroupe, setNomGroupe] = useState('');
  const [passwordCreate, setPasswordCreate] = useState('');
  const [showPasswordCreate, setShowPasswordCreate] = useState(false);
  const [periodicite, setPeriodicite] = useState<PeriodiciteCycle>('1mois');
  const [montant, setMontant] = useState<number>(25000);

  // Adhésion
  const [passwordJoin, setPasswordJoin] = useState('');
  const [showPasswordJoin, setShowPasswordJoin] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordJoin.trim() || passwordJoin.trim().length < 6) {
      setError('Le mot de passe de groupe doit comporter au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const res = await joinGroupAction(passwordJoin.trim());
    setIsLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Impossible de rejoindre ce groupe.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomGroupe.trim()) {
      setError('Veuillez renseigner le nom du groupe.');
      return;
    }
    if (!passwordCreate.trim() || passwordCreate.trim().length < 6) {
      setError('Le mot de passe du groupe doit comporter au moins 6 caractères.');
      return;
    }
    if (montant <= 0) {
      setError('Le montant de cotisation doit être supérieur à 0.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const res = await createGroupAction({
      nom_groupe: nomGroupe.trim(),
      mot_de_passe_groupe: passwordCreate.trim(),
      periodicite,
      montant_cotisation: montant
    });
    setIsLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Erreur lors de la création du groupe.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in">
      <div className="bg-surface border border-custom rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-text-main">
            Groupes de tontine
          </h2>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-full hover:bg-surface-2 text-text-dim"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bascule Onglets Rejoindre / Créer avec animations et design moderne */}
        <div className="flex rounded-2xl bg-surface-2/80 p-1.5 border border-custom text-xs mb-5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
              setTab('join');
              setError(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 select-none ${
              tab === 'join'
                ? 'bg-surface text-accent shadow-md border border-custom font-extrabold scale-[1.02]'
                : 'text-text-dim hover:text-text-main hover:bg-surface/50'
            }`}
          >
            <LogIn className={`w-4 h-4 transition-transform duration-200 ${tab === 'join' ? 'text-accent scale-110' : ''}`} />
            <span>Rejoindre</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
              setTab('create');
              setError(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 select-none ${
              tab === 'create'
                ? 'bg-surface text-accent shadow-md border border-custom font-extrabold scale-[1.02]'
                : 'text-text-dim hover:text-text-main hover:bg-surface/50'
            }`}
          >
            <Plus className={`w-4 h-4 transition-transform duration-200 ${tab === 'create' ? 'text-accent scale-110' : ''}`} />
            <span>Créer un groupe</span>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Formulaire 1 : Rejoindre un groupe existant */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1.5">
                Mot de passe d&apos;accès du groupe *
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPasswordJoin ? 'text' : 'password'}
                  required
                  minLength={6}
                  maxLength={32}
                  inputMode="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={passwordJoin}
                  onChange={(e) => setPasswordJoin(e.target.value)}
                  placeholder="Ex : Tontine@2026"
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-surface-2 border border-custom text-sm font-mono tracking-wider text-text-main focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordJoin(!showPasswordJoin)}
                  className="absolute right-3 p-1 text-text-dim hover:text-text-main transition-colors"
                  aria-label={showPasswordJoin ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPasswordJoin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-accent" />}
                </button>
              </div>
              <p className="text-[11px] text-text-dim mt-1.5 leading-relaxed">
                Renseignez le mot de passe fourni par l&apos;administrateur du groupe (chiffres, lettres et symboles autorisés).
              </p>
            </div>

            <button type="submit" disabled={isLoading} className="btn-cta w-full text-xs">
              {isLoading ? 'Vérification...' : 'Rejoindre la tontine'}
            </button>
          </form>
        )}

        {/* Formulaire 2 : Créer un groupe de tontine */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Nom du groupe *</label>
              <input
                type="text"
                required
                value={nomGroupe}
                onChange={(e) => setNomGroupe(e.target.value)}
                placeholder="Ex : Tontine Solidarité Cocody"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-xs font-medium text-text-main focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">
                Mot de passe d&apos;accès du groupe (chiffres, lettres, symboles) *
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPasswordCreate ? 'text' : 'password'}
                  required
                  minLength={6}
                  maxLength={32}
                  inputMode="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={passwordCreate}
                  onChange={(e) => setPasswordCreate(e.target.value)}
                  placeholder="Ex : Cocody@2026 ou 892348"
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-surface-2 border border-custom text-xs font-mono text-text-main focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordCreate(!showPasswordCreate)}
                  className="absolute right-3 p-1 text-text-dim hover:text-text-main transition-colors"
                  aria-label={showPasswordCreate ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPasswordCreate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-accent" />}
                </button>
              </div>
              <p className="text-[10px] text-text-dim mt-1">
                Min. 6 caractères. Vous pouvez combiner librement des chiffres, des lettres et des symboles (@, #, $, etc.).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-dim mb-1">Périodicité *</label>
                <select
                  value={periodicite}
                  onChange={(e) => setPeriodicite(e.target.value as PeriodiciteCycle)}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-xs text-text-main focus:border-accent focus:outline-none"
                >
                  <option value="1semaine">1 semaine</option>
                  <option value="2semaines">2 semaines</option>
                  <option value="1mois">1 mois</option>
                  <option value="2mois">2 mois</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-dim mb-1">Cotisation (FCFA) *</label>
                <input
                  type="number"
                  required
                  min={500}
                  value={montant}
                  onChange={(e) => setMontant(Number(e.target.value))}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-xs font-bold text-text-main focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-cta w-full text-xs mt-2">
              {isLoading ? 'Création en cours...' : 'Créer le groupe de tontine'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
