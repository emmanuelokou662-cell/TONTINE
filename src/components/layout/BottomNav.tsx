import React from 'react';
import { Home, ArrowLeftRight, Users, User } from 'lucide-react';

export type NavigationTab = 'home' | 'transactions' | 'members' | 'profile';

interface BottomNavProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  pendingTransactionsCount?: number;
}

/**
 * Barre de navigation inférieure fixe mobile avec Glassmorphism (Section 11.4 & RF-439)
 * 4 onglets : Accueil, Transactions, Membres, Profil avec zones tactiles de 44x44px
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  pendingTransactionsCount = 0
}) => {
  const tabs = [
    { id: 'home' as NavigationTab, label: 'Accueil', icon: Home },
    { id: 'transactions' as NavigationTab, label: 'Transactions', icon: ArrowLeftRight, badge: pendingTransactionsCount },
    { id: 'members' as NavigationTab, label: 'Membres', icon: Users },
    { id: 'profile' as NavigationTab, label: 'Profil', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 dark:bg-surface/85 backdrop-blur-xl border-t border-custom pb-safe select-none shadow-soft-dark">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="touch-target flex flex-col items-center justify-center relative py-1 focus:outline-none transition-colors"
              aria-label={tab.label}
              aria-selected={isActive}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive ? 'text-accent scale-110 drop-shadow-sm' : 'text-text-dim hover:text-text-main'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none shadow-sm animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[11px] mt-1 font-medium transition-colors ${
                  isActive ? 'text-accent font-bold' : 'text-text-dim'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-8 h-1 bg-accent rounded-full animate-in fade-in zoom-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
