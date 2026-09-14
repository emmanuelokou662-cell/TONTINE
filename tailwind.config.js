/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Variables CSS centralisées (Section 11 du Cahier des Charges)
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        primary: {
          DEFAULT: 'var(--primary)', // Bleu nuit (#1F4E79)
          light: 'var(--primary-light)', // Bleu clair (#2E86C1)
          dark: '#133352'
        },
        accent: {
          DEFAULT: 'var(--accent)', // Orange (#E8833A)
          hover: '#d97327',
          light: '#fef3eb'
        },
        success: 'var(--success)', // Vert statut confirmé (#2E9E5B)
        warning: 'var(--warning)', // Ambre statut en attente (#E0A800)
        danger: 'var(--danger)', // Rouge statut rejeté (#C0392B)
        'text-main': 'var(--text)',
        'text-dim': 'var(--text-dim)',
        'border-custom': 'var(--border)'
      },
      fontFamily: {
        display: ['Sora', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        cta: '16px',
        '2xl': '20px',
        '3xl': '28px'
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(31, 78, 121, 0.4)',
        'glow-accent': '0 8px 25px -4px rgba(232, 131, 58, 0.4)',
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'soft-dark': '0 8px 30px -4px rgba(0, 0, 0, 0.35)'
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.01)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      }
    }
  },
  plugins: []
};
