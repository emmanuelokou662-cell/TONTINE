import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { registerPushNotifications } from '../services/pushClient';
import { apiFetch } from '../services/apiClient';
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  KeyRound,
  Users,
  LogOut,
  Check
} from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
  onOpenCreateOrJoin: () => void;
}

/**
 * Menu Paramètres de l'application (RF-24)
 * Gestion du compte, multi-groupes, sécurité PIN et thème
 */
export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, onOpenCreateOrJoin }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [pushStatus, setPushStatus] = useState<'idle' | 'success' | 'denied'>('idle');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Formulaire PIN (RF-28)
  const [ancienPin, setAncienPin] = useState('');
  const [nouveauPin, setNouveauPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleEnablePush = async () => {
    const success = await registerPushNotifications();
    setPushStatus(success ? 'success' : 'denied');
    setTimeout(() => setPushStatus('idle'), 3500);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nouveauPin !== confirmPin) {
      setPinMessage({ text: 'Le nouveau PIN et sa confirmation ne correspondent pas.', isError: true });
      return;
    }
    const res = await apiFetch('/auth/change-pin', {
      method: 'PUT',
      body: JSON.stringify({
        ancien_pin: ancienPin,
        nouveau_pin: nouveauPin,
        confirmation_nouveau_pin: confirmPin
      })
    });

    if (res.success) {
      setPinMessage({ text: 'Code PIN modifié avec succès !', isError: false });
      setTimeout(() => {
        setShowPinModal(false);
        setPinMessage(null);
        setAncienPin('');
        setNouveauPin('');
        setConfirmPin('');
      }, 1500);
    } else {
      setPinMessage({ text: res.error?.message || 'Erreur lors du changement de PIN.', isError: true });
    }
  };

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
          <h2 className="font-display font-extrabold text-xl text-text-main">Paramètres</h2>
          <p className="text-xs text-text-dim">Gérer votre compte et vos préférences</p>
        </div>
      </div>

      {/* Section Préférences Générales */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-text-dim px-2 uppercase tracking-wider">Préférences</h3>
        
        {/* Thème Clair / Sombre (RF-29) */}
        <button
          onClick={toggleTheme}
          className="w-full p-4 rounded-2xl bg-surface border border-custom flex items-center justify-between shadow-sm hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              {theme === 'sombre' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-xs text-text-main">Thème de l&apos;application</p>
              <p className="text-[11px] text-text-dim">Actuellement : {theme === 'sombre' ? 'Mode Sombre' : 'Mode Clair'}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-accent">Basculer</span>
        </button>

        {/* Notifications Push Web (RF-88) */}
        <button
          onClick={handleEnablePush}
          className="w-full p-4 rounded-2xl bg-surface border border-custom flex items-center justify-between shadow-sm hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary dark:text-primary-light">
              <Bell className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-xs text-text-main">Notifications Push Web</p>
              <p className="text-[11px] text-text-dim">Recevoir les rappels de cotisation et tours</p>
            </div>
          </div>
          {pushStatus === 'success' ? (
            <span className="text-xs font-bold text-success flex items-center gap-1">
              <Check className="w-4 h-4" /> Activé
            </span>
          ) : (
            <span className="text-xs font-bold text-accent">Activer</span>
          )}
        </button>
      </div>

      {/* Section Groupes & Multi-tontine (RF-26) */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold text-text-dim px-2 uppercase tracking-wider">Groupes</h3>

        <button
          onClick={onOpenCreateOrJoin}
          className="w-full p-4 rounded-2xl bg-surface border border-custom flex items-center justify-between shadow-sm hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-xs text-text-main">Intégrer un autre groupe</p>
              <p className="text-[11px] text-text-dim">Participer à une nouvelle tontine</p>
            </div>
          </div>
          <span className="text-xs font-bold text-accent">Ouvrir</span>
        </button>
      </div>

      {/* Section Sécurité du Compte */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold text-text-dim px-2 uppercase tracking-wider">Sécurité</h3>

        {/* Changer le PIN (RF-28) */}
        <button
          onClick={() => setShowPinModal(true)}
          className="w-full p-4 rounded-2xl bg-surface border border-custom flex items-center justify-between shadow-sm hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary dark:text-primary-light">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-xs text-text-main">Changer le code PIN</p>
              <p className="text-[11px] text-text-dim">Modifier votre code à 5 chiffres</p>
            </div>
          </div>
          <span className="text-xs font-bold text-accent">Modifier</span>
        </button>
      </div>

      {/* Déconnexion */}
      <div className="pt-4">
        <button
          onClick={logout}
          className="w-full p-4 rounded-2xl bg-danger/5 border border-danger/20 flex items-center justify-center gap-2 text-danger font-display font-bold text-xs hover:bg-danger/10 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter de la plateforme</span>
        </button>
      </div>

      {/* Modal Changement de PIN (RF-28) */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-custom rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-base text-text-main">Modifier votre code PIN</h3>
            
            {pinMessage && (
              <p className={`text-xs font-semibold ${pinMessage.isError ? 'text-danger' : 'text-success'}`}>
                {pinMessage.text}
              </p>
            )}

            <form onSubmit={handleChangePin} className="space-y-3">
              <input
                type="password"
                maxLength={5}
                required
                value={ancienPin}
                onChange={(e) => setAncienPin(e.target.value)}
                placeholder="Ancien code PIN (5 chiffres)"
                className="w-full p-2.5 rounded-xl bg-surface-2 border border-custom text-xs font-mono text-center tracking-widest text-text-main"
              />
              <input
                type="password"
                maxLength={5}
                required
                value={nouveauPin}
                onChange={(e) => setNouveauPin(e.target.value)}
                placeholder="Nouveau code PIN (5 chiffres)"
                className="w-full p-2.5 rounded-xl bg-surface-2 border border-custom text-xs font-mono text-center tracking-widest text-text-main"
              />
              <input
                type="password"
                maxLength={5}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirmer nouveau PIN"
                className="w-full p-2.5 rounded-xl bg-surface-2 border border-custom text-xs font-mono text-center tracking-widest text-text-main"
              />

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="py-2 rounded-xl bg-surface-2 border border-custom text-xs font-bold text-text-dim"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-cta text-xs py-2"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
