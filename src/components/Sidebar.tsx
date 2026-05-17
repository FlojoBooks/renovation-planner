import React, { useState } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import {
  LayoutGrid,
  List,
  GanttChart,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Plus,
  Home,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import type { ActiveView } from '../types';
import { SUBPROJECT_COLOR_MAP } from '../utils';
import { SubprojectManagementModal } from './SubprojectManagementModal';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'gantt',  label: 'Gantt',     icon: GanttChart },
  { id: 'kanban', label: 'Kanban',    icon: LayoutGrid },
  { id: 'list',   label: 'Lijst',     icon: List },
  { id: 'budget', label: 'Budget',    icon: Wallet },
];

export function Sidebar() {
  const {
    isSidebarCollapsed,
    toggleSidebar,
    activeView,
    setActiveView,
    subprojects,
    activeSubprojectId,
    setActiveSubproject,
    toggleSubprojectCollapsed,
    tasks,
    isDarkMode,
    toggleDarkMode,
    openPersonsModal,
  } = useRenovationStore();

  const collapsed = isSidebarCollapsed;
  const [showSubprojectModal, setShowSubprojectModal] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-slate-900 dark:bg-slate-950 text-white transition-all duration-300 relative
        border-r border-transparent dark:border-slate-800
        ${collapsed ? 'w-16' : 'w-64'} min-h-screen shrink-0`}
    >
      {/* Logo / Header */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-slate-700 dark:border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
          <Home className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white dark:text-white truncate">Verbouwing</p>
            <p className="text-xs text-slate-400 dark:text-slate-400 truncate">Planner 2025</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 bg-slate-700 dark:bg-slate-800 border border-slate-600 dark:border-slate-700 rounded-full
          flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600
          transition-colors z-10 shadow-md"
        title={collapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="px-2 pt-4 pb-2">
        {!collapsed && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
            Weergave
          </p>
        )}
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => setActiveView(id)}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium
                  transition-colors group
                  ${activeView === id
                    ? 'bg-primary-600 dark:bg-primary-700 text-white'
                    : 'text-slate-300 dark:text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-800 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Divider */}
      <div className="border-t border-slate-700 dark:border-slate-800 my-2" />

      {/* Subprojects */}
      <div className="flex-1 overflow-y-auto px-2">
        {!collapsed && (
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider">
              Fases
            </p>
            <button
              onClick={() => setShowSubprojectModal(true)}
              className="text-slate-400 hover:text-white transition-colors"
              title="Fase toevoegen"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <ul className="space-y-0.5">
          {/* "Alle fases" option */}
          <li>
            <button
              onClick={() => setActiveSubproject(null)}
              title={collapsed ? 'Alle fases' : undefined}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors
                ${activeSubprojectId === null
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 dark:text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-800 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
            >
              <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              {!collapsed && <span className="truncate">Alle fases</span>}
            </button>
          </li>

          {subprojects
            .sort((a, b) => a.order - b.order)
            .map((sp) => {
              const colorConfig = SUBPROJECT_COLOR_MAP[sp.color];
              const taskCount = tasks.filter((t) => t.subprojectId === sp.id).length;
              const doneCount = tasks.filter((t) => t.subprojectId === sp.id && t.isCompleted).length;

              return (
                <li key={sp.id}>
                  <button
                    onClick={() => setActiveSubproject(sp.id)}
                    title={collapsed ? sp.name : undefined}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors
                      ${activeSubprojectId === sp.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-300 dark:text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-800 hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: colorConfig.gantt }}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{sp.name}</span>
                        <span className="text-xs text-slate-500 shrink-0">
                          {doneCount}/{taskCount}
                        </span>
                      </>
                    )}
                  </button>
                </li>
              );
            })}
        </ul>

        {collapsed && (
          <button
            onClick={() => setShowSubprojectModal(true)}
            className="w-full flex justify-center px-2 py-2 mt-1 text-slate-500 hover:text-white transition-colors"
            title="Fase toevoegen"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 dark:border-slate-800 p-2 space-y-0.5">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-slate-400
            hover:bg-slate-800 hover:text-white transition-colors
            ${collapsed ? 'justify-center' : ''}`}
          title={isDarkMode ? 'Licht thema' : 'Donker thema'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{isDarkMode ? 'Licht thema' : 'Donker thema'}</span>}
        </button>

        {/* Settings / Persons */}
        <button
          onClick={openPersonsModal}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-slate-400
            hover:bg-slate-800 hover:text-white transition-colors
            ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Instellingen' : undefined}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Instellingen</span>}
        </button>
      </div>

      {/* Subproject management modal */}
      {showSubprojectModal && <SubprojectManagementModal onClose={() => setShowSubprojectModal(false)} />}
    </aside>
  );
}
