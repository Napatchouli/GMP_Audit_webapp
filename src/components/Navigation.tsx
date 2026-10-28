import React from 'react';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  ClipboardList,
  CalendarDays,
  FileCheck2,
  LogOut,
  User,
  Shield,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type TabType =
  | 'dashboard'
  | 'factories'
  | 'new-factory'
  | 'assign'
  | 'assessment'
  | 'calendar'
  | 'login';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeAssessmentId?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  activeAssessmentId,
}) => {
  const { currentUser, logout, assessments, factories } = useApp();

  // Quick stats
  const pendingCount = assessments.filter(
    (a) => a.status === 'scheduled' || a.status === 'in_progress'
  ).length;

  const failedCount = assessments.filter(
    (a) => a.status === 'completed' && a.result === 'FAIL'
  ).length;

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: failedCount > 0 ? `${failedCount} alert` : undefined,
      badgeColor: 'bg-[#e84118] text-white',
    },
    {
      id: 'factories' as TabType,
      label: 'Factory Directory',
      icon: Building2,
      badge: `${factories.length}`,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
    {
      id: 'new-factory' as TabType,
      label: 'Add Factory',
      icon: PlusCircle,
    },
    {
      id: 'assign' as TabType,
      label: 'Assign Audit',
      icon: ClipboardList,
    },
    {
      id: 'assessment' as TabType,
      label: 'Live Assessment',
      icon: FileCheck2,
      badge: pendingCount > 0 ? `${pendingCount} active` : undefined,
      badgeColor: 'bg-[#00a8ff] text-white',
      highlight: true,
    },
    {
      id: 'calendar' as TabType,
      label: 'Visit Calendar',
      icon: CalendarDays,
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Header */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 bg-[#00a8ff] text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:bg-[#0090e0] transition-colors">
                <Shield className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 uppercase">
                    Factory<span className="text-[#00a8ff]">Assess</span>
                  </span>
                  <span className="bg-[#2f3640] text-white text-[10px] font-bold px-1.5 py-0.5 tracking-wider uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Industrial Safety & Compliance Enforcement
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                      isActive
                        ? 'border-[#00a8ff] text-[#00a8ff] bg-[#00a8ff]/5'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Profile / Quick Status */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectTab('login')}
                    className="flex items-center gap-2 text-left p-1 hover:bg-slate-100 transition-colors"
                    title="Switch user account"
                  >
                    <div className="w-8 h-8 bg-[#00a8ff]/20 text-[#00a8ff] border border-[#00a8ff] flex items-center justify-center font-bold text-xs uppercase">
                      {currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs font-bold text-slate-800 leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {currentUser.role}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={logout}
                    className="hidden sm:flex text-slate-400 hover:text-[#e84118] p-1.5 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSelectTab('login')}
                  className="bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile secondary tab bar (top row for quick access) */}
        <div className="lg:hidden flex overflow-x-auto bg-[#f5f6fa] border-t border-slate-200 px-2 py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#00a8ff] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                } mr-1.5`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1 py-0.2 font-mono font-bold ${
                      isActive ? 'bg-white text-[#00a8ff]' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Mobile Bottom Fixed Nav Bar for field inspectors on the go */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200 flex justify-around items-center h-14 px-1 shadow-lg">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
            currentTab === 'dashboard' ? 'text-[#00a8ff]' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Dashboard</span>
        </button>

        <button
          onClick={() => onSelectTab('factories')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
            currentTab === 'factories' ? 'text-[#00a8ff]' : 'text-slate-500'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Factories</span>
        </button>

        <button
          onClick={() => onSelectTab('assessment')}
          className={`relative -top-2 flex flex-col items-center justify-center w-12 h-12 bg-[#00a8ff] text-white shadow-md border-2 border-white`}
          title="Live Assessment"
        >
          <FileCheck2 className="w-6 h-6" />
        </button>

        <button
          onClick={() => onSelectTab('assign')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
            currentTab === 'assign' ? 'text-[#00a8ff]' : 'text-slate-500'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Assign</span>
        </button>

        <button
          onClick={() => onSelectTab('calendar')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
            currentTab === 'calendar' ? 'text-[#00a8ff]' : 'text-slate-500'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Calendar</span>
        </button>
      </nav>
    </>
  );
};
