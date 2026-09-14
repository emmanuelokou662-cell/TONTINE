import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useGroup } from './context/GroupContext';
import { Header } from './components/layout/Header';
import { BottomNav, NavigationTab } from './components/layout/BottomNav';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { MembersPage } from './pages/MembersPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ManageGroupPage } from './pages/ManageGroupPage';
import { AdminValidationPage } from './pages/AdminValidationPage';
import { PaymentDeclareModal } from './components/transactions/PaymentDeclareModal';
import { CreateOrJoinGroupModal } from './components/settings/CreateOrJoinGroupModal';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeGroup, refreshGroups } = useGroup();

  // Navigation non connectée
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  // Navigation connectée
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [activeSubView, setActiveSubView] = useState<'main' | 'settings' | 'manage_group' | 'admin_validations'>('main');

  // Modales globales
  const [isDeclarePaymentOpen, setIsDeclarePaymentOpen] = useState(false);
  const [isCreateOrJoinOpen, setIsCreateOrJoinOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-text-dim">
        <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold">Chargement de l&apos;application...</p>
      </div>
    );
  }

  // 1. Parcours non connecté (Landing, Connexion, Inscription)
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <LoginPage
          onBack={() => setAuthView('landing')}
          onSuccess={() => setAuthView('landing')}
          onNavigateToRegister={() => setAuthView('register')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onBack={() => setAuthView('landing')}
          onSuccess={() => setAuthView('login')}
        />
      );
    }
    return (
      <LandingPage
        onNavigateToRegister={() => setAuthView('register')}
        onNavigateToLogin={() => setAuthView('login')}
      />
    );
  }

  // 2. Parcours connecté (PWA complète)
  return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col justify-between">
      {/* Barre supérieure persistante (RF-23) */}
      <Header
        onOpenSettings={() => setActiveSubView('settings')}
        onOpenCreateOrJoin={() => setIsCreateOrJoinOpen(true)}
      />

      {/* Contenu principal selon la vue active */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4">
        {activeSubView === 'settings' ? (
          <SettingsPage
            onBack={() => setActiveSubView('main')}
            onOpenCreateOrJoin={() => {
              setActiveSubView('main');
              setIsCreateOrJoinOpen(true);
            }}
          />
        ) : activeSubView === 'manage_group' ? (
          <ManageGroupPage onBack={() => setActiveSubView('main')} />
        ) : activeSubView === 'admin_validations' ? (
          <AdminValidationPage onBack={() => setActiveSubView('main')} />
        ) : (
          <>
            {currentTab === 'home' && (
              <DashboardPage
                onOpenDeclarePayment={() => setIsDeclarePaymentOpen(true)}
                onOpenManageGroup={() => setActiveSubView('manage_group')}
                onOpenCreateOrJoin={() => setIsCreateOrJoinOpen(true)}
                onConfirmDistribution={() => setActiveSubView('admin_validations')}
              />
            )}
            {currentTab === 'transactions' && (
              <TransactionsPage onOpenDeclarePayment={() => setIsDeclarePaymentOpen(true)} />
            )}
            {currentTab === 'members' && (
              <MembersPage onOpenCreateOrJoin={() => setIsCreateOrJoinOpen(true)} />
            )}
            {currentTab === 'profile' && (
              <ProfilePage onOpenSettings={() => setActiveSubView('settings')} />
            )}
          </>
        )}
      </main>

      {/* Barre de navigation inférieure fixe mobile (RF-439) */}
      {activeSubView === 'main' && (
        <BottomNav
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            setActiveSubView('main');
          }}
        />
      )}

      {/* Modal Déclarer Cotisation (RF-06) */}
      {activeGroup && (
        <PaymentDeclareModal
          isOpen={isDeclarePaymentOpen}
          onClose={() => setIsDeclarePaymentOpen(false)}
          groupId={activeGroup.id_groupe}
          defaultAmount={activeGroup.cycle_en_cours?.montant_cotisation || 0}
          onSuccess={refreshGroups}
        />
      )}

      {/* Modal Créer / Rejoindre Groupe (RF-04, RF-05, RF-26) */}
      <CreateOrJoinGroupModal
        isOpen={isCreateOrJoinOpen}
        onClose={() => setIsCreateOrJoinOpen(false)}
        onSuccess={refreshGroups}
      />
    </div>
  );
};
