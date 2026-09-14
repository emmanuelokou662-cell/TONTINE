import React, { useState, useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import { TourOrderList } from '../components/members/TourOrderList';
import { MembreGroupe } from '../types';
import { apiFetch } from '../services/apiClient';
import { ArrowLeft, Shield, DollarSign, Key } from 'lucide-react';

interface ManageGroupPageProps {
  onBack: () => void;
}

/**
 * Page d'Administration et Paramétrage du Groupe de Tontine (RF-09, RF-21, RF-25)
 */
export const ManageGroupPage: React.FC<ManageGroupPageProps> = ({ onBack }) => {
  const { activeGroup, refreshGroups } = useGroup();
  const [members, setMembers] = useState<MembreGroupe[]>([]);
  const [newAmount, setNewAmount] = useState<number>(0);
  const [isUpdatingAmount, setIsUpdatingAmount] = useState<boolean>(false);
  const [amountSuccess, setAmountSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'order' | 'settings'>('order');

  useEffect(() => {
    if (activeGroup) {
      setNewAmount(activeGroup.cycle_en_cours?.montant_cotisation || 0);
      loadMembers();
    }
  }, [activeGroup?.id_groupe]);

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

  const handleUpdateAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup?.cycle_en_cours || newAmount <= 0) return;

    setIsUpdatingAmount(true);
    setAmountSuccess(false);

    try {
      const res = await apiFetch(`/transactions/cycle/${activeGroup.cycle_en_cours.id_cycle}/complete`, {
        method: 'POST',
        body: JSON.stringify({ nouveau_montant: newAmount })
      });

      setIsUpdatingAmount(false);
      if (res.success) {
        setAmountSuccess(true);
        await refreshGroups();
        setTimeout(() => setAmountSuccess(false), 3000);
      }
    } catch (e) {
      setIsUpdatingAmount(false);
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

      {/* Onglet 2 : Paramètres et Montant de cotisation */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Formulaire de fixation du montant */}
          <form onSubmit={handleUpdateAmount} className="bg-surface border border-custom rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="font-display font-bold text-sm text-text-main flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <span>Montant de la cotisation</span>
            </h3>
            <p className="text-xs text-text-dim">
              Le montant de cotisation est identique pour tous les membres et applicable pour le cycle.
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Montant par membre (FCFA)</label>
              <input
                type="number"
                min={500}
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-base font-bold text-text-main focus:border-accent focus:outline-none"
              />
            </div>

            {amountSuccess && (
              <p className="text-xs font-semibold text-success">Montant mis à jour avec succès !</p>
            )}

            <button
              type="submit"
              disabled={isUpdatingAmount}
              className="btn-cta w-full text-xs"
            >
              {isUpdatingAmount ? 'Enregistrement...' : 'Enregistrer le nouveau montant'}
            </button>
          </form>

          {/* Informations sur le groupe */}
          <div className="bg-surface border border-custom rounded-3xl p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-display font-bold text-sm text-text-main flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" />
              <span>Informations d&apos;accès</span>
            </h3>
            <div className="p-3 rounded-2xl bg-surface-2 border border-custom space-y-1">
              <p className="text-text-dim">Périodicité des tours : <span className="font-bold text-text-main">{activeGroup.periodicite}</span></p>
              <p className="text-text-dim">Nombre de membres : <span className="font-bold text-text-main">{members.length}/10</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
