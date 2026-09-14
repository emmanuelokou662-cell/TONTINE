import React, { useState, useEffect, useRef } from 'react';

interface OtpInputProps {
  email: string;
  onComplete: (code: string) => void;
  onResend: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Composant de saisie OTP à 6 cases avec compte à rebours de 60s (RF-03)
 */
export const OtpInput: React.FC<OtpInputProps> = ({
  email,
  onComplete,
  onResend,
  isLoading = false
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Passer au champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Déclencher la validation si les 6 cases sont remplies
    if (newDigits.every((d) => d !== '')) {
      onComplete(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendClick = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    await onResend();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto text-center select-none">
      <p className="text-sm text-text-dim mb-6">
        Un code de vérification à 6 chiffres a été envoyé à l&apos;adresse :<br />
        <span className="font-semibold text-text-main">{email}</span>
      </p>

      {/* 6 cases de saisie OTP */}
      <div className="flex justify-center gap-2 mb-6">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isLoading}
            className="w-12 h-14 text-center font-display font-bold text-2xl bg-surface border-2 border-custom rounded-xl text-text-main focus:border-accent focus:outline-none transition-colors"
          />
        ))}
      </div>

      {/* Bouton de renvoi avec cooldown de 60s (RF-03, RF-175) */}
      <div className="mt-4">
        {canResend ? (
          <button
            type="button"
            onClick={handleResendClick}
            className="text-xs font-semibold text-accent hover:underline touch-target"
          >
            Renvoyer un nouveau code
          </button>
        ) : (
          <p className="text-xs text-text-dim">
            Renvoyer le code dans <span className="font-semibold text-text-main">{countdown}s</span>
          </p>
        )}
      </div>
    </div>
  );
};
