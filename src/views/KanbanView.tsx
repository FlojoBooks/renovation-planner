import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { useRenovationStore } from '../store/useRenovationStore';
import type { Task, TaskStatus } from '../types';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  PRIORITY_ICON_COLORS,
  SUBPROJECT_COLOR_MAP,
  formatShortDate,
  isOverdue,
} from '../utils';
import { Calendar, User, AlertTriangle, CheckCircle2, Circle, Clock } from 'lucide-react';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo',        label: 'Te doen' },
  { id: 'in_progress', label: 'In uitvoering' },
  { id: 'blocked',     label: 'Geblokkeerd' },
  { id: 'done',        label: 'Klaar' },
];

// ─── TaskCard ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  isDraggingId: string | null;
}

function TaskCard({ task, onDragStart, onDragEnd, isDraggingId }: TaskCardProps) {
  const { persons, getSubprojectById, openTaskModal, toggleTaskComplete } = useRenovationStore();
  const subproject = getSubprojectById(task.subprojectId);
  const colorCfg = subproject ? SUBPROJECT_COLOR_MAP[subproject.color] : null;
  const overdue = isOverdue(task.endDate, task.status);
  const isDragging = isDraggingId === task.id;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => openTaskModal(task.id)}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-sm
        hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-grab active:cursor-grabbing group
        select-none
        ${isDragging ? 'opacity-50 scale-95 shadow-lg ring-2 ring-primary-400' : ''}`}
    >
      {/* Subproject badge + Priority pill */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {subproject && colorCfg && (
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
            ${colorCfg.bg} ${colorCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colorCfg.dot}`} />
            {subproject.name}
          </div>
        )}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
          ${PRIORITY_COLORS[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {/* Title + complete toggle */}
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id); }}
          className="mt-0.5 shrink-0 text-slate-300 hover:text-green-500 transition-colors"
        >
          {task.isCompleted
            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
            : <Circle className="w-4 h-4" />}
        </button>
        <p className={`text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 flex-1
          ${task.isCompleted ? 'line-through text-slate-400' : ''}`}>
          {task.title}
        </p>
        {/* Drag handle — altijd zichtbaar op touch, subtiel op desktop */}
        <span
          className="shrink-0 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity mt-0.5"
          aria-hidden="true"
          title="Slepen"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
        {/* Due date */}
        <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
          {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          {formatShortDate(task.endDate)}
        </span>

        {/* Progress */}
        {task.progress > 0 && task.progress < 100 && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.progress}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {task.progress > 0 && task.progress < 100 && (
        <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}

      {/* Assignees */}
      {task.assigneeIds.length > 0 && (
        <div className="flex items-center gap-1 mt-2.5">
          {task.assigneeIds.slice(0, 3).map((aid) => {
            const person = persons.find((p) => p.id === aid);
            if (!person) return null;
            return (
              <span
                key={aid}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold -ml-1 first:ml-0 border-2 border-white dark:border-slate-800"
                style={{ backgroundColor: person.color }}
                title={person.name}
              >
                {person.avatarInitials}
              </span>
            );
          })}
          {task.assigneeIds.length > 3 && (
            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold flex items-center justify-center -ml-1 border-2 border-white dark:border-slate-800">
              +{task.assigneeIds.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  isDraggingId: string | null;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

function KanbanColumn({ id, label, tasks, isDraggingId, onDragStart, onDragEnd }: KanbanColumnProps) {
  const { updateTask } = useRenovationStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Alleen resetten als we écht de kolom verlaten (niet naar een child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTask(taskId, { status: id });
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col w-72 rounded-2xl border overflow-hidden transition-all duration-150
        ${isDragOver
          ? 'bg-primary-50 dark:bg-primary-950 border-primary-400 dark:border-primary-500 ring-2 ring-primary-400 ring-offset-1'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
        }`}
    >
      {/* Column header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors duration-150
        ${isDragOver
          ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
        }`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[id]}`}>
            {label}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 w-5 h-5 rounded-full flex items-center justify-center">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {tasks.length === 0 && (
          <div className={`text-center py-8 text-xs transition-colors duration-150
            ${isDragOver
              ? 'text-primary-400 dark:text-primary-500'
              : 'text-slate-400 dark:text-slate-600'
            }`}>
            {isDragOver ? '+ Laat los om hier te plaatsen' : 'Geen taken'}
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDraggingId={isDraggingId}
          />
        ))}
        {/* Drop zone onderaan als kolom al taken heeft */}
        {tasks.length > 0 && isDragOver && (
          <div className="h-2 rounded-full bg-primary-300 dark:bg-primary-700 opacity-60 transition-all animate-pulse" />
        )}
      </div>
    </div>
  );
}

// ─── KanbanView ───────────────────────────────────────────────────────────────

export function KanbanView() {
  const { getFilteredTasks } = useRenovationStore();
  const tasks = getFilteredTasks();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Kleine vertraging zodat de opacity-50 pas zichtbaar is nádat de drag-ghost is aangemaakt
    requestAnimationFrame(() => setDraggingId(taskId));
  };

  const handleDragEnd = (_e: React.DragEvent<HTMLDivElement>) => {
    setDraggingId(null);
  };

  return (
    <div className="h-full overflow-x-auto p-6 dark:bg-slate-950">
      <div className="flex gap-4 h-full min-w-max">
        {COLUMNS.map(({ id, label }) => {
          const colTasks = tasks.filter((t) => t.status === id);
          return (
            <KanbanColumn
              key={id}
              id={id}
              label={label}
              tasks={colTasks}
              isDraggingId={draggingId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </div>
    </div>
  );
}
