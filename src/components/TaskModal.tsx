import React, { useState, useEffect, useCallback } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import type { Task, Material, TaskStatus, TaskPriority, MaterialStatus } from '../types';
import {
  X, Calendar, Tag, MessageSquare, Package, Trash2, Plus,
  CheckCircle2, Circle, ExternalLink, Send, Edit2,
} from 'lucide-react';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  MATERIAL_STATUS_LABELS,
  MATERIAL_STATUS_COLORS,
  SUBPROJECT_COLOR_MAP,
  formatDate,
  formatCurrency,
  generateId,
} from '../utils';

const TABS = ['Details', 'Materialen', 'Opmerkingen'] as const;
type Tab = typeof TABS[number];

// ── Helper: is this modal in "create" mode? ────────────────
function isCreateMode(selectedTaskId: string | null) {
  return selectedTaskId === null;
}

export function TaskModal() {
  const {
    isTaskModalOpen,
    selectedTaskId,
    activeSubprojectId,
    closeTaskModal,
    tasks,
    subprojects,
    persons,
    materials,
    comments,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    updateMaterialStatus,
    addComment,
    updateComment,
    deleteComment,
    getMaterialsByTask,
    getCommentsByTask,
  } = useRenovationStore();

  const createMode = isCreateMode(selectedTaskId);
  const task = !createMode ? tasks.find((t) => t.id === selectedTaskId) ?? null : null;

  const [activeTab, setActiveTab] = useState<Tab>('Details');
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // ── Controlled form fields ──────────────────────────────
  const defaultSubprojectId = activeSubprojectId ?? subprojects[0]?.id ?? '';
  const todayStr = new Date().toISOString().split('T')[0];
  const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editStartDate, setEditStartDate] = useState(todayStr);
  const [editEndDate, setEditEndDate] = useState(twoWeeks);
  const [editProgress, setEditProgress] = useState(0);
  const [editAssignees, setEditAssignees] = useState<string[]>([]);
  const [editSubprojectId, setEditSubprojectId] = useState(defaultSubprojectId);
  const [editDependencies, setEditDependencies] = useState<string[]>([]);

  // New material form
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMat, setNewMat] = useState({
    name: '', quantity: 1, unit: 'stuks', unitPrice: 0,
    status: 'needed' as MaterialStatus, supplier: '', supplierUrl: '',
  });

  // Populate form when task changes (edit mode) or reset (create mode)
  useEffect(() => {
    if (!isTaskModalOpen) return;
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description ?? '');
      setEditStatus(task.status);
      setEditPriority(task.priority);
      setEditStartDate(task.startDate);
      setEditEndDate(task.endDate);
      setEditProgress(task.progress);
      setEditAssignees([...task.assigneeIds]);
      setEditSubprojectId(task.subprojectId);
      setEditDependencies([...task.dependencies]);
    } else {
      // Create mode — reset to defaults
      setEditTitle('');
      setEditDescription('');
      setEditStatus('todo');
      setEditPriority('medium');
      setEditStartDate(todayStr);
      setEditEndDate(twoWeeks);
      setEditProgress(0);
      setEditAssignees([]);
      setEditSubprojectId(activeSubprojectId ?? subprojects[0]?.id ?? '');
      setEditDependencies([]);
    }
    setActiveTab('Details');
    setCommentText('');
    setShowAddMaterial(false);
  }, [isTaskModalOpen, selectedTaskId]);

  if (!isTaskModalOpen) return null;

  // ── Save/Create logic ───────────────────────────────────
  function saveField(overrides: Partial<Task> = {}) {
    if (createMode) return;
    if (!task) return;
    updateTask(task.id, {
      title: editTitle,
      description: editDescription,
      assigneeIds: editAssignees,
      subprojectId: editSubprojectId,
      dependencies: editDependencies,
      ...overrides,
    });
  }

  function handleCreate() {
    if (!editTitle.trim()) return;
    addTask({
      subprojectId: editSubprojectId || subprojects[0]?.id,
      title: editTitle.trim(),
      description: editDescription,
      status: editStatus,
      priority: editPriority,
      startDate: editStartDate,
      endDate: editEndDate,
      dependencies: editDependencies,
      assigneeIds: editAssignees,
      isCompleted: editStatus === 'done',
      estimatedHours: undefined,
      order: tasks.filter(t => t.subprojectId === editSubprojectId).length,
      tags: [],
    });
    closeTaskModal();
  }

  function handleClose() {
    if (createMode && editTitle.trim()) {
      handleCreate();
    } else {
      closeTaskModal();
    }
  }

  // ── Field-specific update handlers ─────────────────────
  function handleStatusChange(value: TaskStatus) {
    setEditStatus(value);
    if (!createMode && task) {
      updateTask(task.id, { status: value, isCompleted: value === 'done', progress: value === 'done' ? 100 : task.progress });
      if (value === 'done') setEditProgress(100);
    }
  }

  function handlePriorityChange(value: TaskPriority) {
    setEditPriority(value);
    if (!createMode && task) updateTask(task.id, { priority: value });
  }

  function handleSubprojectChange(value: string) {
    setEditSubprojectId(value);
    if (!createMode && task) updateTask(task.id, { subprojectId: value });
  }

  function handleProgressChange(value: number) {
    setEditProgress(value);
    if (!createMode && task) updateTask(task.id, { progress: value });
  }

  function handleStartDateChange(value: string) {
    setEditStartDate(value);
    if (!createMode && task) updateTask(task.id, { startDate: value });
  }

  function handleEndDateChange(value: string) {
    setEditEndDate(value);
    if (!createMode && task) updateTask(task.id, { endDate: value });
  }

  function toggleAssignee(personId: string) {
    const next = editAssignees.includes(personId)
      ? editAssignees.filter((id) => id !== personId)
      : [...editAssignees, personId];
    setEditAssignees(next);
    if (!createMode && task) updateTask(task.id, { assigneeIds: next });
  }

  function toggleDependency(taskId: string) {
    const next = editDependencies.includes(taskId)
      ? editDependencies.filter((id) => id !== taskId)
      : [...editDependencies, taskId];
    setEditDependencies(next);
    if (!createMode && task) updateTask(task.id, { dependencies: next });
  }

  // ── Comments ────────────────────────────────────────────
  function handleSubmitComment() {
    if (!task || !commentText.trim()) return;
    addComment({
      taskId: task.id,
      authorId: persons[0]?.id ?? 'unknown',
      authorName: persons[0]?.name ?? 'Ik',
      content: commentText.trim(),
      attachments: [],
    });
    setCommentText('');
  }

  // ── Materials ────────────────────────────────────────────
  function handleAddMaterial() {
    if (!task || !newMat.name.trim()) return;
    addMaterial({
      taskId: task.id,
      name: newMat.name.trim(),
      quantity: newMat.quantity,
      unit: newMat.unit,
      unitPrice: newMat.unitPrice,
      status: newMat.status,
      supplier: newMat.supplier || undefined,
      supplierUrl: newMat.supplierUrl || undefined,
    });
    setNewMat({ name: '', quantity: 1, unit: 'stuks', unitPrice: 0, status: 'needed', supplier: '', supplierUrl: '' });
    setShowAddMaterial(false);
  }

  // ── Derived values ───────────────────────────────────────
  const taskMaterials = task ? getMaterialsByTask(task.id) : [];
  const taskComments = task ? getCommentsByTask(task.id) : [];
  const totalMaterialCost = taskMaterials.reduce((s, m) => s + m.totalPrice, 0);
  const subproject = subprojects.find((sp) => sp.id === editSubprojectId);
  const colorCfg = subproject ? SUBPROJECT_COLOR_MAP[subproject.color] : null;

  // Cross-phase dependencies: all tasks except current
  const availableTasks = tasks.filter((t) => t.id !== task?.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Modal panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-2xl bg-white dark:bg-slate-900 shadow-2xl z-50
        flex flex-col overflow-hidden modal-slide-in task-modal-panel">

        {/* Header */}
        <div className="flex items-start gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {task && (
            <button
              onClick={() => toggleTaskComplete(task.id)}
              className="mt-1 shrink-0 text-slate-300 hover:text-green-500 transition-colors"
            >
              {task.isCompleted
                ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                : <Circle className="w-5 h-5" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => !createMode && saveField()}
              autoFocus={createMode}
              className="w-full text-base sm:text-lg font-semibold text-slate-900 dark:text-white bg-transparent border-0
                outline-none focus:ring-0 p-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Naam van de taak..."
            />
            {subproject && colorCfg && (
              <span className={`inline-flex items-center gap-1.5 mt-1 text-xs font-medium px-2 py-0.5 rounded-full
                ${colorCfg.bg} ${colorCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${colorCfg.dot}`} />
                {subproject.name}
              </span>
            )}
            {createMode && (
              <span className="inline-flex mt-1 ml-2 text-xs text-slate-400 italic">Nieuwe taak</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {task && (
              <button
                onClick={() => { deleteTask(task.id); closeTaskModal(); }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Taak verwijderen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {createMode ? (
              <button
                onClick={handleCreate}
                disabled={!editTitle.trim()}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg
                  hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Aanmaken
              </button>
            ) : null}
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs (only show in edit mode) */}
        {!createMode && (
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap shrink-0
                  ${activeTab === tab
                    ? 'text-primary-700 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {tab}
                {tab === 'Materialen' && taskMaterials.length > 0 && (
                  <span className="ml-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                    {taskMaterials.length}
                  </span>
                )}
                {tab === 'Opmerkingen' && taskComments.length > 0 && (
                  <span className="ml-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                    {taskComments.length}
                  </span>
                )}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">

          {/* ── Details Tab (also shown in create mode) ─── */}
          {(activeTab === 'Details' || createMode) && (
            <div className="p-4 sm:p-6 space-y-5">

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-200"
                  >
                    {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Prioriteit</label>
                  <select
                    value={editPriority}
                    onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-200"
                  >
                    {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Startdatum</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Einddatum</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Progress (edit mode only) */}
              {!createMode && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Voortgang — {editProgress}%
                  </label>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={editProgress}
                    onChange={(e) => handleProgressChange(Number(e.target.value))}
                    className="w-full accent-primary-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Omschrijving</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={() => !createMode && saveField()}
                  rows={3}
                  placeholder="Omschrijving van de taak..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Fase */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Fase</label>
                <select
                  value={editSubprojectId}
                  onChange={(e) => handleSubprojectChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-200"
                >
                  {subprojects.map((sp) => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>

              {/* Persons */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Toegewezen personen</label>
                <div className="flex flex-wrap gap-2">
                  {persons.map((person) => {
                    const assigned = editAssignees.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        onClick={() => toggleAssignee(person.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
                          ${assigned ? 'border-transparent text-white' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:border-slate-300'}`}
                        style={assigned ? { backgroundColor: person.color } : {}}
                      >
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: assigned ? 'rgba(255,255,255,0.25)' : person.color }}
                        >
                          {person.avatarInitials}
                        </span>
                        {person.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dependencies (cross-phase) */}
              {availableTasks.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Afhankelijkheden — wacht op:
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {availableTasks.map((t) => {
                      const sp = subprojects.find(s => s.id === t.subprojectId);
                      const isSelected = editDependencies.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleDependency(t.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm transition-all text-left
                            ${isSelected
                              ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 text-slate-600 dark:text-slate-300'}`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                            ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-slate-300 dark:border-slate-500'}`}>
                            {isSelected && <span className="text-white text-[10px]">✓</span>}
                          </span>
                          <span className="truncate flex-1">{t.title}</span>
                          {sp && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded text-white shrink-0"
                              style={{ backgroundColor: SUBPROJECT_COLOR_MAP[sp.color].gantt }}
                            >
                              {sp.name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Materials Tab ─────────────────────────────── */}
          {activeTab === 'Materialen' && !createMode && (
            <div className="p-4 sm:p-6 space-y-3">
              {taskMaterials.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Totaal materiaalkosten</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalMaterialCost)}</span>
                </div>
              )}
              {taskMaterials.length === 0 && !showAddMaterial && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Geen materialen toegevoegd</p>
                </div>
              )}
              {taskMaterials.map((mat) => <MaterialRow key={mat.id} material={mat} />)}

              {showAddMaterial ? (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 bg-slate-50 dark:bg-slate-800">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nieuw materiaal</p>
                  <input type="text" placeholder="Naam materiaal" value={newMat.name}
                    onChange={(e) => setNewMat({ ...newMat, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Aantal</label>
                      <input type="number" value={newMat.quantity}
                        onChange={(e) => setNewMat({ ...newMat, quantity: Number(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Eenheid</label>
                      <input type="text" value={newMat.unit}
                        onChange={(e) => setNewMat({ ...newMat, unit: e.target.value })}
                        className="w-full px-2 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Prijs/stuk (€)</label>
                      <input type="number" step="0.01" value={newMat.unitPrice}
                        onChange={(e) => setNewMat({ ...newMat, unitPrice: Number(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Leverancier" value={newMat.supplier}
                      onChange={(e) => setNewMat({ ...newMat, supplier: e.target.value })}
                      className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
                    <input type="url" placeholder="URL leverancier" value={newMat.supplierUrl}
                      onChange={(e) => setNewMat({ ...newMat, supplierUrl: e.target.value })}
                      className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
                  </div>
                  <select value={newMat.status}
                    onChange={(e) => setNewMat({ ...newMat, status: e.target.value as MaterialStatus })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 dark:text-slate-200">
                    {(['needed', 'ordered', 'delivered', 'installed'] as const).map((s) => (
                      <option key={s} value={s}>{MATERIAL_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowAddMaterial(false)}
                      className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors">
                      Annuleren
                    </button>
                    <button onClick={handleAddMaterial}
                      className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      Toevoegen
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddMaterial(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed
                    border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-primary-400
                    hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all">
                  <Plus className="w-4 h-4" /> Materiaal toevoegen
                </button>
              )}
            </div>
          )}

          {/* ── Comments Tab ──────────────────────────────── */}
          {activeTab === 'Opmerkingen' && !createMode && (
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              {taskComments.length === 0 && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nog geen opmerkingen</p>
                </div>
              )}
              <div className="space-y-3">
                {taskComments.map((comment) => {
                  const author = persons.find((p) => p.id === comment.authorId);
                  const isEditing = editingCommentId === comment.id;
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: author?.color ?? '#94a3b8' }}
                      >
                        {author?.avatarInitials ?? '?'}
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{comment.authorName}</span>
                          <span className="text-xs text-slate-400">{formatDate(comment.createdAt, 'd MMM HH:mm')}</span>
                          {comment.isEdited && <span className="text-xs text-slate-400 italic">(bewerkt)</span>}
                        </div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)} rows={2}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-700 dark:text-slate-200" />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingCommentId(null)} className="text-xs text-slate-500 dark:text-slate-400">Annuleren</button>
                              <button onClick={() => { updateComment(comment.id, editCommentText); setEditingCommentId(null); }}
                                className="text-xs text-primary-600 dark:text-primary-400 font-medium">Opslaan</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.content}</p>
                        )}
                        {!isEditing && (
                          <div className="flex gap-3 mt-1.5">
                            <button onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); }}
                              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1">
                              <Edit2 className="w-3 h-3" /> Bewerken
                            </button>
                            <button onClick={() => deleteComment(comment.id)}
                              className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Verwijderen
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 items-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: persons[0]?.color ?? '#94a3b8' }}
                >
                  {persons[0]?.avatarInitials ?? 'IK'}
                </div>
                <div className="flex-1 relative">
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                    rows={2} placeholder="Opmerking toevoegen... (Enter om te versturen)"
                    className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 dark:border-slate-600 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500" />
                  <button onClick={handleSubmitComment} disabled={!commentText.trim()}
                    className="absolute right-2.5 bottom-2.5 text-slate-400 hover:text-primary-600 disabled:opacity-40 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── MaterialRow ────────────────────────────────────────────
function MaterialRow({ material }: { material: Material }) {
  const { updateMaterial, deleteMaterial, updateMaterialStatus } = useRenovationStore();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(material.name);
  const [editQty, setEditQty] = useState(material.quantity);
  const [editUnit, setEditUnit] = useState(material.unit);
  const [editUnitPrice, setEditUnitPrice] = useState(material.unitPrice);
  const [editSupplier, setEditSupplier] = useState(material.supplier ?? '');
  const [editSupplierUrl, setEditSupplierUrl] = useState(material.supplierUrl ?? '');
  const [editArticleNumber, setEditArticleNumber] = useState(material.articleNumber ?? '');
  const [editNotes, setEditNotes] = useState(material.notes ?? '');

  function save() {
    updateMaterial(material.id, {
      name: editName, quantity: editQty, unit: editUnit,
      unitPrice: editUnitPrice, supplier: editSupplier || undefined,
      supplierUrl: editSupplierUrl || undefined,
      articleNumber: editArticleNumber || undefined,
      notes: editNotes || undefined,
    });
    setEditing(false);
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden dark:bg-slate-800">
      <div className="flex items-start gap-3 p-3.5">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={editQty} onChange={(e) => setEditQty(Number(e.target.value))}
                  className="px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
                <input type="text" value={editUnit} onChange={(e) => setEditUnit(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
                <input type="number" step="0.01" value={editUnitPrice} onChange={(e) => setEditUnitPrice(Number(e.target.value))}
                  className="px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
              </div>
              <input type="text" value={editSupplier} placeholder="Leverancier" onChange={(e) => setEditSupplier(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
              <input type="url" value={editSupplierUrl} placeholder="URL leverancier" onChange={(e) => setEditSupplierUrl(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
              <input type="text" value={editArticleNumber} placeholder="Artikelnummer (optioneel)" onChange={(e) => setEditArticleNumber(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200" />
              <textarea value={editNotes} placeholder="Notities" rows={2} onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-700 dark:text-slate-200" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="text-xs text-slate-500 dark:text-slate-400">Annuleren</button>
                <button onClick={save} className="text-xs text-primary-600 dark:text-primary-400 font-medium">Opslaan</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{material.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {material.quantity} {material.unit} × {formatCurrency(material.unitPrice)} ={' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(material.totalPrice)}</span>
                {material.supplier && <span className="ml-2 text-slate-400">• {material.supplier}</span>}
              </p>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <select value={material.status}
              onChange={(e) => updateMaterialStatus(material.id, e.target.value as MaterialStatus)}
              className={`text-xs font-medium px-2 py-1.5 rounded-lg border-0 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-primary-500 ${MATERIAL_STATUS_COLORS[material.status]}`}>
              {(['needed', 'ordered', 'delivered', 'installed', 'returned'] as const).map((s) => (
                <option key={s} value={s}>{MATERIAL_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => deleteMaterial(material.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {material.supplierUrl && !editing && (
        <a href={material.supplierUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-700 text-xs text-primary-600
            hover:text-primary-800 border-t border-slate-100 dark:border-slate-600 transition-colors">
          <ExternalLink className="w-3 h-3" />{material.supplierUrl}
        </a>
      )}
    </div>
  );
}
