import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Building2,
  Award,
  RefreshCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../components/Navigation';
import { User } from '../types';

interface LoginViewProps {
  onNavigate: (tab: TabType) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const { currentUser, login, logout, resetToSampleData } = useApp();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');

  const demoAccounts: User[] = [
    {
      id: 'usr_001',
      name: 'Capt. David Chen',
      email: 'd.chen@factory-audit.gov',
      role: 'Chief Inspector',
      badgeNumber: 'INSP-8821-A',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_002',
      name: 'Eng. Sarah Jenkins',
      email: 's.jenkins@factory-audit.gov',
      role: 'Field Officer',
      badgeNumber: 'ENG-4029-B',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_003',
      name: 'Marcus Brody',
      email: 'm.brody@factory-audit.gov',
      role: 'Auditor',
      badgeNumber: 'HAZ-7714-E',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_004',
      name: 'Somchai Prasertkit',
      email: 'somchai@apexmetal.co.th',
      role: 'Factory Admin',
      badgeNumber: 'FAC-MGR-01',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const handleSelectDemo = (user: User) => {
    login(user);
    setLoginSuccessMessage(`Signed in as ${user.name} (${user.role})`);
    setTimeout(() => {
      onNavigate('dashboard');
    }, 600);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    const customUser: User = {
      id: `usr_${Date.now()}`,
      name: emailInput.split('@')[0].toUpperCase(),
      email: emailInput,
      role: 'Field Officer',
      badgeNumber: `INSP-${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: demoAccounts[0].avatar,
    };

    login(customUser);
    setLoginSuccessMessage(`Signed in as ${customUser.name}`);
    setTimeout(() => {
      onNavigate('dashboard');
    }, 600);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Brand Header Banner */}
      <div className="bg-white border-2 border-slate-200 p-6 text-center shadow-xs">
        <div className="w-14 h-14 bg-[#00a8ff] text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Shield className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
          Factory<span className="text-[#00a8ff]">Assess</span> Pro Authentication
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Industrial Compliance & Statutory Assessment Management Portal
        </p>
      </div>

      {loginSuccessMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{loginSuccessMessage}</span>
        </div>
      )}

      {/* If already logged in, show current session status */}
      {currentUser ? (
        <div className="bg-white border-2 border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Inspector Session
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase">
              AUTHENTICATED
            </span>
          </div>

          <div className="flex items-center gap-4 bg-[#f5f6fa] p-4 border border-slate-200">
            <div className="w-12 h-12 bg-[#00a8ff] text-white flex items-center justify-center font-black text-lg">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="font-extrabold text-base text-slate-900">{currentUser.name}</div>
              <div className="text-xs text-slate-500 font-medium">{currentUser.email}</div>
              <div className="text-xs font-mono font-bold text-[#00a8ff] mt-0.5">
                {currentUser.role} • {currentUser.badgeNumber}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:text-[#e84118] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Quick Demo Inspector Profiles */}
      <div className="bg-white border-2 border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#00a8ff]" />
            Select Field Inspector / Demo Account
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any profile below for 1-click instant credential verification:
          </p>
        </div>

        <div className="space-y-2.5">
          {demoAccounts.map((account) => {
            const isCurrent = currentUser?.id === account.id;

            return (
              <div
                key={account.id}
                onClick={() => handleSelectDemo(account)}
                className={`p-3.5 border-2 cursor-pointer transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'border-[#00a8ff] bg-[#00a8ff]/5 shadow-xs'
                    : 'border-slate-200 hover:border-slate-400 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
                    {account.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{account.name}</div>
                    <div className="text-[11px] text-slate-500">{account.email}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {account.role} • {account.badgeNumber}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#00a8ff] hover:bg-[#0090e0] shadow-xs"
                >
                  Sign In
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Login Form */}
      <form
        onSubmit={handleCustomSubmit}
        className="bg-white border-2 border-slate-200 p-6 space-y-4 shadow-xs"
      >
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Manual Inspector Credentials
          </h3>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Officer Email / ID
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="officer@factory-audit.gov"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 bg-[#f5f6fa]/50 focus:outline-none focus:border-[#00a8ff]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Access Passcode
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 bg-[#f5f6fa]/50 focus:outline-none focus:border-[#00a8ff]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-[#2f3640] hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
        >
          Authorize Field Terminal
        </button>
      </form>

      {/* Reset sample data helper */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => {
            if (confirm('Reset factory assessment dataset to clean default state?')) {
              resetToSampleData();
              alert('Assessment records and factory profiles restored to initial baseline.');
            }
          }}
          className="text-xs text-slate-400 hover:text-slate-600 font-mono flex items-center justify-center gap-1 mx-auto"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Database to Initial State</span>
        </button>
      </div>
    </div>
  );
};
