import React, { useState } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import type { UpgradeCategory, UpgradeStatus, UpgradeOption } from '../types';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  Euro,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
  Wrench,
  Maximize2,
  Flame,
  Zap,
  Tag,
  Info,
  Check,
  Building,
} from 'lucide-react';
import { formatCurrency } from '../utils';

const CATEGORIES: { id: UpgradeCategory | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all',            label: 'Alle Opties',          icon: Sparkles },
  { id: 'technique',      label: 'Techniek & Motor',     icon: Wrench },
  { id: 'interior',       label: 'Interieur & Opbouw',   icon: Maximize2 },
  { id: 'equipment',      label: 'Apparatuur & Keuken',  icon: Flame },
  { id: 'sustainability', label: 'Duurzaamheid & Accu',  icon: Zap },
  { id: 'branding',       label: 'Branding & Styling',   icon: Tag },
  { id: 'custom',         label: 'Maatwerk',             icon: Layers },
];

export function UpgradesView() {
  const {
    availableUpgrades,
    projectUpgrades,
    addUpgradeToProject,
    removeUpgradeFromProject,
    updateUpgradeStatus,
    createCustomUpgrade,
    setActiveView,
  } = useRenovationStore();

  const [selectedCategory, setSelectedCategory] = useState<UpgradeCategory | 'all'>('all');
  const [expandedUpgradeId, setExpandedUpgradeId] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Custom upgrade form
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customCategory, setCustomCategory] = useState<UpgradeCategory>('technique');
  const [customCost, setCustomCost] = useState(1500);
  const [customRoiBadge, setCustomRoiBadge] = useState('');
  const [task1Title, setTask1Title] = useState('');
  const [task2Title, setTask2Title] = useState('');

  const filteredUpgrades = availableUpgrades.filter(
    (u) => selectedCategory === 'all' || u.category === selectedCategory
  );

  const totalUpgradeInvestment = projectUpgrades.reduce((sum, u) => sum + u.agreedPrice, 0);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    createCustomUpgrade({
      title: customTitle.trim(),
      description: customDescription.trim() || 'Aangepaste verbouwingsupgrade',
      category: customCategory,
      estimatedCost: Number(customCost) || 0,
      roiBadge: customRoiBadge.trim() || 'Klantwens / Maatwerk',
      tags: ['Maatwerk', 'Meerwerk'],
      tasksTemplate: [
        {
          title: task1Title.trim() || `Voorbereiding: ${customTitle}`,
          priority: 'high',
          daysOffset: 0,
          durationDays: 2,
          estimatedHours: 8,
        },
        ...(task2Title.trim()
          ? [
              {
                title: task2Title.trim(),
                priority: 'medium' as const,
                daysOffset: 2,
                durationDays: 3,
                estimatedHours: 12,
              },
            ]
          : []),
      ],
    });

    setIsCustomModalOpen(false);
    setCustomTitle('');
    setCustomDescription('');
    setTask1Title('');
    setTask2Title('');
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Opties, Upgrades & Meerwerk
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Projectupgrades & Uitbreidingen
            </h1>
            <p className="text-sm md:text-base text-blue-100/90 leading-relaxed">
              Voeg optionele verbeteringen, apparatuur of maatwerk toe aan je project met 1 klik. Bij toevoeging worden direct de bijbehorende deeltaken, fasen en begrotingsregels automatisch klaargezet in de planning.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-3 shrink-0">
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-md hover:bg-blue-50 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Eigen Optie Toevoegen
            </button>
            <div className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-sm border border-white/15 text-xs">
              <span className="text-blue-200">Gekozen upgrades: </span>
              <strong className="text-white">{projectUpgrades.length}</strong> (
              {formatCurrency(totalUpgradeInvestment)})
            </div>
          </div>
        </div>
      </div>

      {/* Actieve Project Upgrades Overzicht */}
      {projectUpgrades.length > 0 && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Actief in dit project ({projectUpgrades.length})
            </div>
            <button
              onClick={() => setActiveView('gantt')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Bekijk in Gantt tijdlijn →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projectUpgrades.map((pu) => (
              <div
                key={pu.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="min-w-0 pr-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {pu.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(pu.agreedPrice)}
                    </span>
                    <select
                      value={pu.status}
                      onChange={(e) => updateUpgradeStatus(pu.id, e.target.value as UpgradeStatus)}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="requested">Aangevraagd</option>
                      <option value="approved">Goedgekeurd</option>
                      <option value="in_progress">In uitvoering</option>
                      <option value="completed">Opgeleverd</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => removeUpgradeFromProject(pu.id)}
                  title="Verwijderen uit project"
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorie Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Upgrades Kaarten Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUpgrades.map((upgrade) => {
          const isAdded = projectUpgrades.some((pu) => pu.upgradeOptionId === upgrade.id);
          const isExpanded = expandedUpgradeId === upgrade.id;

          return (
            <div
              key={upgrade.id}
              className={`group flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 overflow-hidden ${
                isAdded
                  ? 'border-blue-500/80 shadow-md ring-2 ring-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
              }`}
            >
              {/* Card Header & Content */}
              <div className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    {upgrade.popular && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        <Sparkles className="w-3 h-3" />
                        Populair
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {upgrade.title}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(upgrade.estimatedCost)}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">indicatie</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {upgrade.description}
                </p>

                {upgrade.roiBadge && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {upgrade.roiBadge}
                  </div>
                )}

                {/* Deeltaken preview accordion */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => setExpandedUpgradeId(isExpanded ? null : upgrade.id)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      Inclusief {upgrade.tasksTemplate.length} gekoppelde planningstaken
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50 text-xs">
                      {upgrade.tasksTemplate.map((t, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-semibold">{t.title}</span>
                            {t.description && (
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                {t.description}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {upgrade.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {isAdded ? (
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs cursor-default"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Toegevoegd
                  </button>
                ) : (
                  <button
                    onClick={() => addUpgradeToProject(upgrade.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Toevoegen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Eigen Upgrade Toevoegen */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Eigen Meerwerk / Upgrade Toevoegen
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Titel Upgrade / Meerwerk *
                </label>
                <input
                  type="text"
                  required
                  placeholder="bijv. Quooker Flex kokendwaterkraan"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Geschat Bedrag (€) *
                  </label>
                  <input
                    type="number"
                    required
                    value={customCost}
                    onChange={(e) => setCustomCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categorie *
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as UpgradeCategory)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="technique">Techniek & Motor</option>
                    <option value="interior">Interieur & Opbouw</option>
                    <option value="equipment">Apparatuur & Keuken</option>
                    <option value="sustainability">Duurzaamheid & Accu</option>
                    <option value="branding">Branding & Styling</option>
                    <option value="custom">Maatwerk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Beschrijving
                </label>
                <textarea
                  rows={2}
                  placeholder="Korte toelichting van de werkzaamheden en levering..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Voordeel / ROI Pill
                </label>
                <input
                  type="text"
                  placeholder="bijv. Direct warm water & energiezuinig"
                  value={customRoiBadge}
                  onChange={(e) => setCustomRoiBadge(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Automatische deeltaken */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Gekoppelde Deeltaken (worden automatisch aangemaakt in de planning)
                </label>
                <input
                  type="text"
                  placeholder="Taak 1 (bijv. Leidingwerk & elektra voorbereiden)"
                  value={task1Title}
                  onChange={(e) => setTask1Title(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Taak 2 (optioneel, bijv. Montage & afmonteren kraan)"
                  value={task2Title}
                  onChange={(e) => setTask2Title(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  Opslaan in Catalogus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
