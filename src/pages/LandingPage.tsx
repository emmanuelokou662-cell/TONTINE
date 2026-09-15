import React, { useState, useEffect } from 'react';
import { ShieldCheck, WifiOff, Bell, ArrowRight, Sun, Moon, Sparkles, CheckCircle2, Smartphone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onNavigateToRegister: () => void;
  onNavigateToLogin: () => void;
}

/**
 * Page d'accueil / Landing Page PWA Ultra-Moderne & Design FinTech (RF-00)
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToRegister,
  onNavigateToLogin
}) => {
  const { theme, toggleTheme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="relative min-h-screen bg-bg text-text-main flex flex-col justify-between overflow-hidden">
      {/* Effets d'éclairage d'arrière-plan Mesh / Glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-primary/20 dark:bg-primary/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-40px] w-[250px] h-[250px] bg-accent/15 rounded-full blur-[90px] pointer-events-none" />

      {/* Conteneur responsive centré (Mobile-first mais superbe sur grand écran) */}
      <div className="relative z-10 w-full max-w-md mx-auto min-h-screen flex flex-col justify-between px-5 py-6">
        
        {/* En-tête avec Logo, Thème Switcher et Bouton Connexion */}
        <header className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo Tontine+"
              className="w-11 h-11 rounded-2xl object-contain bg-white shadow-md shadow-primary/20 p-1 border border-custom"
            />
            <div>
              <h1 className="font-display font-extrabold text-xl leading-tight tracking-tight text-primary dark:text-primary-light">
                Tontine<span className="text-accent">+</span>
              </h1>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-bold">PWA Côte d&apos;Ivoire</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton bascule Thème Clair / Sombre */}
            <button
              onClick={toggleTheme}
              className="touch-target p-2 rounded-xl bg-surface border border-custom text-text-dim hover:text-text-main hover:bg-surface-2 transition-all shadow-sm"
              aria-label="Basculer le thème"
            >
              {theme === 'sombre' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            {/* Bouton Se connecter rapide */}
            <button
              onClick={onNavigateToLogin}
              className="text-xs font-bold text-accent hover:text-accent-hover bg-accent/10 dark:bg-accent/15 px-3.5 py-2 rounded-xl border border-accent/20 transition-all active:scale-95"
            >
              Se connecter
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="my-auto py-6">
          {/* Badge animé */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 dark:bg-accent/20 border border-accent/25 text-accent font-semibold text-xs mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Épargne & Tontine Digitale</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-main leading-[1.2] mb-3">
            Gérez votre tontine en toute <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400">transparence</span>.
          </h2>

          <p className="text-sm text-text-dim leading-relaxed mb-6">
            Suivez vos cotisations Mobile Money (Wave, MTN, Orange, Moov), organisez les tours de rotation et recevez vos cagnottes en toute sécurité, même sans connexion.
          </p>

          {/* 3 Cartes d'arguments clés avec glassmorphism & icônes riches */}
          <div className="space-y-3 mb-7">
            <div className="group flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface/80 dark:bg-surface/60 backdrop-blur-md border border-custom shadow-soft transition-all duration-200 hover:border-primary/40 hover:scale-[1.01]">
              <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex-shrink-0 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-text-main">Preuves & Traçabilité légale</h3>
                <p className="text-xs text-text-dim leading-snug mt-0.5">Chaque transaction est validée et archivée avec reçu officiel.</p>
              </div>
            </div>

            <div className="group flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface/80 dark:bg-surface/60 backdrop-blur-md border border-custom shadow-soft transition-all duration-200 hover:border-accent/40 hover:scale-[1.01]">
              <div className="p-2.5 rounded-xl bg-accent/10 dark:bg-accent/20 text-accent flex-shrink-0 group-hover:scale-110 transition-transform">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-text-main">Fonctionne 100% Hors-Ligne</h3>
                <p className="text-xs text-text-dim leading-snug mt-0.5">Consultez l&apos;historique et saisissez vos cotisations même sans réseau.</p>
              </div>
            </div>

            <div className="group flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface/80 dark:bg-surface/60 backdrop-blur-md border border-custom shadow-soft transition-all duration-200 hover:border-success/40 hover:scale-[1.01]">
              <div className="p-2.5 rounded-xl bg-success/10 dark:bg-success/20 text-success flex-shrink-0 group-hover:scale-110 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-text-main">Rappels automatiques Push</h3>
                <p className="text-xs text-text-dim leading-snug mt-0.5">Alertes d&apos;échéances et de redistribution de cagnotte en temps réel.</p>
              </div>
            </div>
          </div>

          {/* Bannière d'installation PWA */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="w-full mb-4 p-3 rounded-2xl bg-surface-2 border border-accent/30 flex items-center justify-between text-xs font-semibold text-text-main active:scale-98 transition-all hover:bg-surface"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-accent" />
                <span>Installer l&apos;application sur votre téléphone</span>
              </div>
              <span className="text-[11px] font-bold bg-accent text-white px-2.5 py-1 rounded-full shadow-sm">Installer</span>
            </button>
          )}

          {/* Boutons d'Action Principaux */}
          <div className="space-y-3">
            <button
              onClick={onNavigateToRegister}
              className="btn-cta w-full text-base flex items-center justify-center gap-2 group"
            >
              <span>Créer mon compte</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onNavigateToLogin}
              className="btn-secondary w-full text-sm"
            >
              Déjà un compte ? Se connecter
            </button>
          </div>

          {/* Badges de confiance */}
          <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-text-dim">
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              100% Sécurisé
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Wave & MTN
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Zéro Frais Cachés
            </span>
          </div>
        </main>

        {/* Pied de page et conditions d'utilisation */}
        <footer className="text-center pt-4 border-t border-custom">
          <p className="text-[11px] text-text-dim">
            En continuant, vous acceptez les{' '}
            <a href="#cgu" className="text-accent underline font-medium hover:text-accent-hover">
              Conditions d&apos;Utilisation
            </a>{' '}
            de la plateforme Tontine PWA.
          </p>
        </footer>
      </div>
    </div>
  );
};
