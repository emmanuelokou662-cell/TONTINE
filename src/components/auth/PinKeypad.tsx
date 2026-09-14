import React from 'react';
import { Delete } from 'lucide-react';

interface PinKeypadProps {
  pin: string;
  onChange: (pin: string) => void;
  maxLength?: number;
  label?: string;
  error?: string;
}

/**
 * Clavier numérique virtuel sécurisé pour code PIN à 5 chiffres (RF-02, RF-164)
 */
export const PinKeypad: React.FC<PinKeypadProps> = ({
  pin,
  onChange,
  maxLength = 5,
  label = 'Entrez votre code PIN à 5 chiffres',
  error
}) => {
  const handleDigitClick = (digit: string) => {
    if (pin.length < maxLength) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
      onChange(pin + digit);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
      onChange(pin.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto select-none">
      {label && <p className="text-sm font-medium text-text-dim mb-4 text-center">{label}</p>}

      {/* Indicateurs visuels des 5 chiffres (RF-02) */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {Array.from({ length: maxLength }).map((_, index) => {
          const isFilled = index < pin.length;
          return (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                isFilled
                  ? 'bg-accent scale-110 shadow-sm shadow-accent/40'
                  : 'border-2 border-custom bg-surface-2'
              }`}
            />
          );
        })}
      </div>

      {error && <p className="text-xs text-danger font-medium mb-4 text-center">{error}</p>}

      {/* Clavier numérique 3x4 avec zones tactiles ergonomiques 44x44px minimum */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigitClick(digit)}
            className="touch-target h-14 rounded-2xl bg-surface border border-custom text-text-main font-display font-bold text-xl hover:bg-surface-2 active:bg-surface-2 active:scale-95 transition-all shadow-sm"
          >
            {digit}
          </button>
        ))}

        <div className="h-14" /> {/* Espace vide gauche */}

        <button
          type="button"
          onClick={() => handleDigitClick('0')}
          className="touch-target h-14 rounded-2xl bg-surface border border-custom text-text-main font-display font-bold text-xl hover:bg-surface-2 active:bg-surface-2 active:scale-95 transition-all shadow-sm"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="touch-target h-14 rounded-2xl bg-surface border border-custom text-text-dim hover:text-danger active:scale-95 flex items-center justify-center transition-all shadow-sm"
          aria-label="Effacer le dernier chiffre"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
