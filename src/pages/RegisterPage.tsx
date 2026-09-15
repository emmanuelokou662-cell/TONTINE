import React, { useState } from 'react';
import { Camera, ArrowLeft, CheckCircle2, Sun, Moon } from 'lucide-react';
import { PinKeypad } from '../components/auth/PinKeypad';
import { OtpInput } from '../components/auth/OtpInput';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/apiClient';

interface RegisterPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

/**
 * Formulaire d'inscription par étapes : Coordonnées (RF-01) -> Code PIN (RF-02) -> OTP Email (RF-03)
 */
export const RegisterPage: React.FC<RegisterPageProps> = ({ onBack, onSuccess }) => {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<'info' | 'pin' | 'confirm_pin' | 'otp'>('info');

  // Données de formulaire
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [contact, setContact] = useState('+225');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState('Abidjan');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | undefined>();

  // État général
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('La photo ne doit pas dépasser 5 Mo.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !contact || !email || !ville) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!photoFile) {
      setError('La photo de profil est obligatoire (aucune photo par défaut).');
      return;
    }
    setError(null);
    setPin('');
    setPinError(undefined);
    setStep('pin');
  };

  const handlePinChange = (val: string) => {
    setPin(val);
    setPinError(undefined);
    if (val.length === 5) {
      setTimeout(() => {
        setPinError(undefined);
        setConfirmPin('');
        setStep('confirm_pin');
      }, 150);
    }
  };

  const handleConfirmPinChange = (val: string) => {
    setConfirmPin(val);
    setPinError(undefined);
    if (val.length === 5) {
      setTimeout(() => {
        executeRegistration(val);
      }, 150);
    }
  };

  const executeRegistration = async (confirmedPinValue: string) => {
    if (confirmedPinValue !== pin) {
      setPinError('Les deux codes PIN ne correspondent pas.');
      setConfirmPin('');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('prenom', prenom);
    formData.append('contact_paiement', contact);
    formData.append('email', email);
    formData.append('ville', ville);
    formData.append('code_pin', pin);
    formData.append('confirmation_pin', confirmedPinValue);
    if (photoFile) formData.append('photo', photoFile);

    const res = await register(formData);
    setIsLoading(false);

    if (res.success) {
      setStep('otp');
    } else {
      setError(res.error || 'Erreur lors de la création du compte.');
      setStep('info');
    }
  };

  const handleBackNavigation = () => {
    if (step === 'confirm_pin') {
      setStep('pin');
      setConfirmPin('');
      setPinError(undefined);
    } else if (step === 'pin') {
      setStep('info');
      setPin('');
      setPinError(undefined);
    } else {
      onBack();
    }
  };

  const handleOtpComplete = async (code: string) => {
    setIsLoading(true);
    setError(null);
    const res = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });
    setIsLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError((res as any).error?.message || 'Code de vérification invalide.');
    }
  };

  const handleResendOtp = async () => {
    await apiFetch('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  const currentStepNumber = step === 'info' ? 1 : step === 'pin' || step === 'confirm_pin' ? 2 : 3;

  return (
    <div className="relative min-h-screen bg-bg text-text-main flex flex-col justify-between overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-primary/20 dark:bg-primary/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto min-h-screen flex flex-col justify-between px-5 py-6 select-none">
        {/* En-tête */}
        <header className="flex items-center justify-between mb-4">
          <button
            onClick={handleBackNavigation}
            className="touch-target p-2 rounded-xl bg-surface border border-custom hover:bg-surface-2 text-text-dim hover:text-text-main transition-all shadow-sm"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === currentStepNumber
                      ? 'w-6 bg-accent'
                      : s < currentStepNumber
                      ? 'w-3 bg-success'
                      : 'w-3 bg-surface-2 border border-custom'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-text-dim ml-1">Étape {currentStepNumber}/3</span>
          </div>

          <button
            onClick={toggleTheme}
            className="touch-target p-2 rounded-xl bg-surface border border-custom text-text-dim hover:text-text-main hover:bg-surface-2 transition-all shadow-sm"
            aria-label="Basculer le thème"
          >
            {theme === 'sombre' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
          </button>
        </header>

        {/* Contenu principal */}
        <main className="my-auto py-2">
          {error && (
            <div className="p-3.5 mb-4 rounded-2xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          {/* Étape 1 : Coordonnées & Photo (RF-01) */}
          {step === 'info' && (
            <form onSubmit={handleInfoSubmit} className="bg-surface/80 dark:bg-surface/60 backdrop-blur-md p-5 rounded-3xl border border-custom shadow-soft space-y-3.5">
              <div className="text-center mb-2">
                <h2 className="font-display font-bold text-lg text-text-main">Créer votre profil</h2>
                <p className="text-xs text-text-dim mt-0.5">Renseignez vos coordonnées pour rejoindre votre tontine.</p>
              </div>

              <div className="flex flex-col items-center my-2">
                <label className="relative cursor-pointer group">
                  <div className="w-20 h-20 rounded-full bg-surface-2 border-2 border-dashed border-accent/40 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-accent transition-all">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-7 h-7 text-text-dim group-hover:text-accent transition-colors" />
                    )}
                  </div>
                  <input type="file" accept="image/png, image/jpeg" onChange={handlePhotoChange} className="hidden" />
                  <span className="text-[11px] font-bold text-accent mt-1.5 block text-center">
                    {photoPreview ? 'Modifier photo' : 'Photo obligatoire *'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-dim mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="OKOU"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-sm text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="EMMANUEL"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-sm text-text-main focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-dim mb-1">Contact Mobile Money (Wave / MTN) *</label>
                <input
                  type="tel"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+2250700000000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-sm text-text-main focus:border-accent focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-dim mb-1">Adresse Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="emmanuel.okou@exemple.ci"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-sm text-text-main focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-dim mb-1">Ville *</label>
                <input
                  type="text"
                  required
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Abidjan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-custom text-sm text-text-main focus:border-accent focus:outline-none"
                />
              </div>

              <button type="submit" className="btn-cta w-full mt-3">
                Continuer vers le code PIN
              </button>
            </form>
          )}

          {/* Étape 2 : Définition du code PIN à 5 chiffres (RF-02) */}
          {step === 'pin' && (
            <div className="bg-surface/80 dark:bg-surface/60 backdrop-blur-md p-5 rounded-3xl border border-custom shadow-soft">
              <PinKeypad
                pin={pin}
                onChange={handlePinChange}
                label="Définissez votre code PIN secret à 5 chiffres"
                error={pinError}
              />
            </div>
          )}

          {/* Étape 2 bis : Confirmation du code PIN (RF-02) */}
          {step === 'confirm_pin' && (
            <div className="bg-surface/80 dark:bg-surface/60 backdrop-blur-md p-5 rounded-3xl border border-custom shadow-soft">
              <PinKeypad
                pin={confirmPin}
                onChange={handleConfirmPinChange}
                label="Confirmez votre code PIN à 5 chiffres"
                error={pinError}
              />
              {isLoading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-accent font-semibold animate-pulse">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span>Création de votre compte en cours...</span>
                </div>
              )}
            </div>
          )}

          {/* Étape 3 : Vérification OTP Email (RF-03) */}
          {step === 'otp' && (
            <div className="bg-surface/80 dark:bg-surface/60 backdrop-blur-md p-5 rounded-3xl border border-custom shadow-soft">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
              </div>
              <OtpInput
                email={email}
                onComplete={handleOtpComplete}
                onResend={handleResendOtp}
                isLoading={isLoading}
              />
            </div>
          )}
        </main>

        <footer className="text-center pt-3 border-t border-custom">
          <p className="text-xs text-text-dim">
            Déjà inscrit ?{' '}
            <button onClick={onBack} className="text-accent font-bold hover:underline">
              Se connecter
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
};
