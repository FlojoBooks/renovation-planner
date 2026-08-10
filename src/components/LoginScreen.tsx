import React, { useState, useEffect } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import type { UserRole } from '../types';
import { verifyInviteToken, type InvitePayload } from '../utils/crypto';
import {
  Layers,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  HardHat,
  Home,
  HeartHandshake,
  Wrench,
  Compass,
  ArrowRight,
  ShieldCheck,
  Link,
  Sparkles,
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
    description: 'Eindverantwoordelijke voor project en beslissingen.',
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
    label: 'Hoofdaannemer / Uitvoerder',
    description: 'Coördinatie van werkzaamheden en planning.',
    icon: HardHat,
  },
  {
    role: 'subcontractor',
    label: 'Vakman / Onderaannemer',
    description: 'Uitvoerder van specifieke taken (techniek, elektra, montage).',
    icon: Wrench,
  },
  {
    role: 'architect',
    label: 'Adviseur / Specialist',
    description: 'Technisch advies en kwaliteitsborging.',
    icon: Compass,
  },
];

export function LoginScreen() {
  const { users, loginUserAsync, registerUserAsync, switchUser, isDarkMode } = useRenovationStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [inviteData, setInviteData] = useState<InvitePayload | null>(null);
  const [isCheckingInvite, setIsCheckingInvite] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('partner');
  const [regRoleTitle, setRegRoleTitle] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAvatarColor, setRegAvatarColor] = useState(AVATAR_COLORS[0]);
  const [regSuccess, setRegSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Check URL query param ?invite=...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get('invite');

      if (inviteToken) {
        const verified = verifyInviteToken(inviteToken);
        if (verified) {
          setInviteData(verified);
          if (verified.role) {
            setRegRole(verified.role as UserRole);
          }
          setActiveTab('register');
        } else {
          setLoginError('De uitnodigingslink is ongeldig of verlopen.');
        }
      } else if (users.length === 0) {
        // Eerste keer openen: direct registratie als eerste eigenaar
        setActiveTab('register');
        setRegRole('owner');
      }
    }
    setIsCheckingInvite(false);
  }, [users.length]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const result = await loginUserAsync(loginEmail, loginPassword);
      if (!result.success) {
        setLoginError(result.error || 'Inloggen mislukt. Controleer je gegevens.');
      }
    } catch (err) {
      setLoginError('Er is een onverwachte fout opgetreden bij het inloggen.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) return;

    // Als er al gebruikers zijn en geen invite token, blokkeer ongeautoriseerde registratie
    if (users.length > 0 && !inviteData) {
      setLoginError('Registreren is alleen mogelijk via een private uitnodigingslink van de projectbeheerder.');
      return;
    }

    setIsRegistering(true);

    const initials = regName
      .trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    try {
      await registerUserAsync({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword.trim() || undefined,
        role: regRole,
        roleTitle: regRoleTitle.trim() || undefined,
        company: regCompany.trim() || undefined,
        phone: regPhone.trim() || undefined,
        avatarColor: regAvatarColor,
        avatarInitials: initials || 'IK',
      });

      setRegSuccess(true);
    } catch (err) {
      setLoginError('Fout bij het registreren van account.');
    } finally {
      setIsRegistering(false);
    }
  };

  const canRegister = users.length === 0 || !!inviteData;

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-100/80 text-slate-900'}`}>
      {/* Background ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Header Branding */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md shadow-lg shadow-black/10 mb-3 border border-white/30">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Project & Planning Hub
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-md mx-auto">
            Log in met je account om toegang te krijgen tot planning, taken, betalingen en budgetten.
          </p>

          {/* Invite Detected Banner */}
          {inviteData && (
            <div className="mt-4 p-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-xs font-semibold text-white flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Geldige uitnodiging voor rol: <strong>{inviteData.role}</strong></span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex bg-black/25 backdrop-blur-md p-1 rounded-2xl mt-6 max-w-xs mx-auto border border-white/15">
            <button
              onClick={() => { setActiveTab('login'); setLoginError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Inloggen
            </button>
            <button
              onClick={() => { setActiveTab('register'); setLoginError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Registreren
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {activeTab === 'login' && (
            <div className="space-y-6">
              {loginError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    E-mailadres
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="bijv. sander@project.nl"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Wachtwoord
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {isLoggingIn ? 'Inloggen controleren...' : 'Inloggen op Platform'}
                </button>
              </form>

              {/* Snelle Accountkeuze */}
              {users.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
                    Of kies direct een geregistreerd account
                  </p>

                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {users.map((user) => (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => switchUser(user.id)}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                            style={{ backgroundColor: user.avatarColor }}
                          >
                            {user.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {user.roleTitle || user.role} • {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          Inloggen
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <div>
              {!canRegister ? (
                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-3">
                  <ShieldCheck className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Private Registratie Vereist
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Nieuwe accounts kunnen alleen worden aangemaakt via een private uitnodigingslink van de projectbeheerder. Vraag de beheerder om een uitnodigingslink via WhatsApp of e-mail.
                  </p>
                  <button
                    onClick={() => setActiveTab('login')}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    Terug naar Inloggen
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {regSuccess ? (
                    <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        Account succesvol aangemaakt!
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Wachtwoord is cryptografisch versleuteld. Je wordt direct ingelogd...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Volledige Naam *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="bijv. Sander van Vliet"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
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
                            placeholder="sander@voorbeeld.nl"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Wachtwoord (Wordt versleuteld opgeslagen)
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="password"
                            placeholder="Kies een veilig wachtwoord..."
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Wachtwoorden worden end-to-end gehasht met SHA-256 en salt (nooit zichtbaar voor beheerders).
                        </p>
                      </div>

                      {/* Rol Selectie */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Jouw Rol in het project *
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {ROLE_OPTIONS.map((item) => {
                            const Icon = item.icon;
                            const isSelected = regRole === item.role;
                            return (
                              <div
                                key={item.role}
                                onClick={() => setRegRole(item.role)}
                                className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500'
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div
                                  className={`p-2 rounded-lg shrink-0 ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {item.label}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {item.description}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Bedrijfsnaam (optioneel)
                          </label>
                          <input
                            type="text"
                            placeholder="bijv. Smikkelbakkies B.V."
                            value={regCompany}
                            onChange={(e) => setRegCompany(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Telefoon (optioneel)
                          </label>
                          <input
                            type="tel"
                            placeholder="+31 6 12345678"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Kleur voor profielbadge
                        </label>
                        <div className="flex items-center gap-2">
                          {AVATAR_COLORS.map((c) => (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setRegAvatarColor(c)}
                              className={`w-7 h-7 rounded-full transition-transform ${
                                regAvatarColor === c
                                  ? 'scale-125 ring-2 ring-offset-2 ring-blue-500'
                                  : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isRegistering}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 pt-3"
                      >
                        <UserPlus className="w-4 h-4" />
                        {isRegistering ? 'Account versleutelen & aanmaken...' : 'Account Aanmaken & Direct Starten'}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
