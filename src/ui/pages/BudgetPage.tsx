import { useState } from 'react';
import { useExpenses, useTotalBudget, useDays } from '../../hooks/useTripData';
import { TripRepository } from '../../data/repository';
import { Expense } from '../../domain/types';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Download, 
  PieChart, 
  Wallet, 
  X
} from 'lucide-react';

const CATEGORIES = [
  'Comida',
  'Transporte',
  'Alojamiento',
  'Entradas',
  'Compras',
  'Imprevistos',
  'Otros',
] as const;

const PAYMENT_METHODS = [
  'Tarjeta Crédito',
  'Tarjeta Débito',
  'Efectivo',
  'Otro',
] as const;

export default function BudgetPage() {
  const expenses = useExpenses();
  const totalBudget = useTotalBudget();
  const days = useDays();

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<string>(totalBudget ? String(totalBudget) : '2500');

  // Form fields
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<Expense['category']>('Comida');
  const [date, setDate] = useState<string>('2026-10-13');
  const [city, setCity] = useState<string>('Boston, MA');
  const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>('Tarjeta Crédito');
  const [notes, setNotes] = useState<string>('');

  // Calculations
  const totalSpent = expenses.reduce((sum, e) => sum + e.amountUsd, 0);
  const tripDaysCount = 18; // 12 al 29 de octubre de 2026
  const dailyAverage = totalSpent / tripDaysCount;
  const configuredBudget = totalBudget || 0;
  const remainingBudget = configuredBudget > 0 ? configuredBudget - totalSpent : null;
  const percentUsed = configuredBudget > 0 ? Math.min(100, Math.round((totalSpent / configuredBudget) * 100)) : 0;

  // Breakdown by category
  const categoryBreakdown = CATEGORIES.map(cat => {
    const total = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amountUsd, 0);
    return { category: cat, total, count: expenses.filter(e => e.category === cat).length };
  }).filter(c => c.total > 0);

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      await TripRepository.setTotalBudget(val);
      setIsEditingBudget(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    await TripRepository.addExpense({
      date,
      city,
      category,
      amountUsd: parsedAmount,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    setAmount('');
    setNotes('');
    setShowAddModal(false);
  };

  const handleDeleteExpense = async (id: string) => {
    await TripRepository.deleteExpense(id);
  };

  const handleExportCSV = () => {
    const headers = ['Fecha', 'Ciudad', 'Categoría', 'Importe USD', 'Método Pago', 'Notas'];
    const rows = expenses.map(exp => [
      exp.date,
      `"${exp.city.replace(/"/g, '""')}"`,
      `"${exp.category}"`,
      exp.amountUsd.toFixed(2),
      `"${exp.paymentMethod || 'No especificado'}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `presupuesto_ubiusa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-slate-900 text-white pt-6 pb-6 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={22} className="text-emerald-400" />
            <h1 className="text-xl font-extrabold tracking-tight">Presupuesto de Viaje</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
          >
            <Plus size={16} /> Registrar Gasto
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* KPI Cards */}
        <section className="bg-white rounded-3xl p-5 shadow-[0_4px_25px_rgb(0,0,0,0.04)] border border-slate-100 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Total Gastado
              </span>
              <p className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-0.5">
                ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs text-slate-400 font-normal ml-1 font-sans">USD</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Presupuesto Total
              </span>
              {isEditingBudget ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="w-24 p-1 text-xs border rounded-lg font-mono"
                    placeholder="USD"
                  />
                  <button
                    onClick={handleSaveBudget}
                    className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                  >
                    Guardar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-0.5 justify-end">
                  <span className="text-base font-extrabold text-slate-800 font-mono">
                    {configuredBudget > 0 ? `$${configuredBudget.toLocaleString('en-US')}` : 'Sin definir'}
                  </span>
                  <button
                    onClick={() => setIsEditingBudget(true)}
                    className="text-[10px] text-indigo-600 font-bold hover:underline ml-1"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {configuredBudget > 0 && (
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span>{percentUsed}% consumido</span>
                <span className={remainingBudget !== null && remainingBudget < 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}>
                  {remainingBudget !== null && remainingBudget >= 0 
                    ? `Restante: $${remainingBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                    : `Excedido por: $${Math.abs(remainingBudget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentUsed > 90 ? 'bg-rose-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          )}

          {/* Daily average & duration */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Promedio Diario</span>
              <p className="font-extrabold font-mono text-slate-900 mt-0.5">
                ${dailyAverage.toFixed(2)} USD / día
              </p>
              <span className="text-[10px] text-slate-500">Estimado a 18 días</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Transacciones</span>
              <p className="font-extrabold font-mono text-slate-900 mt-0.5">
                {expenses.length} registros
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold">● Guardados localmente</span>
            </div>
          </div>
        </section>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <PieChart size={14} className="text-indigo-600" /> Desglose por Categoría
            </h3>
            <div className="space-y-2">
              {categoryBreakdown.map(cat => {
                const pct = totalSpent > 0 ? Math.round((cat.total / totalSpent) * 100) : 0;
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{cat.category} ({cat.count})</span>
                      <span className="font-mono">${cat.total.toFixed(2)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Expenses List & CSV Export */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Movimientos Registrados ({expenses.length})
            </h2>
            {expenses.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Download size={13} /> Exportar CSV
              </button>
            )}
          </div>

          {expenses.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
              <DollarSign size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Aún no hay gastos registrados.</p>
              <p className="text-xs text-slate-400">Pulsa en "Registrar Gasto" para llevar el control de tus compras y comida.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{exp.category}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                        {exp.city}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{exp.date}</span>
                      {exp.paymentMethod && <span>· {exp.paymentMethod}</span>}
                    </p>
                    {exp.notes && (
                      <p className="text-xs text-slate-600 italic">"{exp.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-slate-900 font-mono shrink-0">
                      ${exp.amountUsd.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Eliminar gasto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Nuevo Gasto Personal</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                  Importe en USD *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 border rounded-xl text-xs font-semibold outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2 border rounded-xl text-xs font-semibold outline-none"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                    Fecha del Gasto
                  </label>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs font-semibold outline-none"
                  >
                    {days.map(d => (
                      <option key={d.date} value={d.date}>
                        {d.date.slice(5)} ({d.city.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs font-semibold outline-none"
                    placeholder="Boston, NY, Orlando..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                  Notas / Concepto (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Almuerzo Chipotle, Metrocard..."
                  className="w-full p-2 border rounded-xl text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all mt-2"
              >
                Guardar Gasto en IndexedDB
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
