import React, { useState, useEffect } from 'react';
import { Settings, WifiOff, ChevronDown, PlusCircle, Sun, Moon, Zap } from 'lucide-react';
import { useGroup } from '../../context/GroupContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { syncManager } from '../../services/syncManager';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenCreateOrJoin?: () => void;
}

/**
 * Barre supérieure persistante conforme à RF-23 avec Glassmorphism et Thème Switcher
 */
export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenCreateOrJoin }) => {
  const { groups, activeGroup, selectGroup } = useGroup();
  const { theme, toggleTheme } = useTheme();
  const { isConnected: isSocketConnected } = useSocket();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showGroupMenu, setShowGroupMenu] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((status) => {
      setIsOnline(status.isOnline);
      setPendingCount(status.pendingCount);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-surface/90 dark:bg-surface/80 backdrop-blur-xl border-b border-custom px-4 py-3 select-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Icône Paramètres (⚙) et Bascule Thème à gauche */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSettings}
            className="touch-target p-2 rounded-xl text-text-dim hover:text-text-main hover:bg-surface-2 transition-all"
            aria-label="Ouvrir les paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTheme}
            className="touch-target p-2 rounded-xl text-text-dim hover:text-text-main hover:bg-surface-2 transition-all"
            aria-label="Basculer le thème"
          >
            {theme === 'sombre' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
          </button>
        </div>

        {/* Sélecteur de groupe actif ou Statut réseau au centre */}
        <div className="flex flex-col items-center relative">
          {activeGroup ? (
            <button
              onClick={() => setShowGroupMenu((prev) => !prev)}
              className="flex items-center gap-1.5 font-display font-bold text-text-main text-sm md:text-base max-w-[180px] truncate hover:opacity-80 transition-opacity"
              aria-label="Changer de groupe de tontine"
            >
              <span className="truncate">{activeGroup.nom_groupe}</span>
              <ChevronDown className={`w-4 h-4 text-text-dim flex-shrink-0 transition-transform ${showGroupMenu ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <span className="font-display font-bold text-text-main text-sm">Tontine</span>
          )}

          {/* Indicateur de connectivité réseau et temps réel (Online / Live Socket / Offline) */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {!isOnline ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-danger font-bold animate-pulse">
                <WifiOff className="w-3 h-3" />
                <span>Hors-Ligne {pendingCount > 0 ? `(${pendingCount} attente)` : ''}</span>
              </span>
            ) : isSocketConnected ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Zap className="w-2.5 h-2.5 fill-emerald-500" />
                <span>En direct</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-success font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success opacity-75" />
                <span>En ligne</span>
              </span>
            )}
          </div>

          {/* Menu déroulant de changement de groupe (RF-26) */}
          {showGroupMenu && (
            <div className="absolute top-12 bg-surface/95 dark:bg-surface/95 backdrop-blur-xl border border-custom rounded-2xl shadow-xl p-2 w-64 z-50 animate-in fade-in slide-in-from-top-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-dim px-2 py-1 mb-1">Mes groupes de tontine</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {groups.map((g) => (
                  <button
                    key={g.id_groupe}
                    onClick={() => {
                      selectGroup(g.id_groupe);
                      setShowGroupMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs rounded-xl flex items-center justify-between transition-colors ${
                      g.id_groupe === activeGroup?.id_groupe
                        ? 'bg-accent/15 text-accent font-bold border border-accent/20'
                        : 'text-text-main hover:bg-surface-2'
                    }`}
                  >
                    <span className="truncate">{g.nom_groupe}</span>
                    <span className="text-[10px] text-text-dim bg-surface px-1.5 py-0.5 rounded-md border border-custom">{g.periodicite}</span>
                  </button>
                ))}
              </div>

              {onOpenCreateOrJoin && (
                <button
                  onClick={() => {
                    setShowGroupMenu(false);
                    onOpenCreateOrJoin();
                  }}
                  className="w-full mt-2 pt-2 border-t border-custom text-left px-3 py-2 text-xs font-semibold text-accent flex items-center gap-2 hover:bg-surface-2 rounded-xl transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Créer ou rejoindre un groupe</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Logo de la PWA à droite (RF-23) */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white font-display font-extrabold text-sm shadow-md shadow-primary/20">
            T
          </div>
        </div>
      </div>
    </header>
  );
};
