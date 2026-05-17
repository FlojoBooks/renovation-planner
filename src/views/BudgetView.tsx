import React, { useState } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import {
  formatCurrency,
  SUBPROJECT_COLOR_MAP,
  BUDGET_CATEGORY_LABELS,
  MATERIAL_STATUS_LABELS,
  MATERIAL_STATUS_COLORS,
} from '../utils';
import type { BudgetCategory } from '../types';
import { TrendingUp, TrendingDown, ShoppingCart, CheckCircle, Package, AlertCircle } from 'lucide-react';

export function BudgetView() {
  const { getBudgetSummary, subprojects, materials, project } = useRenovationStore();
  const summary = getBudgetSummary();
  const [activeTab, setActiveTab] = useState<'overview' | 'shopping'>('overview');

  const budgetUsedPct = summary.totalEstimated > 0
    ? Math.min(100, (summary.totalActual / summary.totalEstimated) * 100)
    : 0;

  const projectBudgetPct = project.totalBudget > 0
    ? Math.min(100, (summary.totalEstimated / project.totalBudget) * 100)
    : 0;

  // Shopping list = materials not yet delivered or installed
  const shoppingList = materials.filter((m) => m.status === 'needed' || m.status === 'ordered');
  const neededMaterials = materials.filter((m) => m.status === 'needed');
  const orderedMaterials = materials.filter((m) => m.status === 'ordered');

  return (
    <div className="h-full overflow-auto p-6 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            title="Totaalbudget"
            value={formatCurrency(project.totalBudget)}
            sub={`${Math.round(projectBudgetPct)}% ingepland`}
            color="blue"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <KpiCard
            title="Begroot"
            value={formatCurrency(summary.totalEstimated)}
            sub={`van ${formatCurrency(project.totalBudget)}`}
            color="indigo"
            icon={<Package className="w-5 h-5" />}
          />
          <KpiCard
            title="Werkelijk"
            value={formatCurrency(summary.totalActual)}
            sub={`${Math.round(budgetUsedPct)}% van begroot`}
            color={summary.totalActual > summary.totalEstimated ? 'red' : 'green'}
            icon={summary.totalActual > summary.totalEstimated
              ? <TrendingDown className="w-5 h-5" />
              : <TrendingUp className="w-5 h-5" />}
          />
          <KpiCard
            title="Betaald"
            value={formatCurrency(summary.totalPaid)}
            sub={`${formatCurrency(summary.totalEstimated - summary.totalPaid)} openstaand`}
            color="orange"
            icon={<CheckCircle className="w-5 h-5" />}
          />
        </div>

        {/* Budget vs Actual bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Budget vs. werkelijk per fase</h3>
          <div className="space-y-4">
            {subprojects.sort((a, b) => a.order - b.order).map((sp) => {
              const spBudget = summary.bySubproject[sp.id];
              if (!spBudget) return null;
              const colorCfg = SUBPROJECT_COLOR_MAP[sp.color];
              const pct = spBudget.estimated > 0
                ? Math.min(100, (spBudget.actual / spBudget.estimated) * 100)
                : 0;
              const over = spBudget.actual > spBudget.estimated;

              return (
                <div key={sp.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorCfg.gantt }} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{sp.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={over ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-300'}>
                        {formatCurrency(spBudget.actual)}
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-500 dark:text-slate-400">{formatCurrency(spBudget.estimated)}</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: over ? '#ef4444' : colorCfg.gantt,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs: overview vs shopping */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors
                ${activeTab === 'overview'
                  ? 'text-primary-700 border-b-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Categorieën
            </button>
            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2
                ${activeTab === 'shopping'
                  ? 'text-primary-700 border-b-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <ShoppingCart className="w-4 h-4" />
              Boodschappenlijst
              {neededMaterials.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {neededMaterials.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(BUDGET_CATEGORY_LABELS) as BudgetCategory[]).map((cat) => {
                  const amount = summary.byCategory[cat] || 0;
                  if (amount === 0) return null;
                  return (
                    <div key={cat} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{BUDGET_CATEGORY_LABELS[cat]}</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'shopping' && (
            <div className="p-6">
              {shoppingList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">Alle materialen zijn besteld of geleverd! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Needed first */}
                  {neededMaterials.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                          Nog te bestellen ({neededMaterials.length})
                        </span>
                      </div>
                      {neededMaterials.map((mat) => (
                        <MaterialShoppingRow key={mat.id} materialId={mat.id} />
                      ))}
                    </>
                  )}
                  {orderedMaterials.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mt-5 mb-3">
                        <Package className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">
                          Besteld, wacht op levering ({orderedMaterials.length})
                        </span>
                      </div>
                      {orderedMaterials.map((mat) => (
                        <MaterialShoppingRow key={mat.id} materialId={mat.id} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  color,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'indigo';
  icon: React.ReactNode;
}) {
  const colorMap = {
    blue:   'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
    green:  'bg-green-50 dark:bg-green-900/30 text-green-600',
    red:    'bg-red-50 dark:bg-red-900/30 text-red-600',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        <span className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function MaterialShoppingRow({ materialId }: { materialId: string }) {
  const { materials, updateMaterialStatus, tasks, getSubprojectById } = useRenovationStore();
  const mat = materials.find((m) => m.id === materialId);
  if (!mat) return null;
  const task = tasks.find((t) => t.id === mat.taskId);
  const subproject = task ? getSubprojectById(task.subprojectId) : null;

  return (
    <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{mat.name}</p>
          {subproject && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded text-white shrink-0"
              style={{ backgroundColor: SUBPROJECT_COLOR_MAP[subproject.color].gantt }}
            >
              {subproject.name}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {mat.quantity} {mat.unit} × {formatCurrency(mat.unitPrice)} = {formatCurrency(mat.totalPrice)}
          {mat.supplier && <span className="ml-2 text-slate-400">• {mat.supplier}</span>}
        </p>
      </div>

      {/* Status selector */}
      <select
        value={mat.status}
        onChange={(e) => updateMaterialStatus(mat.id, e.target.value as any)}
        onClick={(e) => e.stopPropagation()}
        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border-0 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-primary-500
          ${MATERIAL_STATUS_COLORS[mat.status]}`}
      >
        {(['needed', 'ordered', 'delivered', 'installed'] as const).map((s) => (
          <option key={s} value={s}>{MATERIAL_STATUS_LABELS[s]}</option>
        ))}
      </select>
    </div>
  );
}
