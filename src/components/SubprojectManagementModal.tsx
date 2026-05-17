import React, { useState } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import { X, Plus, Edit2, Trash2, ChevronUp, ChevronDown, Check, Layers } from 'lucide-react';
import type { SubprojectColor } from '../types';
import { SUBPROJECT_COLOR_MAP, SUBPROJECT_COLOR_OPTIONS } from '../utils';

interface SubprojectFormState {
  name: string;
  description: string;
  color: SubprojectColor;
  startDate: string;
  endDate: string;
}

const today = new Date().toISOString().split('T')[0];
const oneMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

const emptyForm: SubprojectFormState = {
  name: '',
  description: '',
  color: 'blue',
  startDate: today,
  endDate: oneMonth,
};

interface Props {
  onClose: () => void;
}

export function SubprojectManagementModal({ onClose }: Props) {
  const { subprojects, addSubproject, updateSubproject, deleteSubproject, reorderSubprojects, tasks } = useRenovationStore();

  const sorted = [...subprojects].sort((a, b) => a.order - b.order);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<SubprojectFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SubprojectFormState>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleAdd() {
    if (!form.name.trim()) return;
    addSubproject({
      name: form.name.trim(),
      description: form.description || undefined,
      color: form.color,
      startDate: form.startDate,
      endDate: form.endDate,
      isCollapsed: false,
      order: subprojects.length,
    });
    setForm(emptyForm);
    setShowAdd(false);
  }

  function startEdit(sp: typeof subprojects[0]) {
    setEditingId(sp.id);
    setEditForm({
      name: sp.name,
      description: sp.description ?? '',
      color: sp.color,
      startDate: sp.startDate,
      endDate: sp.endDate,
    });
  }

  function handleSaveEdit() {
    if (!editingId || !editForm.name.trim()) return;
    updateSubproject(editingId, {
      name: editForm.name.trim(),
      description: editForm.description || undefined,
      color: editForm.color,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
    });
    setEditingId(null);
  }

  function handleDelete(id: string) {
    deleteSubproject(id);
    setDeleteConfirm(null);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...sorted];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderSubprojects(newOrder.map((sp) => sp.id));
  }

  function moveDown(index: number) {
    if (index === sorted.length - 1) return;
    const newOrder = [...sorted];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderSubprojects(newOrder.map((sp) => sp.id));
  }

  const renderForm = (
    f: SubprojectFormState,
    setF: (v: SubprojectFormState) => void,
    onSave: () => void,
    onCancel: () => void,
    saveLabel: string,
    isNew = false
  ) => (
    <div className={`border-2 ${isNew ? 'border-dashed border-primary-300 dark:border-primary-700' : 'border-primary-300 dark:border-primary-700'} rounded-xl p-4 space-y-3 bg-primary-50/50 dark:bg-slate-800`}>
      {isNew && <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nieuwe fase</p>}
      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Naam *</label>
        <input type="text" value={f.name} autoFocus={isNew}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="bijv. Zolder isoleren"
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Omschrijving</label>
        <textarea value={f.description} rows={2}
          onChange={(e) => setF({ ...f, description: e.target.value })}
          placeholder="Korte omschrijving..."
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Startdatum</label>
          <input type="date" value={f.startDate}
            onChange={(e) => setF({ ...f, startDate: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Einddatum</label>
          <input type="date" value={f.endDate}
            onChange={(e) => setF({ ...f, endDate: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Kleur</label>
        <div className="flex gap-2 flex-wrap">
          {SUBPROJECT_COLOR_OPTIONS.map((c) => {
            const cfg = SUBPROJECT_COLOR_MAP[c];
            return (
              <button key={c} onClick={() => setF({ ...f, color: c })}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                style={{ backgroundColor: cfg.gantt }}>
                {f.color === c && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors">Annuleren</button>
        <button onClick={onSave} disabled={!f.name.trim()}
          className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition-colors">
          {saveLabel}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Fases beheren</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sorted.length} fase{sorted.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {sorted.length === 0 && !showAdd && (
              <div className="text-center py-10 text-slate-400 dark:text-slate-600">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nog geen fases aangemaakt</p>
              </div>
            )}

            {sorted.map((sp, index) => {
              const cfg = SUBPROJECT_COLOR_MAP[sp.color];
              const taskCount = tasks.filter((t) => t.subprojectId === sp.id).length;
              const isEditing = editingId === sp.id;
              const isDeleting = deleteConfirm === sp.id;

              if (isEditing) {
                return (
                  <div key={sp.id}>
                    {renderForm(editForm, setEditForm, handleSaveEdit, () => setEditingId(null), 'Opslaan')}
                  </div>
                );
              }

              return (
                <div key={sp.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                  {/* Order controls */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveUp(index)} disabled={index === 0}
                      className="p-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-20 transition-colors">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveDown(index)} disabled={index === sorted.length - 1}
                      className="p-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-20 transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Color dot */}
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cfg.gantt }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{sp.name}</p>
                    {sp.description && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{sp.description}</p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-slate-500">{taskCount} taken</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => startEdit(sp)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                        <span className="text-xs text-red-600 dark:text-red-400">Zeker?</span>
                        <button onClick={() => handleDelete(sp.id)} className="text-xs text-red-600 dark:text-red-400 font-medium hover:text-red-800 ml-1">Ja</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-slate-500 hover:text-slate-700 ml-1">Nee</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(sp.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {showAdd && renderForm(form, setForm, handleAdd, () => { setShowAdd(false); setForm(emptyForm); }, 'Aanmaken', true)}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
            {!showAdd && (
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Fase toevoegen
              </button>
            )}
            <button onClick={onClose} className="ml-auto px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors">
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
