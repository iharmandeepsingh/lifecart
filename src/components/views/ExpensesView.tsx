'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PieChart as PieChartIcon, 
  DollarSign, 
  Plus, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';

const DEFAULT_5_MEMBERS = [
  { userId: 'user-harman', user: { id: 'user-harman', name: 'Harman', email: 'harman@lifecart.com' } },
  { userId: 'user-raj', user: { id: 'user-raj', name: 'Raj', email: 'raj@lifecart.com' } },
  { userId: 'user-simar', user: { id: 'user-simar', name: 'Simar', email: 'simar@lifecart.com' } },
  { userId: 'user-asis', user: { id: 'user-asis', name: 'Asis', email: 'asis@lifecart.com' } },
  { userId: 'user-arman', user: { id: 'user-arman', name: 'Arman', email: 'arman@lifecart.com' } },
];

export default function ExpensesView() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>(DEFAULT_5_MEMBERS);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [settledUserIds, setSettledUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settlingUserId, setSettlingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('GROCERY');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidById, setPaidById] = useState('');

  // Refs to prevent race conditions
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef(false);

  const fetchData = useCallback(async (fromPoll = false) => {
    // If polling, skip if a fetch is already in progress to prevent race conditions
    if (fromPoll && isFetchingRef.current) return;

    // Cancel any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    isFetchingRef.current = true;

    try {
      const [userRes, expRes] = await Promise.all([
        fetch('/api/auth/me', { signal: controller.signal }),
        fetch('/api/expenses', { signal: controller.signal }),
      ]);

      // If aborted, do nothing — a newer fetch is already running
      if (controller.signal.aborted) return;

      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const expData = await expRes.json();

      // Server is single source of truth: only replace state on real DB data
      if (!expData.isFallback && Array.isArray(expData.expenses)) {
        setExpenses(expData.expenses);
      }

      if (expData.members?.length > 0) {
        setMembers(expData.members);
        if (!paidById) {
          const firstId = expData.members[0]?.user?.id || expData.members[0]?.userId;
          if (firstId) setPaidById(firstId);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // Expected — ignore aborted requests
      console.error('Fetch expenses error:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [paidById]);

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds, but skip if a fetch is already in-flight
    const syncInterval = setInterval(() => fetchData(true), 5000);
    return () => {
      clearInterval(syncInterval);
      abortControllerRef.current?.abort();
    };
  }, []);

  const calculateBalances = () => {
    const balMap: Record<string, number> = {};
    members.forEach((m) => { balMap[m.user?.id || m.userId] = 0; });

    expenses.forEach((exp) => {
      const payerId = exp.paidBy?.id || exp.paidById;
      (exp.splits || []).forEach((s: any) => {
        const splitUserId = s.user?.id || s.userId;
        if (!s.isSettled && splitUserId !== payerId && !settledUserIds.has(splitUserId)) {
          balMap[splitUserId] = (balMap[splitUserId] || 0) - s.amount;
          balMap[payerId] = (balMap[payerId] || 0) + s.amount;
        }
      });
    });

    return balMap;
  };

  const computedBalances = calculateBalances();

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    isSubmittingRef.current = true;

    const activeMembers = members.length > 0 ? members : DEFAULT_5_MEMBERS;
    const perMemberAmount = parseFloat((numAmount / activeMembers.length).toFixed(2));
    const selectedPayer = activeMembers.find((m) => (m.user?.id || m.userId) === paidById) || activeMembers[0];
    const payerId = selectedPayer.user?.id || selectedPayer.userId;
    const payerName = selectedPayer.user?.name || 'Harman';
    const savedTitle = title.trim();
    const savedAmount = numAmount;

    setIsModalOpen(false);
    setTitle('');
    setAmount('');
    showToast(`Adding "$${savedAmount.toFixed(2)}" expense by ${payerName}…`);

    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: savedTitle,
          amount: savedAmount,
          category,
          date,
          paidById: payerId,
          splits: activeMembers.map((m) => ({
            userId: m.user?.id || m.userId,
            amount: perMemberAmount,
          })),
        }),
      });
      // Fetch fresh authoritative data from server (non-poll, so always runs)
      await fetchData(false);
      showToast(`Added "$${savedAmount.toFixed(2)}" paid by ${payerName}!`);
    } catch (err) {
      console.error('Add expense error:', err);
      showToast('Failed to save. Please try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    showToast('Expense removed!');
    try {
      await fetch(`/api/expenses?id=${expenseId}`, { method: 'DELETE' });
      await fetchData(false);
    } catch (err) {
      console.error('Delete expense error:', err);
      await fetchData(false);
    }
  };

  const handleSettleUp = async (targetUserId: string, targetName: string) => {
    setSettlingUserId(targetUserId);
    setSettledUserIds((prev) => new Set([...prev, targetUserId]));
    showToast(`Settled up with ${targetName}!`);
    try {
      await fetch('/api/expenses/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      await fetchData(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSettlingUserId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="space-y-8">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-emerald-500 text-slate-950 font-bold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce border border-emerald-400">
          <Sparkles className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <PieChartIcon className="w-3.5 h-3.5" /> Bill & Expense Splitting
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Household Expenses & Settle Up</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time sync across all devices via Neon cloud database</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="gradient-bg gradient-bg-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Add Manual Expense
        </button>
      </div>

      {/* Member Balances */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" /> Member Balances ({members.length} Members)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => {
            const memberUserId = m.user?.id || m.userId;
            const bal = computedBalances[memberUserId] || 0;
            const isMe = memberUserId === currentUser?.id || m.user?.name === 'Harman';
            return (
              <div key={memberUserId} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white text-lg font-bold shadow-md shadow-emerald-500/20">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      {m.user.name} {isMe && <span className="text-[10px] text-emerald-400 font-semibold">(Admin)</span>}
                    </div>
                    <div className="text-xs mt-0.5">
                      {bal > 0 ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Owed ${bal.toFixed(2)}
                        </span>
                      ) : bal < 0 ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Owes ${Math.abs(bal).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-emerald-400/80 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Settled up
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isMe && bal !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSettleUp(memberUserId, m.user.name)}
                    disabled={settlingUserId === memberUserId}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer hover:scale-105"
                  >
                    {settlingUserId === memberUserId ? 'Settling…' : 'Settle Up'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Expense List ({expenses.length})
          </h2>
          <span className="text-xs text-slate-500">Live synced · updates every 5s</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="glass-card p-4 rounded-xl animate-pulse h-16 bg-slate-800/40" />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center border border-slate-800/80 rounded-2xl space-y-3 bg-slate-950/40">
            <PieChartIcon className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-slate-300 font-semibold text-sm">No expenses yet</div>
            <div className="text-xs text-slate-500 max-w-xs mx-auto">
              Click "Add Manual Expense" to split costs across all 5 household members.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-100 text-sm truncate">{expense.title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">{expense.category}</span>
                      <span>Paid by <strong className="text-slate-200">{expense.paidBy?.name || 'Harman'}</strong></span>
                      <span>• {new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-bold text-emerald-400">${Number(expense.amount).toFixed(2)}</div>
                    <div className="text-[11px] text-slate-500">÷ {expense.splits?.length || 5} members</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" /> Add Manual Expense
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title</label>
                <input
                  type="text" required autoFocus value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Electric Bill, Grocery Run"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ($)</label>
                  <input
                    type="number" step="0.01" required value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50.00"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
                    <option value="GROCERY">GROCERY</option>
                    <option value="UTILITIES">UTILITIES</option>
                    <option value="RENT">RENT</option>
                    <option value="HOUSEHOLD">HOUSEHOLD</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Paid By Member</label>
                <select
                  value={paidById || (members[0]?.user?.id || members[0]?.userId)}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {members.map((m) => {
                    const mId = m.user?.id || m.userId;
                    return <option key={mId} value={mId}>{m.user.name} ({m.user.email})</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" className="gradient-bg text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer">
                  Add & Split Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
