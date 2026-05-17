import React, { useState } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import { X, Plus, Edit2, Trash2, User, Check } from 'lucide-react';
import type { Person } from '../types';
import { getInitials } from '../utils';

const PRESET_COLORS = [
  '#0ea5e9', '#22c55e', '#f97316', '#ec4899',
  '#a855f7', '#eab308', '#14b8a6', '#ef4444',
];

interface PersonFormState {
  name: string;
  label: string;
  color: string;
  avatarInitials: string;
  email: string;
}

const emptyForm: PersonFormState = {
  name: '',
  label: '',
  color: '#0ea5e9',
  avatarInitials: '',
  email: '',
};

export function PersonsModal() {
  const { isPersonsModalOpen, closePersonsModal, persons, addPerson, updatePerson, deletePerson } = useRenovationStore();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<PersonFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PersonFormState>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!isPersonsModalOpen) return null;

  function handleNameChange(value: string, setter: (f: PersonFormState) => void, current: PersonFormState) {
    const initials = getInitials(value).slice(0, 2).toUpperCase();
    setter({ ...current, name: value, avatarInitials: initials || current.avatarInitials });
  }

  function handleAdd() {
    if (!form.name.trim()) return;
    addPerson({
      name: form.name.trim(),
      label: form.label.trim() || form.name.trim(),
      color: form.color,
      avatarInitials: form.avatarInitials || getInitials(form.name).slice(0, 2).toUpperCase(),
      email: form.email || undefined,
    });
    setForm(emptyForm);
    setShowAdd(false);
  }

  function startEdit(person: Person) {
    setEditingId(person.id);
    setEditForm({
      name: person.name,
      label: person.label,
      color: person.color,
      avatarInitials: person.avatarInitials,
      email: person.email ?? '',
    });
  }

  function handleSaveEdit() {
    if (!editingId || !editForm.name.trim()) return;
    updatePerson(editingId, {
      name: editForm.name.trim(),
      label: editForm.label.trim() || editForm.name.trim(),
      color: editForm.color,
      avatarInitials: editForm.avatarInitials || getInitials(editForm.name).slice(0, 2).toUpperCase(),
      email: editForm.email || undefined,
    });
    setEditingId(null);
  }

  function handleDelete(id: string) {
    deletePerson(id);
    setDeleteConfirm(null);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={closePersonsModal} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Personen beheren</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{persons.length} persoon{persons.length !== 1 ? 'en' : ''}</p>
              </div>
            </div>
            <button onClick={closePersonsModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Person list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {persons.length === 0 && !showAdd && (
              <div className="text-center py-10 text-slate-400 dark:text-slate-600">
                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nog geen personen toegevoegd</p>
              </div>
            )}

            {persons.map((person) => {
              const isEditing = editingId === person.id;
              const isDeleting = deleteConfirm === person.id;

              if (isEditing) {
                return (
                  <div key={person.id} className="border-2 border-primary-300 dark:border-primary-700 rounded-xl p-4 space-y-3 bg-primary-50 dark:bg-slate-800">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Naam</label>
                        <input type="text" value={editForm.name}
                          onChange={(e) => handleNameChange(e.target.value, setEditForm, editForm)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Label</label>
                        <input type="text" value={editForm.label}
                          onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                          placeholder={editForm.name}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Initialen</label>
                        <input type="text" value={editForm.avatarInitials} maxLength={2}
                          onChange={(e) => setEditForm({ ...editForm, avatarInitials: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">E-mail</label>
                        <input type="email" value={editForm.email} placeholder="optioneel"
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Kleur</label>
                      <div className="flex gap-2 flex-wrap">
                        {PRESET_COLORS.map((c) => (
                          <button key={c} onClick={() => setEditForm({ ...editForm, color: c })}
                            className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                            style={{ backgroundColor: c }}>
                            {editForm.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors">Annuleren</button>
                      <button onClick={handleSaveEdit} className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Opslaan</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={person.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: person.color }}>
                    {person.avatarInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{person.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{person.label}{person.email ? ` • ${person.email}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(person)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                        <span className="text-xs text-red-600 dark:text-red-400">Zeker?</span>
                        <button onClick={() => handleDelete(person.id)} className="text-xs text-red-600 dark:text-red-400 font-medium hover:text-red-800 ml-1">Ja</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-slate-500 hover:text-slate-700 ml-1">Nee</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(person.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Person Form */}
            {showAdd && (
              <div className="border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-xl p-4 space-y-3 bg-primary-50/50 dark:bg-slate-800">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nieuwe persoon</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Naam *</label>
                    <input type="text" value={form.name} autoFocus
                      onChange={(e) => handleNameChange(e.target.value, setForm, form)}
                      placeholder="bijv. Elektricien"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Label</label>
                    <input type="text" value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder={form.name || 'Korte naam'}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Initialen</label>
                    <input type="text" value={form.avatarInitials} maxLength={2}
                      onChange={(e) => setForm({ ...form, avatarInitials: e.target.value.toUpperCase() })}
                      placeholder="bijv. EL"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">E-mail</label>
                    <input type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="optioneel"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Kleur</label>
                  <div className="flex gap-2 items-center flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: c }}>
                        {form.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                    <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden" style={{ backgroundColor: form.color }}>
                      <span className="text-white text-[9px] font-bold">{form.avatarInitials || getInitials(form.name).slice(0, 2) || '?'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowAdd(false); setForm(emptyForm); }} className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors">Annuleren</button>
                  <button onClick={handleAdd} disabled={!form.name.trim()}
                    className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition-colors">
                    Toevoegen
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
            {!showAdd && (
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Persoon toevoegen
              </button>
            )}
            <button onClick={closePersonsModal} className="ml-auto px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors">
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
