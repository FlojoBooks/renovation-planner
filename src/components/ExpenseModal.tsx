import React, { useState, useRef, useEffect } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import type { PaymentCategory, PaymentExpense } from '../types';
import { compressReceiptImage, type CompressedImageResult } from '../utils/imageCompressor';
import {
  X,
  Receipt,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Euro,
  Calendar,
  User,
  Layers,
  Sparkles,
  Image as ImageIcon,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../utils';

const CATEGORIES: { id: PaymentCategory; label: string }[] = [
  { id: 'materials', label: 'Materialen & Onderdelen' },
  { id: 'tools', label: 'Gereedschap & Machines' },
  { id: 'equipment', label: 'Apparatuur & Inrichting' },
  { id: 'labor', label: 'Arbeid & Inhuur' },
  { id: 'fuel', label: 'Brandstof & Transport' },
  { id: 'catering', label: 'Catering & Verzorging' },
  { id: 'administrative', label: 'Vergunningen & Administratie' },
  { id: 'other', label: 'Overige Uitgaven' },
];

export function ExpenseModal() {
  const {
    isExpenseModalOpen,
    closeExpenseModal,
    editingExpenseId,
    expenses,
    users,
    currentUser,
    subprojects,
    addExpense,
    updateExpense,
  } = useRenovationStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paidByUserId, setPaidByUserId] = useState(() => currentUser?.id || users[0]?.id || 'user-1');
  const [category, setCategory] = useState<PaymentCategory>('materials');
  const [subprojectId, setSubprojectId] = useState<string>('');
  const [splitAmongUserIds, setSplitAmongUserIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Image upload & compression state
  const [isCompressing, setIsCompressing] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [receiptThumbnail, setReceiptThumbnail] = useState<string | undefined>(undefined);
  const [receiptFileName, setReceiptFileName] = useState<string | undefined>(undefined);
  const [compressionMetrics, setCompressionMetrics] = useState<CompressedImageResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Populate when editing or opening
  useEffect(() => {
    if (!isExpenseModalOpen) return;

    if (editingExpenseId) {
      const existing = expenses.find((e) => e.id === editingExpenseId);
      if (existing) {
        setTitle(existing.title);
        setAmount(existing.amount);
        setDate(existing.date);
        setPaidByUserId(existing.paidByUserId);
        setCategory(existing.category);
        setSubprojectId(existing.subprojectId || '');
        setSplitAmongUserIds(existing.splitAmongUserIds || []);
        setNotes(existing.notes || '');
        setReceiptImage(existing.receiptImage);
        setReceiptThumbnail(existing.receiptThumbnail);
        setReceiptFileName(existing.receiptFileName);
        setCompressionMetrics(null);
        return;
      }
    }

    // Default new expense
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaidByUserId(currentUser?.id || users[0]?.id || 'user-1');
    setCategory('materials');
    setSubprojectId('');
    // Default split among all owner/partner users
    const defaultSplit = users
      .filter((u) => u.role === 'owner' || u.role === 'partner')
      .map((u) => u.id);
    setSplitAmongUserIds(defaultSplit.length > 0 ? defaultSplit : users.map((u) => u.id));
    setNotes('');
    setReceiptImage(undefined);
    setReceiptThumbnail(undefined);
    setReceiptFileName(undefined);
    setCompressionMetrics(null);
    setErrorMsg(null);
  }, [isExpenseModalOpen, editingExpenseId, expenses, users, currentUser]);

  if (!isExpenseModalOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Selecteer een geldig beeldbestand (JPEG, PNG, WebP of HEIC).');
      return;
    }

    setIsCompressing(true);
    setErrorMsg(null);

    try {
      // Voer client-side compressie uit (max 1280px, 78% quality WebP/JPEG)
      const compressed = await compressReceiptImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.78,
      });

      setReceiptImage(compressed.dataUrl);
      setReceiptThumbnail(compressed.thumbnailUrl);
      setReceiptFileName(compressed.fileName);
      setCompressionMetrics(compressed);
    } catch (err) {
      console.error('Fout bij compressie:', err);
      setErrorMsg('De foto kon niet gecomprimeerd worden. Probeer een andere afbeelding.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setReceiptImage(undefined);
    setReceiptThumbnail(undefined);
    setReceiptFileName(undefined);
    setCompressionMetrics(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSplitUser = (userId: string) => {
    setSplitAmongUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount === '' || Number(amount) <= 0) {
      setErrorMsg('Vul een geldige titel en een bedrag groter dan €0,- in.');
      return;
    }

    const payer = users.find((u) => u.id === paidByUserId);
    const paidByUserName = payer ? payer.name : 'Onbekend';

    const cleanSplit = splitAmongUserIds.length > 0
      ? splitAmongUserIds
      : users.map((u) => u.id);

    const expensePayload = {
      title: title.trim(),
      amount: Number(amount),
      date,
      paidByUserId,
      paidByUserName,
      category,
      subprojectId: subprojectId || undefined,
      splitAmongUserIds: cleanSplit,
      notes: notes.trim() || undefined,
      receiptImage,
      receiptThumbnail,
      receiptFileName,
    };

    if (editingExpenseId) {
      updateExpense(editingExpenseId, expensePayload);
    } else {
      addExpense(expensePayload);
    }

    closeExpenseModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingExpenseId ? 'Betaling / Bon Bewerken' : 'Nieuwe Betaling & Bon Registreren'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Voeg betaalbewijzen toe en verdeel de kosten eerlijk over het team
              </p>
            </div>
          </div>

          <button
            onClick={closeExpenseModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Omschrijving & Bedrag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Omschrijving van de aankoop / betaling *
              </label>
              <input
                type="text"
                required
                placeholder="bijv. Materialen Praxis - Kokerprofielen & primer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bedrag (€) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Wie heeft betaald & Datum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Betaald door (Wie heeft voorgeschoten?) *
              </label>
              <select
                value={paidByUserId}
                onChange={(e) => setPaidByUserId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleTitle || u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Betaaldatum *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Categorie & Fase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PaymentCategory)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Koppel aan Projectfase (optioneel)
              </label>
              <select
                value={subprojectId}
                onChange={(e) => setSubprojectId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Algemene projectuitgave --</option>
                {subprojects.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kosten Verdelen Onder (Wie deelt mee) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kosten verdelen over ({splitAmongUserIds.length} personen):
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {amount && splitAmongUserIds.length > 0
                  ? `${formatCurrency(Number(amount) / splitAmongUserIds.length)} p.p.`
                  : ''}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {users.map((u) => {
                const isChecked = splitAmongUserIds.includes(u.id);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleSplitUser(u.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.avatarInitials}
                    </span>
                    {u.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Foto van Bon / Factuur Uploaden */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Kassabon, Factuur of Betaalbewijs (Automatisch gecomprimeerd)
            </label>

            {receiptImage ? (
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 flex items-center gap-4 overflow-hidden">
                <img
                  src={receiptThumbnail || receiptImage}
                  alt="Kassabon preview"
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {receiptFileName || 'Betaalbewijs.jpg'}
                  </p>
                  {compressionMetrics && (
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      Gecomprimeerd: {compressionMetrics.originalSizeFormatted} → {compressionMetrics.compressedSizeFormatted} ({compressionMetrics.savedPercentage}% kleiner)
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Verwijder foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isCompressing
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Foto comprimeren & optimaliseren...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                    <UploadCloud className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Klik om foto van de bon te uploaden of maak een foto
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Foto's worden direct gecomprimeerd tot &lt;100KB voor razendsnelle werking
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notities */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notitie / Extra details
            </label>
            <textarea
              rows={2}
              placeholder="Optionele toelichting..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer actieknoppen */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={closeExpenseModal}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white shadow-md shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingExpenseId ? 'Wijzigingen Opslaan' : 'Betaling Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
