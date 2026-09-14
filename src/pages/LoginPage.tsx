import React, { useState } from 'react';
import { ArrowLeft, Phone, Lock, Sun, Moon } from 'lucide-react';
import { PinKeypad } from '../components/auth/PinKeypad';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface LoginPageProps {
  onBack: () => void;
  onSuccess: () => void;
  onNavigateToRegister: () => void;
}

/**
 * Page de connexion sécurisée par numéro Mobile Money et code PIN (RF-02)
 */
export const LoginPage: React.FC<LoginPageProps> = ({
  onBack,
  onSuccess,
  onNavigateToRegister
}) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [contact, setContact] = useState<string>('+225');
  const [pin, setPin] = useState<string>('');
  const [step, setStep] = useState<'contact' | 'pin'>('contact');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || contact.trim().length < 10) {
      setError('Veuillez renseigner un numéro Mobile Money ivoirien valide (+225).');
      return;
    }
    setError(null);
    setStep('pin');
  };

  const handlePinChange = async (newPin: string) => {
    setPin(newPin);
    if (newPin.length === 5) {
      setIsLoading(true);
      setError(null);
      const res = await login(contact, newPin);
      setIsLoading(false);

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Numéro ou code PIN incorrect.');
        setPin('');
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-bg text-text-main flex flex-col justify-between overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/20 dark:bg-primary/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto min-h-screen flex flex-col justify-between px-5 py-6 select-none">
        {/* En-tête */}
        <header className="flex items-center justify-between">
          <button
            onClick={step === 'pin' ? () => setStep('contact') : onBack}
            className="touch-target p-2 rounded-xl bg-surface border border-custom hover:bg-surface-2 text-text-dim hover:text-text-main transition-all shadow-sm"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-sm text-text-main">Connexion Sécurisée</span>
          <button
            onClick={toggleTheme}
            className="touch-target p-2 rounded-xl bg-surface border border-custom text-text-dim hover:text-text-main hover:bg-surface-2 transition-all shadow-sm"
            aria-label="Basculer le thème"
          >
            {theme === 'sombre' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
          </button>
        </header>

        {/* Corps principal */}
        <main className="my-auto py-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white font-display font-extrabold text-2xl shadow-lg shadow-primary/25 mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-text-main">Espace Membre</h2>
            <p className="text-xs text-text-dim mt-1.5 max-w-xs mx-auto">
              Accédez à vos cotisations et à l&apos;état de la cagnotte en toute sécurité.
            </p>
          </div>

          {error && (
            <div className="p-3.5 mb-6 rounded-2xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          {/* Étape 1 : Saisie du numéro Mobile Money */}
          {step === 'contact' && (
            <form onSubmit={handleContactSubmit} className="space-y-4 bg-surface/80 dark:bg-surface/60 backdrop-blur-md p-5 rounded-3xl border border-custom shadow-soft">
              <div>
                <label className="block text-xs font-bold text-text-dim mb-2 uppercase tracking-wide">
                  Numéro Mobile Money (Wave, MTN, etc.)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-text-dim pointer-events-none">
                    <Phone className="w-4 h-4 text-accent" />
                  </div>
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+2250700000000"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface-2 border border-custom text-base text-text-main focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none font-mono transition-all"
                  />
                </div>
              </div>

              <button type="submit" className="btn-cta w-full text-sm mt-4">
                Continuer vers le code PIN
              </button>
            </form>
          )}

          {/* Étape 2 : Saisie du code PIN via le clavier virtuel */}
          {step === 'pin' && (
            <div className="bg-surface/80 dark:bg-surface/60 backdrop-blur-md p-5 rounded-3xl border border-custom shadow-soft">
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 rounded-full bg-surface-2 text-text-main text-xs font-mono font-semibold border border-custom">
                  {contact}
                </span>
              </div>
              <PinKeypad
                pin={pin}
                onChange={handlePinChange}
                label="Saisissez votre code PIN à 5 chiffres"
              />
              {isLoading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-accent font-semibold animate-pulse">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span>Vérification sécurisée en cours...</span>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Pied de page */}
        <footer className="text-center pt-4 border-t border-custom">
          <p className="text-xs text-text-dim">
            Pas encore de compte ?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-accent font-bold hover:underline"
            >
              Créer mon compte
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
};
