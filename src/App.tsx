import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { FactoriesView } from './views/FactoriesView';
import { NewFactoryView } from './views/NewFactoryView';
import { AssignAuditView } from './views/AssignAuditView';
import { AssessmentEngineView } from './views/AssessmentEngineView';
import { CalendarBookingView } from './views/CalendarBookingView';
import { LoginView } from './views/LoginView';

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);

  const handleNavigate = (tab: TabType, id?: string) => {
    setSelectedEntityId(id);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f6fa] text-[#2f3640]">
      {/* Navigation Top & Mobile */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        activeAssessmentId={currentTab === 'assessment' ? selectedEntityId : undefined}
      />

      {/* Main Content Area with max-width container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {currentTab === 'factories' && (
          <FactoriesView
            onNavigate={handleNavigate}
            selectedFactoryId={selectedEntityId}
          />
        )}
        {currentTab === 'new-factory' && <NewFactoryView onNavigate={handleNavigate} />}
        {currentTab === 'assign' && (
          <AssignAuditView
            onNavigate={handleNavigate}
            preselectedFactoryId={selectedEntityId}
          />
        )}
        {currentTab === 'assessment' && (
          <AssessmentEngineView
            onNavigate={handleNavigate}
            activeAssessmentId={selectedEntityId}
          />
        )}
        {currentTab === 'calendar' && (
          <CalendarBookingView onNavigate={handleNavigate} />
        )}
        {currentTab === 'login' && <LoginView onNavigate={handleNavigate} />}
      </main>

      {/* Flat Desktop Footer */}
      <footer className="hidden sm:block bg-white border-t border-slate-200 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00a8ff]" />
            <span className="font-extrabold uppercase text-slate-700">FactoryAssess Pro</span>
            <span>• Flat Design Industrial Compliance & Field Audit System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Primary: #00a8ff</span>
            <span>Secondary: #f5f6fa</span>
            <span className="text-[#e84118] font-bold">Accent: #e84118</span>
            <span>Checklist A (5 Parts) & B (3 Parts)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
