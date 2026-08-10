import React, { useState } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import type { UserRole } from '../types';
import {
  X,
  Link,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Share2,
  HardHat,
  HeartHandshake,
  Wrench,
  Compass,
  Home,
  MessageCircle,
  Mail,
} from 'lucide-react';

const ROLE_OPTIONS: { role: UserRole; label: string; description: string; icon: React.ElementType }[] = [
  {
    role: 'partner',
    label: 'Partner / Mede-eigenaar',
    description: 'Volledige toegang tot planning, budgetten en betalingen.',
    icon: HeartHandshake,
  },
  {
    role: 'contractor',
    label: 'Hoofdaannemer / Uitvoerder',
    description: 'Toezicht op planning, taken toewijzen en gereedmelden.',
    icon: HardHat,
  },
  {
    role: 'subcontractor',
    label: 'Vakman / Onderaannemer',
    description: 'Toegang tot toegewezen taken, materialen en gereedmelden.',
    icon: Wrench,
  },
  {
    role: 'architect',
    label: 'Adviseur / Specialist',
    description: 'Inzage en adviesfunctie binnen het project.',
    icon: Compass,
  },
  {
    role: 'owner',
    label: 'Mede-opdrachtgever',
    description: 'Volledige beheerrechten.',
    icon: Home,
  },
];

export function InviteModal() {
  const { isInviteModalOpen, closeInviteModal, generateInviteLink, project } = useRenovationStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('partner');
  const [expiryDays, setExpiryDays] = useState<number>(14);
  const [copied, setCopied] = useState(false);

  if (!isInviteModalOpen) return null;

  const inviteLink = generateInviteLink(selectedRole, expiryDays);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hoi! Je bent uitgenodigd om lid te worden van ons project "${project?.name || 'Project'}" op het planning platform. Gebruik deze link om je account aan te maken:\n\n${inviteLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Uitnodiging voor project "${project?.name || 'Project'}"`);
    const body = encodeURIComponent(
      `Hallo,\n\nJe bent uitgenodigd om lid te worden van het project "${project?.name || 'Project'}".\n\nKlik op onderstaande private link om je account aan te maken en direct toegang te krijgen:\n${inviteLink}\n\nTot op het platform!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Private Invite Link Genereren
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nodig teamleden of vakmensen veilig uit voor dit project
              </p>
            </div>
          </div>

          <button
            onClick={closeInviteModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Beveiligingsbadge */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Versleutelde Toegangslink</strong>
              Alleen personen met deze specifieke cryptografische invite-link kunnen een account aanmaken. Wachtwoorden worden automatisch gehasht en veilig opgeslagen.
            </div>
          </div>

          {/* Rolkeuze */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              1. Kies de gewenste rol voor de uitgenodigde persoon:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ROLE_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.role;
                return (
                  <div
                    key={item.role}
                    onClick={() => setSelectedRole(item.role)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
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

          {/* Geldigheidsduur */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
              <Clock className="w-4 h-4 text-slate-400" />
              Geldigheid van de link:
            </div>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 dagen</option>
              <option value={14}>14 dagen</option>
              <option value={30}>30 dagen</option>
            </select>
          </div>

          {/* Gegenereerde Link Box */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Jouw unieke uitnodigingslink:
            </label>
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 dark:text-slate-300 truncate focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Gekopieerd!' : 'Kopiëren'}
              </button>
            </div>
          </div>

          {/* Snelle deelknoppen */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Deel via WhatsApp
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs transition-colors"
            >
              <Mail className="w-4 h-4 text-blue-500" />
              Deel via E-mail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
