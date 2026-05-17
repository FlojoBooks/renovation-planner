import React, { useRef, useCallback } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import {
  parseISO, differenceInDays, addDays, format,
  eachWeekOfInterval, eachMonthOfInterval,
  startOfMonth, endOfMonth, eachDayOfInterval,
  isSunday, isWeekend,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { SUBPROJECT_COLOR_MAP, STATUS_DOT_COLORS } from '../utils';
import type { Task, Subproject } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────
const ROW_HEIGHT = 40;
const SUBPROJECT_ROW_HEIGHT = 36;
const HEADER_HEIGHT = 60;
const LABEL_WIDTH = 260;
const DAY_WIDTH = { Day: 40, Week: 140, Month: 40 } as const;
type ViewMode = 'Day' | 'Week' | 'Month';

// ── Date helpers ───────────────────────────────────────────
function getDateRange(tasks: Task[], subprojects: Subproject[]) {
  const allDates = [
    ...tasks.map((t) => t.startDate),
    ...tasks.map((t) => t.endDate),
    ...subprojects.map((s) => s.startDate),
    ...subprojects.map((s) => s.endDate),
  ].map((d) => parseISO(d));

  if (allDates.length === 0) {
    const today = new Date();
    return { start: addDays(today, -7), end: addDays(today, 60) };
  }
  const min = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const max = new Date(Math.max(...allDates.map((d) => d.getTime())));
  return { start: addDays(min, -7), end: addDays(max, 14) };
}

function dateToX(date: Date, rangeStart: Date, cellWidth: number): number {
  return differenceInDays(date, rangeStart) * cellWidth;
}

// ── GanttBar with mouse + touch drag + progress resize ────
interface GanttBarProps {
  task: Task;
  rangeStart: Date;
  cellWidth: number;
  subprojectColor: string;
  onTaskClick: (id: string) => void;
  onTaskDrag: (id: string, newStartDate: string, newEndDate: string) => void;
  onProgressChange: (id: string, progress: number) => void;
  darkMode: boolean;
}

function GanttBar({
  task, rangeStart, cellWidth, subprojectColor,
  onTaskClick, onTaskDrag, onProgressChange, darkMode,
}: GanttBarProps) {
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const originalStart = useRef(parseISO(task.startDate));

  const startDrag = useCallback(
    (clientX: number) => {
      isDragging.current = true;
      dragStartX.current = clientX;
      originalStart.current = parseISO(task.startDate);
    },
    [task.startDate]
  );

  const moveDrag = useCallback(
    (clientX: number) => {
      if (!isDragging.current) return;
      const deltaX = clientX - dragStartX.current;
      const deltaDays = Math.round(deltaX / cellWidth);
      const newStart = addDays(originalStart.current, deltaDays);
      const duration = differenceInDays(parseISO(task.endDate), parseISO(task.startDate));
      const newEnd = addDays(newStart, duration);
      onTaskDrag(task.id, format(newStart, 'yyyy-MM-dd'), format(newEnd, 'yyyy-MM-dd'));
    },
    [task, cellWidth, onTaskDrag]
  );

  const endDrag = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startDrag(e.clientX);

      const onMove = (me: MouseEvent) => moveDrag(me.clientX);
      const onUp = () => {
        endDrag();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [startDrag, moveDrag, endDrag]
  );

  // Touch events (mobile support)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startDrag(touch.clientX);

      const onMove = (te: TouchEvent) => {
        te.preventDefault();
        moveDrag(te.touches[0].clientX);
      };
      const onEnd = () => {
        endDrag();
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      };
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    },
    [startDrag, moveDrag, endDrag]
  );

  const start = parseISO(task.startDate);
  const end = parseISO(task.endDate);
  const x = dateToX(start, rangeStart, cellWidth);
  const width = Math.max(cellWidth, differenceInDays(end, start) * cellWidth);
  const progressWidth = Math.round(width * (task.progress / 100));
  const textFill = task.isCompleted
    ? '#15803d'
    : darkMode ? '#e2e8f0' : '#1e293b';

  return (
    <g
      style={{ cursor: 'grab' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={(e) => { e.stopPropagation(); onTaskClick(task.id); }}
    >
      {/* Main bar */}
      <rect x={x} y={ROW_HEIGHT / 2 - 11} width={width} height={22} rx={4}
        fill={task.isCompleted ? '#86efac' : subprojectColor + '33'}
        stroke={task.isCompleted ? '#22c55e' : subprojectColor} strokeWidth={1.5} />

      {/* Progress fill */}
      {task.progress > 0 && !task.isCompleted && (
        <rect x={x} y={ROW_HEIGHT / 2 - 11} width={progressWidth} height={22} rx={4}
          fill={subprojectColor + '88'} />
      )}

      {/* Task label */}
      <text x={x + 6} y={ROW_HEIGHT / 2 + 4} fontSize={10}
        fill={textFill} fontWeight="500"
        style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {task.title.length > Math.floor(width / 7)
          ? task.title.slice(0, Math.floor(width / 7) - 2) + '…'
          : task.title}
      </text>

      {/* Voortgang resize handle — rechterrand */}
      {!task.isCompleted && (
        <rect
          x={x + progressWidth - 4}
          y={ROW_HEIGHT / 2 - 11}
          width={8}
          height={22}
          rx={2}
          fill={subprojectColor}
          opacity={0.8}
          style={{ cursor: 'ew-resize' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const startX = e.clientX;
            const startProgress = task.progress;
            const onMove = (me: MouseEvent) => {
              const delta = me.clientX - startX;
              const deltaProgress = Math.round((delta / width) * 100);
              const newProgress = Math.max(0, Math.min(100, startProgress + deltaProgress));
              onProgressChange(task.id, newProgress);
            };
            const onUp = () => {
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
        />
      )}
    </g>
  );
}

// ── Row structure types ────────────────────────────────────
type Row =
  | { type: 'subproject'; subproject: Subproject; height: number }
  | { type: 'task'; task: Task; subproject: Subproject; height: number };

// ── Main GanttView ─────────────────────────────────────────
export function GanttView() {
  const {
    subprojects,
    ganttViewMode,
    getFilteredTasks,
    openTaskModal,
    updateTaskDates,
    updateTask,
    toggleSubprojectCollapsed,
    isDarkMode,
  } = useRenovationStore();

  const allTasks = getFilteredTasks();
  const mode = ganttViewMode as ViewMode;
  const cellWidth = DAY_WIDTH[mode];
  const { start: rangeStart, end: rangeEnd } = getDateRange(allTasks, subprojects);
  const darkMode = isDarkMode;
  const today = new Date();

  // ── Synchronized scroll refs ───────────────────────────
  const labelPanelRef = useRef<HTMLDivElement>(null);
  const svgPanelRef = useRef<HTMLDivElement>(null);
  const syncingLabel = useRef(false);
  const syncingSvg = useRef(false);

  const onLabelScroll = useCallback(() => {
    if (syncingSvg.current) return;
    syncingLabel.current = true;
    if (svgPanelRef.current && labelPanelRef.current) {
      svgPanelRef.current.scrollTop = labelPanelRef.current.scrollTop;
    }
    syncingLabel.current = false;
  }, []);

  const onSvgScroll = useCallback(() => {
    if (syncingLabel.current) return;
    syncingSvg.current = true;
    if (labelPanelRef.current && svgPanelRef.current) {
      labelPanelRef.current.scrollTop = svgPanelRef.current.scrollTop;
    }
    syncingSvg.current = false;
  }, []);

  // ── SVG click: open new task modal ────────────────────
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const tag = (e.target as SVGElement).tagName;
      if (tag === 'svg' || tag === 'rect' || tag === 'line') {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + (svgPanelRef.current?.scrollLeft ?? 0);
        const dayOffset = Math.floor(x / cellWidth);
        const clickedDate = addDays(rangeStart, dayOffset);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _dateStr = format(clickedDate, 'yyyy-MM-dd');
        // Open modal — datum integratie is toekomstig
        openTaskModal();
      }
    },
    [cellWidth, rangeStart, openTaskModal]
  );

  // ── Two-layer column headers ───────────────────────────
  // Bottom row: individual columns
  let columns: { label: string; date: Date; span: number; isWeekend?: boolean; isSun?: boolean; isToday?: boolean }[] = [];

  if (mode === 'Day') {
    columns = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((d) => ({
      label: format(d, 'EEE d', { locale: nl }),
      date: d,
      span: 1,
      isWeekend: isWeekend(d),
      isSun: isSunday(d),
      isToday: format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
    }));
  } else if (mode === 'Week') {
    columns = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 }).map((d) => ({
      label: `w${format(d, 'w')} — ${format(d, 'd MMM', { locale: nl })}`,
      date: d,
      span: 7,
    }));
  } else {
    columns = eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map((d) => ({
      label: format(d, 'MMM', { locale: nl }),
      date: d,
      span: differenceInDays(endOfMonth(d), startOfMonth(d)) + 1,
    }));
  }

  // Top row groups
  let topGroups: { label: string; x: number; width: number }[] = [];
  if (mode === 'Day' || mode === 'Week') {
    topGroups = eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const clampedStart = monthStart < rangeStart ? rangeStart : monthStart;
      const clampedEnd = monthEnd > rangeEnd ? rangeEnd : monthEnd;
      return {
        label: format(monthStart, 'MMMM yyyy', { locale: nl }),
        x: dateToX(clampedStart, rangeStart, cellWidth),
        width: (differenceInDays(clampedEnd, clampedStart) + 1) * cellWidth,
      };
    });
  } else {
    // Month mode: group by year
    const years = [
      ...new Set(
        eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map((d) => d.getFullYear())
      ),
    ];
    topGroups = years.map((year) => {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const clampedStart = yearStart < rangeStart ? rangeStart : yearStart;
      const clampedEnd = yearEnd > rangeEnd ? rangeEnd : yearEnd;
      return {
        label: String(year),
        x: dateToX(clampedStart, rangeStart, cellWidth),
        width: (differenceInDays(clampedEnd, clampedStart) + 1) * cellWidth,
      };
    });
  }

  const totalWidth = differenceInDays(rangeEnd, rangeStart) * cellWidth;

  // ── Build row structure ────────────────────────────────
  const rows: Row[] = [];
  subprojects.sort((a, b) => a.order - b.order).forEach((sp) => {
    rows.push({ type: 'subproject', subproject: sp, height: SUBPROJECT_ROW_HEIGHT });
    if (!sp.isCollapsed) {
      const spTasks = allTasks.filter((t) => t.subprojectId === sp.id).sort((a, b) => a.order - b.order);
      spTasks.forEach((task) => {
        rows.push({ type: 'task', task, subproject: sp, height: ROW_HEIGHT });
      });
    }
  });

  // Compute cumulative Y offsets for SVG
  const rowYOffsets: number[] = [];
  let cumY = 0;
  rows.forEach((row) => {
    rowYOffsets.push(cumY);
    cumY += row.height;
  });
  const totalRowsHeight = cumY;
  const svgHeight = HEADER_HEIGHT + totalRowsHeight + 20;

  const todayX = dateToX(new Date(), rangeStart, cellWidth);

  // Build a lookup: taskId → SVG Y center for dependency arrows
  const taskYCenter: Record<string, number> = {};
  rows.forEach((row, i) => {
    if (row.type === 'task') {
      taskYCenter[row.task.id] = HEADER_HEIGHT + rowYOffsets[i] + ROW_HEIGHT / 2;
    }
  });

  // SVG color helpers
  const headerBg = darkMode ? '#0f172a' : '#f8fafc';
  const headerLineFill = darkMode ? '#1e293b' : '#e2e8f0';
  const headerTextFill = darkMode ? '#94a3b8' : '#64748b';
  const arrowFill = darkMode ? '#475569' : '#94a3b8';

  function rowFill(row: Row, i: number): string {
    if (row.type === 'subproject') return darkMode ? '#0f172a' : '#f8fafc';
    return i % 2 === 0 ? (darkMode ? '#111827' : '#ffffff') : (darkMode ? '#0f172a' : '#fafafa');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left label panel ─────────────────────────── */}
        <div
          ref={labelPanelRef}
          onScroll={onLabelScroll}
          className="shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto overflow-x-hidden"
          style={{ width: LABEL_WIDTH }}
        >
          {/* Header spacer */}
          <div
            className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 flex items-center shrink-0"
            style={{ height: HEADER_HEIGHT }}
          >
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Taak</span>
          </div>

          {/* Rows */}
          {rows.map((row, i) => {
            if (row.type === 'subproject') {
              const colorCfg = SUBPROJECT_COLOR_MAP[row.subproject.color];
              const taskCount = allTasks.filter((t) => t.subprojectId === row.subproject.id).length;
              const doneCount = allTasks.filter((t) => t.subprojectId === row.subproject.id && t.isCompleted).length;
              return (
                <button
                  key={`sp-${row.subproject.id}`}
                  onClick={() => toggleSubprojectCollapsed(row.subproject.id)}
                  className="w-full flex items-center gap-2 px-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700
                    hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                  style={{ height: SUBPROJECT_ROW_HEIGHT }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: colorCfg.gantt }} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate flex-1 text-left">{row.subproject.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{doneCount}/{taskCount}</span>
                  {row.subproject.isCollapsed
                    ? <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />}
                </button>
              );
            } else {
              return (
                <button
                  key={`task-${row.task.id}`}
                  onClick={() => openTaskModal(row.task.id)}
                  className="w-full flex items-center gap-2 px-4 border-b border-slate-50 dark:border-slate-800
                    hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left shrink-0"
                  style={{ height: ROW_HEIGHT }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT_COLORS[row.task.status]}`} />
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{row.task.title}</span>
                  {row.task.isCompleted && (
                    <span className="ml-auto text-[10px] text-green-600 shrink-0">✓</span>
                  )}
                </button>
              );
            }
          })}
        </div>

        {/* ── Gantt SVG panel ──────────────────────────── */}
        <div
          ref={svgPanelRef}
          onScroll={onSvgScroll}
          className="flex-1 overflow-auto dark:bg-slate-950"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <svg
            width={Math.max(totalWidth + 40, 800)}
            height={svgHeight}
            className="block"
            style={{ cursor: 'crosshair' }}
            onClick={handleSvgClick}
          >
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill={arrowFill} />
              </marker>
            </defs>

            {/* ── Header background ── */}
            <rect x={0} y={0} width={totalWidth + 40} height={HEADER_HEIGHT} fill={headerBg} />

            {/* ── Top-layer header: month/year groups ── */}
            {topGroups.map((grp, i) => (
              <g key={`tg-${i}`}>
                {/* Group background */}
                <rect x={grp.x} y={0} width={grp.width} height={28}
                  fill={i % 2 === 0
                    ? (darkMode ? '#0f172a' : '#f1f5f9')
                    : (darkMode ? '#1e293b' : '#e2e8f0')}
                />
                {/* Group label */}
                <text x={grp.x + 8} y={20} fontSize={11} fill={darkMode ? '#cbd5e1' : '#475569'}
                  fontWeight="600" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {grp.label}
                </text>
                {/* Left border of group */}
                <line x1={grp.x} y1={0} x2={grp.x} y2={28}
                  stroke={headerLineFill} strokeWidth={1} />
              </g>
            ))}

            {/* Separator between top and bottom header rows */}
            <line x1={0} y1={28} x2={totalWidth + 40} y2={28} stroke={headerLineFill} strokeWidth={1} />

            {/* ── Bottom-layer header: columns ── */}
            {columns.map((col, i) => {
              const x = dateToX(col.date, rangeStart, cellWidth);
              const labelColor = col.isSun
                ? '#ef4444'
                : col.isToday
                  ? '#3b82f6'
                  : headerTextFill;
              return (
                <g key={`col-${i}`}>
                  {/* Weekend column tint spanning full chart */}
                  {mode === 'Day' && col.isWeekend && (
                    <rect
                      x={x}
                      y={HEADER_HEIGHT}
                      width={cellWidth}
                      height={totalRowsHeight + 20}
                      fill={darkMode ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.08)'}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  {/* Today highlight in bottom header */}
                  {col.isToday && (
                    <rect x={x} y={28} width={cellWidth} height={HEADER_HEIGHT - 28}
                      fill={darkMode ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  {/* Bottom column label */}
                  <text
                    x={x + (mode === 'Day' ? cellWidth / 2 : 8)}
                    y={48}
                    fontSize={mode === 'Day' ? 10 : 11}
                    fill={labelColor}
                    fontWeight={col.isToday ? '700' : '500'}
                    textAnchor={mode === 'Day' ? 'middle' : 'start'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {col.label}
                  </text>
                  {/* Vertical column separator */}
                  <line x1={x} y1={28} x2={x} y2={svgHeight}
                    stroke={headerLineFill} strokeWidth={1} />
                </g>
              );
            })}

            {/* Bottom header border */}
            <line x1={0} y1={HEADER_HEIGHT} x2={totalWidth + 40} y2={HEADER_HEIGHT}
              stroke={headerLineFill} strokeWidth={1} />

            {/* ── Row background stripes ── */}
            {rows.map((row, i) => (
              <rect
                key={`bg-${i}`}
                x={0}
                y={HEADER_HEIGHT + rowYOffsets[i]}
                width={totalWidth + 40}
                height={row.height}
                fill={rowFill(row, i)}
                style={{ pointerEvents: 'none' }}
              />
            ))}

            {/* ── Today line ── */}
            {todayX >= 0 && (
              <>
                <line x1={todayX} y1={0} x2={todayX} y2={svgHeight}
                  stroke="#0ea5e9" strokeWidth={2} strokeDasharray="6 3" opacity={0.6} />
                <rect x={todayX - 24} y={4} width={48} height={18} rx={9} fill="#0ea5e9" />
                <text x={todayX} y={16} fontSize={9} fill="white" textAnchor="middle" fontWeight="700"
                  style={{ pointerEvents: 'none' }}>
                  VANDAAG
                </text>
              </>
            )}

            {/* ── Dependency arrows ── */}
            {rows.map((row) => {
              if (row.type !== 'task') return null;
              return row.task.dependencies.map((depId) => {
                const fromY = taskYCenter[depId];
                const toY = taskYCenter[row.task.id];
                const depTask = allTasks.find((t) => t.id === depId);
                if (fromY == null || toY == null || !depTask) return null;
                const x1 = dateToX(parseISO(depTask.endDate), rangeStart, cellWidth);
                const x2 = dateToX(parseISO(row.task.startDate), rangeStart, cellWidth);
                const path = `M ${x1} ${fromY} C ${x1 + 20} ${fromY}, ${x2 - 20} ${toY}, ${x2} ${toY}`;
                return (
                  <path key={`${depId}->${row.task.id}`}
                    d={path} fill="none" stroke={arrowFill} strokeWidth={1.5}
                    strokeDasharray="4 2" markerEnd="url(#arrowhead)" />
                );
              });
            })}

            {/* ── Task bars ── */}
            {rows.map((row, i) => {
              if (row.type !== 'task') return null;
              return (
                <g key={`bar-${row.task.id}`}
                  transform={`translate(0, ${HEADER_HEIGHT + rowYOffsets[i]})`}
                  style={{ cursor: 'grab' }}
                >
                  <GanttBar
                    task={row.task}
                    rangeStart={rangeStart}
                    cellWidth={cellWidth}
                    subprojectColor={SUBPROJECT_COLOR_MAP[row.subproject.color].gantt}
                    onTaskClick={openTaskModal}
                    onTaskDrag={updateTaskDates}
                    onProgressChange={(id, progress) => updateTask(id, { progress })}
                    darkMode={darkMode}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
