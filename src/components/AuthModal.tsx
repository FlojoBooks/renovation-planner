import React, { useState } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import type { UserRole, User } from '../types';
import {
  X,
  UserPlus,
  Users,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
  LogOut,
  HardHat,
  Home,
  HeartHandshake,
  Wrench,
  Compass,
} from 'lucide-react';

const AVATAR_COLORS = [
  '#0ea5e9', // Sky blue
  '#ec4899', // Pink
  '#f97316', // Orange
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#eab308', // Amber
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

const ROLE_OPTIONS: { role: UserRole; label: string; description: string; icon: React.ElementType }[] = [
  {
    role: 'owner',
    label: 'Opdrachtgever / Eigenaar',
    description: 'Eindverantwoordelijke voor beslissingen en budget.',
    icon: Home,
  },
  {
    role: 'partner',
    label: 'Partner / Mede-eigenaar',
    description: 'Mede-beslisser en toezicht op voortgang.',
    icon: HeartHandshake,
  },
  {
    role: 'contractor',
    label: 'Hoofdaannemer',
    description: 'Coördinatie van de bouw, fasering en vaklieden.',
    icon: HardHat,
  },
  {
    role: 'subcontractor',
    label: 'Onderaannemer / Vakman',
    description: 'Uitvoerder van specifieke taken (elektra, stuc, loodgieter).',
    icon: Wrench,
  },
  {
    role: 'architect',
    label: 'Architect / Adviseur',
    description: 'Bouwtechnisch advies, tekeningen en kwaliteitsborging.',
    icon: Compass,
  },
];

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    users,
    currentUser,
    switchUser,
    registerUser,
    logoutUser,
  } = useRenovationStore();

  const [activeTab, setActiveTab] = useState<'switch' | 'register'>('switch');

  // Register Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('subcontractor');
  const [roleTitle, setRoleTitle] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const initials = name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const newUser = registerUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      roleTitle: roleTitle.trim() || undefined,
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      avatarColor,
      avatarInitials: initials || 'GB',
    });

    setRegisteredSuccess(true);
    setTimeout(() => {
      setRegisteredSuccess(false);
      setName('');
      setEmail('');
      setRoleTitle('');
      setCompany('');
      setPhone('');
      setActiveTab('switch');
      closeAuthModal();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Team & Gebruikersaccounts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wissel tussen teamleden of voeg nieuwe accounts toe
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 gap-2 bg-slate-50/30 dark:bg-slate-900/40">
          <button
            onClick={() => setActiveTab('switch')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'switch'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Bestaande Accounts ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Nieuw Account Aanmaken
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <span>Selecteer actieve gebruiker</span>
                {currentUser && (
                  <button
                    onClick={() => logoutUser()}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 normal-case font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Uitloggen
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {users.map((user) => {
                  const isSelected = currentUser?.id === user.id;
                  const roleConfig = ROLE_OPTIONS.find((r) => r.role === user.role);
                  const Icon = roleConfig?.icon || ShieldCheck;

                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        closeAuthModal();
                      }}
                      className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                          style={{ backgroundColor: user.avatarColor }}
                        >
                          {user.avatarInitials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-base">
                              {user.name}
                            </span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                                Actief
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <Icon className="w-3.5 h-3.5 text-blue-500" />
                              {user.roleTitle || roleConfig?.label}
                            </span>
                            {user.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {user.company}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            Wisselen
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('register')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 transition-all bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <UserPlus className="w-4 h-4" />
                  Nog een persoon / account toevoegen
                </button>
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {registeredSuccess ? (
                <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 animate-scale-up">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Account succesvol aangemaakt!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Je bent nu automatisch ingelogd als {name}.
                  </p>
                </div>
              ) : (
                <>
                  {/* Naam & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Volledige Naam *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="bijv. Mark van Dijk"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        E-mailadres *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="mark@aannemer.nl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Rol Selectie */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Rol op het platform *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {ROLE_OPTIONS.map((item) => {
                        const Icon = item.icon;
                        const isSelected = role === item.role;
                        return (
                          <div
                            key={item.role}
                            onClick={() => setRole(item.role)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {item.label}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bedrijf & Functietitel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bedrijfsnaam (optioneel)
                      </label>
                      <input
                        type="text"
                        placeholder="bijv. Van Dijk Stucadoors"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Telefoonnummer (optioneel)
                      </label>
                      <input
                        type="tel"
                        placeholder="bijv. +31 6 12345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Avatar Kleur */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Profiellabel Kleur
                    </label>
                    <div className="flex items-center gap-2">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setAvatarColor(c)}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            avatarColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Account Aanmaken & Inloggen
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
