import React from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_DOT_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  SUBPROJECT_COLOR_MAP,
  formatShortDate,
  isOverdue,
  getProgressColor,
} from '../utils';
import { CheckCircle2, Circle, Calendar, AlertTriangle, ChevronDown, ChevronRight, Plus } from 'lucide-react';

export function ListView() {
  const {
    subprojects,
    getFilteredTasks,
    toggleTaskComplete,
    openTaskModal,
    toggleSubprojectCollapsed,
    persons,
  } = useRenovationStore();

  const allTasks = getFilteredTasks();

  return (
    <div className="h-full overflow-auto p-6 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-4">
        {subprojects
          .sort((a, b) => a.order - b.order)
          .map((sp) => {
            const spTasks = allTasks.filter((t) => t.subprojectId === sp.id).sort((a, b) => a.order - b.order);
            if (spTasks.length === 0 && allTasks.length !== 0) return null;
            const colorCfg = SUBPROJECT_COLOR_MAP[sp.color];
            const doneCount = spTasks.filter((t) => t.isCompleted).length;

            return (
              <div key={sp.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                {/* Subproject header */}
                <button
                  onClick={() => toggleSubprojectCollapsed(sp.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-700"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: colorCfg.gantt }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1 text-left">{sp.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    {doneCount}/{spTasks.length} klaar
                  </span>
                  {/* Mini progress bar */}
                  <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${spTasks.length > 0 ? (doneCount / spTasks.length) * 100 : 0}%`,
                        backgroundColor: colorCfg.gantt,
                      }}
                    />
                  </div>
                  {sp.isCollapsed
                    ? <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {/* Tasks table */}
                {!sp.isCollapsed && (
                  <>
                    {/* Table header — hidden on mobile */}
                    <div className="hidden md:grid grid-cols-[1fr_120px_120px_100px_80px_80px] gap-3 px-5 py-2.5
                      bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>Taak</span>
                      <span>Status</span>
                      <span>Prioriteit</span>
                      <span>Personen</span>
                      <span>Deadline</span>
                      <span className="text-right">Voortgang</span>
                    </div>

                    {/* Task rows */}
                    {spTasks.map((task) => {
                      const overdue = isOverdue(task.endDate, task.status);
                      return (
                        <div
                          key={task.id}
                          className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_120px_100px_80px_80px] gap-3 px-4 md:px-5 py-3
                            border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors items-center
                            cursor-pointer group"
                          onClick={() => openTaskModal(task.id)}
                        >
                          {/* Title + complete */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id); }}
                              className="shrink-0 text-slate-300 hover:text-green-500 transition-colors"
                            >
                              {task.isCompleted
                                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                : <Circle className="w-4 h-4" />}
                            </button>
                            <span className={`text-sm font-medium truncate
                              ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}
                              group-hover:text-primary-600 transition-colors`}>
                              {task.title}
                            </span>
                            {task.dependencies.length > 0 && (
                              <span className="shrink-0 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                dep
                              </span>
                            )}
                          </div>

                          {/* Status — hidden on mobile */}
                          <span className={`hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit
                            ${STATUS_COLORS[task.status]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[task.status]}`} />
                            {STATUS_LABELS[task.status]}
                          </span>

                          {/* Priority — hidden on mobile */}
                          <span className={`hidden md:inline-block text-xs font-medium px-2.5 py-1 rounded-full w-fit
                            ${PRIORITY_COLORS[task.priority]}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>

                          {/* Assignees — hidden on mobile */}
                          <div className="hidden md:flex items-center gap-0.5">
                            {task.assigneeIds.slice(0, 3).map((aid) => {
                              const person = persons.find((p) => p.id === aid);
                              if (!person) return null;
                              return (
                                <span
                                  key={aid}
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-white dark:border-slate-900 -ml-1 first:ml-0"
                                  style={{ backgroundColor: person.color }}
                                  title={person.name}
                                >
                                  {person.avatarInitials}
                                </span>
                              );
                            })}
                          </div>

                          {/* Deadline — hidden on mobile */}
                          <span className={`hidden md:flex text-xs items-center gap-1
                            ${overdue ? 'text-red-500 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                            {overdue && <AlertTriangle className="w-3 h-3" />}
                            {formatShortDate(task.endDate)}
                          </span>

                          {/* Progress — hidden on mobile */}
                          <div className="hidden md:flex items-center gap-2 justify-end">
                            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getProgressColor(task.progress)}`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-7 text-right">{task.progress}%</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add task row */}
                    <button
                      onClick={() => openTaskModal()}
                      className="w-full flex items-center gap-2 px-5 py-3 text-sm text-slate-400 dark:text-slate-500
                        hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Taak toevoegen aan {sp.name}</span>
                    </button>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
