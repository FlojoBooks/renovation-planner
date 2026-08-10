import React, { useState } from 'react';
import { useRenovationStore } from '../store/useRenovationStore';
import type { PaymentCategory, PaymentExpense } from '../types';
import {
  Receipt,
  Plus,
  ArrowRight,
  Sparkles,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  X,
  Download,
  Maximize2,
  Filter,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { formatCurrency, formatShortDate } from '../utils';

const CATEGORY_NAMES: Record<PaymentCategory, string> = {
  materials: 'Materialen',
  tools: 'Gereedschap',
  equipment: 'Apparatuur',
  labor: 'Arbeid',
  fuel: 'Brandstof & Transport',
  catering: 'Catering',
  administrative: 'Administratie',
  other: 'Overig',
};

export function ExpensesView() {
  const {
    expenses,
    users,
    currentUser,
    openExpenseModal,
    openInviteModal,
    deleteExpense,
    getSettlementSummary,
    selectedReceiptImage,
    openReceiptLightbox,
    closeReceiptLightbox,
  } = useRenovationStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [payerFilter, setPayerFilter] = useState<string>('all');

  const settlement = getSettlementSummary();

  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (payerFilter !== 'all' && e.paidByUserId !== payerFilter) return false;
    return true;
  });

  // Zoek het saldo van de huidige ingelogde gebruiker
  const mySettlement = settlement.userSettlements.find((u) => u.userId === currentUser?.id);

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide">
              <Receipt className="w-3.5 h-3.5 text-emerald-200" />
              Uitgaven & Wie Betaalt Wat
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Betalingen & Kostenverdeling
            </h1>
            <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed">
              Upload foto's van kassabonnen en facturen (automatisch gecomprimeerd). Het systeem berekent direct de onderlinge verrekening zodat iedereen eerlijk zijn deel betaalt.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-3 shrink-0">
            <button
              onClick={() => openExpenseModal()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-800 font-bold text-sm shadow-lg hover:bg-emerald-50 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              Nieuwe Betaling / Bon
            </button>
            <button
              onClick={openInviteModal}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/20 text-white font-semibold text-xs hover:bg-black/30 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Private Invite Link
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Totaal Uitgegeven */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Totaal Uitgegeven</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(settlement.totalSpent)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{expenses.length} geregistreerde betalingen</p>
          </div>
        </div>

        {/* Jouw Inleg */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Door Jou Voorgeschoten</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(mySettlement?.totalPaid || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Jouw eerlijk aandeel: {formatCurrency(mySettlement?.fairShare || 0)}</p>
          </div>
        </div>

        {/* Jouw Netto Saldo */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              (mySettlement?.netBalance || 0) >= 0
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}
          >
            {(mySettlement?.netBalance || 0) >= 0 ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jouw Saldo</p>
            <h3
              className={`text-2xl font-extrabold ${
                (mySettlement?.netBalance || 0) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {(mySettlement?.netBalance || 0) >= 0
                ? `+${formatCurrency(mySettlement?.netBalance || 0)}`
                : formatCurrency(mySettlement?.netBalance || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {(mySettlement?.netBalance || 0) > 0.01
                ? 'Te ontvangen van teamleden'
                : (mySettlement?.netBalance || 0) < -0.01
                ? 'Nog over te maken aan team'
                : 'Volledig vereffend (kiet)'}
            </p>
          </div>
        </div>
      </div>

      {/* Kostenverdeling & Verrekening Calculator */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Kostenverdeling & Onderlinge Verrekening
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automatische berekening van de inleg en wie aan wie moet betalen
            </p>
          </div>
        </div>

        {/* Tabel per gebruiker */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settlement.userSettlements.map((item) => (
            <div
              key={item.userId}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: item.avatarColor }}
                  >
                    {item.avatarInitials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.userName}
                    </h4>
                    <span className="text-[11px] text-slate-400">Teamlid</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    item.netBalance > 0.01
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : item.netBalance < -0.01
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.netBalance > 0.01
                    ? `+${formatCurrency(item.netBalance)}`
                    : formatCurrency(item.netBalance)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Betaald</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(item.totalPaid)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Eerlijk Aandeel</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(item.fairShare)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Onderlinge Vereffeningsinstructies */}
        {settlement.transfers.length > 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Aanbevolen Overboekingen om Kiet te Spelen ({settlement.transfers.length}):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settlement.transfers.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {t.fromUserName}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {t.toUserName}
                    </span>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500 dark:text-slate-400">
            ✓ Alle geregistreerde kosten zijn momenteel gelijk verdeeld of er zijn nog geen uitgaven geregistreerd.
          </div>
        )}
      </div>

      {/* Uitgaven & Bonnetjes Lijst */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Geregistreerde Betalingen & Bonnen ({filteredExpenses.length})
            </h3>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Alle Categorieën</option>
              {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={payerFilter}
              onChange={(e) => setPayerFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Alle Betalers</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List of expenses */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
              <Receipt className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Nog geen betalingen geregistreerd
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Voeg voorgeschoten aankopen of facturen toe om het bonnetje op te slaan en kosten automatisch te verrekenen.
            </p>
            <button
              onClick={() => openExpenseModal()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
            >
              + Eerste Betaling Toevoegen
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredExpenses.map((expense) => {
              const payer = users.find((u) => u.id === expense.paidByUserId);

              return (
                <div
                  key={expense.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 p-3 rounded-2xl transition-colors"
                >
                  {/* Linker kant: Bon Thumbnail & Titel */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Thumbnail of Bon icon */}
                    {expense.receiptImage ? (
                      <div
                        onClick={() => openReceiptLightbox(expense.receiptImage!)}
                        className="group relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 shadow-sm"
                        title="Klik om bon te vergroten"
                      >
                        <img
                          src={expense.receiptThumbnail || expense.receiptImage}
                          alt="Bon"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                        <Receipt className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {expense.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          {CATEGORY_NAMES[expense.category] || expense.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatShortDate(expense.date)}
                        </span>

                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                            style={{ backgroundColor: payer?.avatarColor || '#0ea5e9' }}
                          >
                            {payer?.avatarInitials || 'GB'}
                          </span>
                          Betaald door {expense.paidByUserName}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          (Verdeeld over {expense.splitAmongUserIds?.length || users.length} pers.)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rechter kant: Bedrag & Acties */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </span>
                      {expense.splitAmongUserIds?.length > 1 && (
                        <span className="block text-[10px] text-slate-400 font-medium">
                          {formatCurrency(expense.amount / expense.splitAmongUserIds.length)} p.p.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openExpenseModal(expense.id)}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Bewerken"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal voor Kassabon / Factuur */}
      {selectedReceiptImage && (
        <div
          onClick={closeReceiptLightbox}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 text-white">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Betaalbewijs / Kassabon
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedReceiptImage}
                  download="betaalbewijs.jpg"
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Download foto"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={closeReceiptLightbox}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex items-center justify-center bg-black/40">
              <img
                src={selectedReceiptImage}
                alt="Volledige kassabon"
                className="max-h-[75vh] w-auto rounded-xl object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
