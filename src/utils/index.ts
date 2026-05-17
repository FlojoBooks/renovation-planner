import { format, parseISO, differenceInDays, isAfter, isBefore, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { TaskStatus, TaskPriority, MaterialStatus, SubprojectColor, BudgetCategory } from '../types';

// ── ID Generation ──────────────────────────────────────────
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Date Utilities ─────────────────────────────────────────
export function formatDate(dateStr: string, fmt = 'd MMM yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: nl });
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  return formatDate(dateStr, 'd MMM');
}

export function formatISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getDurationDays(startDate: string, endDate: string): number {
  try {
    return Math.max(1, differenceInDays(parseISO(endDate), parseISO(startDate)));
  } catch {
    return 1;
  }
}

export function isOverdue(endDate: string, status: TaskStatus): boolean {
  if (status === 'done') return false;
  try {
    return isAfter(new Date(), parseISO(endDate));
  } catch {
    return false;
  }
}

export function isDueToday(endDate: string): boolean {
  try {
    return isToday(parseISO(endDate));
  } catch {
    return false;
  }
}

export function isDueSoon(endDate: string, withinDays = 3): boolean {
  try {
    const end = parseISO(endDate);
    const now = new Date();
    return isAfter(end, now) && differenceInDays(end, now) <= withinDays;
  } catch {
    return false;
  }
}

// ── Status Labels & Colors ─────────────────────────────────
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Te doen',
  in_progress: 'In uitvoering',
  done: 'Klaar',
  blocked: 'Geblokkeerd',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

export const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  done: 'bg-green-500',
  blocked: 'bg-red-500',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Laag',
  medium: 'Normaal',
  high: 'Hoog',
  critical: 'Kritiek',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-500',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600',
};

export const PRIORITY_ICON_COLORS: Record<TaskPriority, string> = {
  low: 'text-slate-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  needed: 'Nodig',
  ordered: 'Besteld',
  delivered: 'Geleverd',
  installed: 'Gemonteerd',
  returned: 'Geretourneerd',
};

export const MATERIAL_STATUS_COLORS: Record<MaterialStatus, string> = {
  needed: 'bg-red-100 text-red-600',
  ordered: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-blue-100 text-blue-700',
  installed: 'bg-green-100 text-green-700',
  returned: 'bg-gray-100 text-gray-500',
};

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  materials: 'Materialen',
  labor: 'Arbeid',
  tools: 'Gereedschap',
  permits: 'Vergunningen',
  design: 'Ontwerp',
  contingency: 'Onvoorzien',
  other: 'Overig',
};

// ── Subproject Colors ──────────────────────────────────────
export const SUBPROJECT_COLOR_MAP: Record<SubprojectColor, { bg: string; text: string; border: string; dot: string; gantt: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',   gantt: '#3b82f6' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500',  gantt: '#22c55e' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', gantt: '#f97316' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',    gantt: '#ef4444' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', gantt: '#a855f7' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500', gantt: '#eab308' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200',   dot: 'bg-pink-500',   gantt: '#ec4899' },
  cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   dot: 'bg-cyan-500',   gantt: '#06b6d4' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-500',   gantt: '#14b8a6' },
};

export const SUBPROJECT_COLOR_OPTIONS: SubprojectColor[] = [
  'blue', 'green', 'orange', 'red', 'purple', 'yellow', 'pink', 'cyan', 'teal',
];

// ── Currency Formatting ────────────────────────────────────
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

// ── String Utilities ───────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── Progress Color ─────────────────────────────────────────
export function getProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-green-500';
  if (progress >= 60) return 'bg-blue-500';
  if (progress >= 30) return 'bg-yellow-500';
  return 'bg-slate-300';
}

// ── Local Storage Persistence ──────────────────────────────
const STORAGE_KEY = 'renovation_planner_v1';

export function saveToStorage<T>(data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export function loadFromStorage<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
