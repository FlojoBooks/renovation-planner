import React, { useState } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import { Search, X, Plus, SlidersHorizontal } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '../types';
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils';

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'blocked'];
const ALL_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

export function TopBar() {
  const {
    project,
    activeView,
    searchQuery,
    setSearchQuery,
    filterAssigneeIds,
    filterStatus,
    filterPriority,
    setFilterAssignees,
    setFilterStatus,
    setFilterPriority,
    clearFilters,
    persons,
    openTaskModal,
    ganttViewMode,
    setGanttViewMode,
  } = useRenovationStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const activeFilterCount = filterAssigneeIds.length + filterStatus.length + filterPriority.length;

  function toggleStatus(s: TaskStatus) {
    setFilterStatus(filterStatus.includes(s) ? filterStatus.filter((x) => x !== s) : [...filterStatus, s]);
  }
  function togglePriority(p: TaskPriority) {
    setFilterPriority(filterPriority.includes(p) ? filterPriority.filter((x) => x !== p) : [...filterPriority, p]);
  }
  function toggleAssignee(id: string) {
    setFilterAssignees(filterAssigneeIds.includes(id) ? filterAssigneeIds.filter((x) => x !== id) : [...filterAssigneeIds, id]);
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 relative z-10 min-h-[56px]">

      {/* Project title — shrinks on mobile */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">{project.name}</h1>
      </div>

      {/* Gantt zoom controls — hidden on very small screens */}
      {activeView === 'gantt' && (
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {(['Day', 'Week', 'Month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setGanttViewMode(mode)}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-colors badge-btn
                ${ganttViewMode === mode
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {mode === 'Day' ? 'Dag' : mode === 'Week' ? 'Week' : 'Maand'}
            </button>
          ))}
        </div>
      )}

      {/* Gantt zoom — compact on mobile */}
      {activeView === 'gantt' && (
        <div className="flex sm:hidden items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {(['Day', 'Week', 'Month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setGanttViewMode(mode)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors badge-btn
                ${ganttViewMode === mode
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'}`}
            >
              {mode === 'Day' ? 'D' : mode === 'Week' ? 'W' : 'M'}
            </button>
          ))}
        </div>
      )}

      {/* Search — full on desktop, icon-only toggle on mobile */}
      <div className="relative hidden sm:block w-48 lg:w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Zoek taken..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            bg-slate-50 dark:bg-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 badge-btn">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Mobile search toggle */}
      <button
        onClick={() => setShowSearch(!showSearch)}
        className="sm:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg badge-btn"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Filter button */}
      <div className="relative">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-medium border transition-colors badge-btn
            ${showFilters || activeFilterCount > 0
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-100'}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold badge-btn">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter dropdown */}
        {showFilters && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">Filters</span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-800 font-medium badge-btn">
                  Wis alles
                </button>
              )}
            </div>
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUSES.map((s) => (
                  <button key={s} onClick={() => toggleStatus(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors badge-btn
                      ${filterStatus.includes(s)
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">Prioriteit</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PRIORITIES.map((p) => (
                  <button key={p} onClick={() => togglePriority(p)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors badge-btn
                      ${filterPriority.includes(p)
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">Persoon</p>
              <div className="flex flex-wrap gap-1.5">
                {persons.map((p) => (
                  <button key={p.id} onClick={() => toggleAssignee(p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors badge-btn
                      ${filterAssigneeIds.includes(p.id) ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    style={filterAssigneeIds.includes(p.id) ? { backgroundColor: p.color } : {}}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold badge-btn"
                      style={{ backgroundColor: filterAssigneeIds.includes(p.id) ? 'rgba(255,255,255,0.3)' : p.color }}>
                      {p.avatarInitials[0]}
                    </span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add task button */}
      <button
        onClick={() => openTaskModal()}
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700
          text-white rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0 badge-btn"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Taak</span>
      </button>

      {/* Close filter panel when clicking outside */}
      {showFilters && (
        <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
      )}

      {/* Mobile search bar (expands below header) */}
      {showSearch && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 z-30 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Zoek taken..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-8 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" />
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 badge-btn">
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 badge-btn">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
