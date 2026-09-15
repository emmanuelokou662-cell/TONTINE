import React, { useState, useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import { TourOrderList } from '../components/members/TourOrderList';
import { MembreGroupe, PeriodiciteCycle } from '../types';
import { apiFetch } from '../services/apiClient';
import { ArrowLeft, Shield, DollarSign, Key, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ManageGroupPageProps {
  onBack: () => void;
}

const PERIODICITE_LABELS: Record<PeriodiciteCycle, string> = {
  '1jour': '1 jour',
  '2jours': '2 jours',
  '3jours': '3 jours',
  '4jours': '4 jours',
  '5jours': '5 jours (Max)',
  '1semaine': '1 semaine (7 jours)',
  '2semaines': '2 semaines (14 jours)',
  '1mois': '1 mois (30 jours)',
  '2mois': '2 mois (60 jours)',
  '1an': '1 an (Annuel)'
};

/**
 * Page d'Administration et Paramétrage du Groupe de Tontine (RF-09, RF-21, RF-25)
 */
export const ManageGroupPage: React.FC<ManageGroupPageProps> = ({ onBack }) => {
  const { activeGroup, refreshGroups } = useGroup();
  const [members, setMembers] = useState<MembreGroupe[]>([]);
  const [newAmount, setNewAmount] = useState<number>(0);
  const [selectedPeriodicite, setSelectedPeriodicite] = useState<PeriodiciteCycle>('1mois');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'order' | 'settings'>('order');

  useEffect(() => {
    if (activeGroup) {
      setNewAmount(activeGroup.cycle_en_cours?.montant_cotisation || 0);
      setSelectedPeriodicite(activeGroup.periodicite || '1mois');
      loadMembers();
    }
  }, [activeGroup?.id_groupe, activeGroup?.periodicite, activeGroup?.cycle_en_cours?.montant_cotisation]);

  const loadMembers = async () => {
    if (!activeGroup) return;
    try {
      const res = await apiFetch<MembreGroupe[]>(`/groups/${activeGroup.id_groupe}/members`);
      if (res.success && res.data) {
        setMembers(res.data);
      }
    } catch (e) {
      console.warn('Erreur chargement membres :', e);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || newAmount <= 0) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      // 1. Mise à jour de la configuration globale du groupe (périodicité et montant)
      const resGroup = await apiFetch(`/groups/${activeGroup.id_groupe}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          periodicite: selectedPeriodicite,
          montant_cotisation: newAmount
        })
      });

      // 2. Si un cycle est en cours, actualiser également les paramètres du cycle
      if (activeGroup.cycle_en_cours) {
        await apiFetch(`/transactions/cycle/${activeGroup.cycle_en_cours.id_cycle}/complete`, {
          method: 'POST',
          body: JSON.stringify({ nouveau_montant: newAmount, periodicite: selectedPeriodicite })
        });
      }

      setIsSaving(false);
      if (resGroup.success || !resGroup.error) {
        setSaveSuccess(true);
        await refreshGroups();
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setSaveError(resGroup.error?.message || 'Erreur lors de la mise à jour des paramètres.');
      }
    } catch (e: any) {
      setIsSaving(false);
      setSaveError(e?.message || 'Erreur de connexion lors de la sauvegarde.');
    }
  };

  if (!activeGroup) return null;

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="touch-target p-2 rounded-full hover:bg-surface-2 text-text-dim"
          aria-label="Retour"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="font-display font-extrabold text-xl text-text-main flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary dark:text-primary-light" />
            <span>Gestion de la tontine</span>
          </h2>
          <p className="text-xs text-text-dim">{activeGroup.nom_groupe}</p>
        </div>
      </div>

      {/* Onglets de gestion */}
      <div className="flex rounded-2xl bg-surface-2/80 p-1.5 border border-custom text-xs shadow-inner">
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
            setActiveTab('order');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
            activeTab === 'order'
              ? 'bg-surface text-accent shadow-md border border-custom font-extrabold scale-[1.02]'
              : 'text-text-dim hover:text-text-main hover:bg-surface/50'
          }`}
        >
          Ordre de passage
        </button>
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
            setActiveTab('settings');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
            activeTab === 'settings'
              ? 'bg-surface text-accent shadow-md border border-custom font-extrabold scale-[1.02]'
              : 'text-text-dim hover:text-text-main hover:bg-surface/50'
          }`}
        >
          Paramètres du cycle
        </button>
      </div>

      {/* Onglet 1 : Ordonnancement des tours */}
      {activeTab === 'order' && activeGroup.cycle_en_cours && (
        <div className="bg-surface border border-custom rounded-3xl p-4 shadow-sm">
          <TourOrderList
            cycleId={activeGroup.cycle_en_cours.id_cycle}
            members={members}
            onSuccess={() => alert('Ordre de passage mis à jour avec succès !')}
          />
        </div>
      )}

      {/* Onglet 2 : Paramètres, Délais de retrait et Montant de cotisation */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <form onSubmit={handleUpdateSettings} className="bg-surface border border-custom rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* 1. Délais de retrait / Périodicité du cycle */}
            <div>
              <h3 className="font-display font-bold text-sm text-text-main flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-accent" />
                <span>Délai de retrait (Fin de cycle & Tours)</span>
              </h3>
              <p className="text-xs text-text-dim mb-3">
                Sélectionnez l&apos;intervalle entre chaque tour de redistribution de la cagnotte.
              </p>

              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-text-dim">Périodicité des tours</label>
                <select
                  value={selectedPeriodicite}
                  onChange={(e) => setSelectedPeriodicite(e.target.value as PeriodiciteCycle)}
                  className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-custom text-sm font-semibold text-text-main focus:border-accent focus:outline-none"
                >
                  <optgroup label="Jours (1 à 5 jours max)">
                    <option value="1jour">1 jour</option>
                    <option value="2jours">2 jours</option>
                    <option value="3jours">3 jours</option>
                    <option value="4jours">4 jours</option>
                    <option value="5jours">5 jours (Max)</option>
                  </optgroup>
                  <optgroup label="Semaines">
                    <option value="1semaine">1 semaine (7 jours)</option>
                    <option value="2semaines">2 semaines (14 jours)</option>
                  </optgroup>
                  <optgroup label="Mois">
                    <option value="1mois">1 mois (30 jours)</option>
                    <option value="2mois">2 mois (60 jours)</option>
                  </optgroup>
                  <optgroup label="Année">
                    <option value="1an">1 an (Annuel)</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <hr className="border-custom my-2" />

            {/* 2. Montant de la cotisation */}
            <div>
              <h3 className="font-display font-bold text-sm text-text-main flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-accent" />
                <span>Montant de la cotisation</span>
              </h3>
              <p className="text-xs text-text-dim mb-2.5">
                Le montant de cotisation est identique pour tous les membres et applicable pour le cycle.
              </p>

              <div>
                <label className="block text-xs font-semibold text-text-dim mb-1">Montant par membre (FCFA)</label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-base font-bold text-text-main focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Paramètres et délai de retrait mis à jour avec succès !</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="btn-cta w-full text-xs font-bold"
            >
              {isSaving ? 'Enregistrement en cours...' : 'Enregistrer les paramètres du cycle'}
            </button>
          </form>

          {/* Informations sur le groupe */}
          <div className="bg-surface border border-custom rounded-3xl p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-display font-bold text-sm text-text-main flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" />
              <span>Informations d&apos;accès</span>
            </h3>
            <div className="p-3 rounded-2xl bg-surface-2 border border-custom space-y-1.5">
              <p className="text-text-dim">
                Périodicité active : <span className="font-bold text-text-main">{PERIODICITE_LABELS[activeGroup.periodicite] || activeGroup.periodicite}</span>
              </p>
              <p className="text-text-dim">
                Nombre de membres : <span className="font-bold text-text-main">{members.length}/10</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
