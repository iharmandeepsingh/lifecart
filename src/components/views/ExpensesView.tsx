'use client';

import React, { useState, useEffect } from 'react';
import { 
  PieChart as PieChartIcon, 
  DollarSign, 
  Plus, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles
} from 'lucide-react';

export default function ExpensesView() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settlingUserId, setSettlingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form State for Manual Expense
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('GROCERY');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const expRes = await fetch('/api/expenses');
      const expData = await expRes.json();
      if (expData.expenses) setExpenses(expData.expenses);
      if (expData.balances) setBalances(expData.balances);
      if (expData.members) setMembers(expData.members);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const numAmount = parseFloat(amount);
    const perMemberAmount = members.length > 0 ? parseFloat((numAmount / members.length).toFixed(2)) : numAmount;
    const splits = members.map((m) => ({
      userId: m.userId,
      amount: perMemberAmount,
    }));

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount: numAmount,
          category,
          date,
          splits,
        }),
      });

      if (res.ok) {
        showToast('Expense added and split equally!');
        setIsModalOpen(false);
        setTitle('');
        setAmount('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettleUp = async (targetUserId: string) => {
    setSettlingUserId(targetUserId);
    try {
      const res = await fetch('/api/expenses/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        showToast('Settled up successfully!');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettlingUserId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-8">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5" /> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <PieChartIcon className="w-3.5 h-3.5" /> Bill & Expense Splitting
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Household Expenses & Settle Up</h1>
          <p className="text-sm text-slate-400 mt-1">Automatic expense balances, splitting, and member settlements</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="gradient-bg gradient-bg-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Manual Expense
        </button>
      </div>

      {/* Member Balances Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" /> Member Balances & Settlements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => {
            const bal = balances[m.userId] || 0;
            const isMe = m.userId === currentUser?.id;

            return (
              <div
                key={m.userId}
                className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white text-lg font-bold shadow-md shadow-emerald-500/20">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      {m.user.name} {isMe && <span className="text-[10px] text-emerald-400 font-semibold">(You)</span>}
                    </div>
                    <div className="text-xs text-slate-400">
                      {bal > 0 ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Is owed ${bal.toFixed(2)}
                        </span>
                      ) : bal < 0 ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Owes ${Math.abs(bal).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500">Settled up</span>
                      )}
                    </div>
                  </div>
                </div>

                {!isMe && bal !== 0 && (
                  <button
                    onClick={() => handleSettleUp(m.userId)}
                    disabled={settlingUserId === m.userId}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    {settlingUserId === m.userId ? 'Settling...' : 'Settle Up'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Expenses Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" /> Recent Household Expenses
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 rounded-xl animate-pulse h-16 bg-slate-800/40" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center border border-slate-800/80 rounded-2xl space-y-3 bg-slate-950/40">
            <PieChartIcon className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-slate-300 font-semibold text-sm">No expenses logged yet</div>
            <div className="text-xs text-slate-500 max-w-xs mx-auto">
              Scan a receipt or add a manual expense to start tracking household split costs.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-sm">{expense.title}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                        {expense.category}
                      </span>
                      <span>Paid by {expense.paidBy.name}</span>
                      <span>• {new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-emerald-400">${expense.amount.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-500">
                    Split ({expense.splits.length} members)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Add Manual Expense
            </h2>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Electric Bill, Internet, Costco Run"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="45.00"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="GROCERY">GROCERY</option>
                    <option value="UTILITIES">UTILITIES</option>
                    <option value="RENT">RENT</option>
                    <option value="HOUSEHOLD">HOUSEHOLD</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-bg text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Add & Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
