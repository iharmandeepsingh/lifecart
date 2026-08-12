'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShoppingCart, Plus, CheckCircle2, Circle, Trash2, User,
  PackageCheck, Sparkles, DollarSign, Filter, Layers, PieChart, Users, X
} from 'lucide-react';

const CATEGORIES = ['ALL', 'PRODUCE', 'DAIRY', 'MEAT', 'PANTRY', 'HOUSEHOLD', 'PERSONAL', 'GROCERY'];

export default function GroceryView() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [submittingSplit, setSubmittingSplit] = useState(false);

  // Add Form State
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('AUTO');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState('pcs');
  const [itemPrice, setItemPrice] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Split Form State
  const [splitTitle, setSplitTitle] = useState('Weekly Grocery Trip');
  const [splitAmount, setSplitAmount] = useState('50.00');

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
      const [userRes, memRes, groceryRes] = await Promise.all([
        fetch('/api/auth/me', { signal: controller.signal }),
        fetch('/api/household/members', { signal: controller.signal }),
        fetch('/api/grocery', { signal: controller.signal }),
      ]);

      // If this request was aborted, a newer one is already running — bail out
      if (controller.signal.aborted) return;

      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const memData = await memRes.json();
      if (memData.members?.length > 0) setMembers(memData.members);

      const groceryData = await groceryRes.json();
      // Server is single source of truth — only replace state on real DB data (non-fallback)
      if (!groceryData.isFallback && groceryData.list?.items) {
        setItems(groceryData.list.items);
        const estTotal = groceryData.list.items.reduce(
          (sum: number, i: any) => sum + (i.estimatedPrice || 0) * (i.quantity || 1), 0
        );
        if (estTotal > 0) setSplitAmount(estTotal.toFixed(2));
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // Expected — ignore aborted requests
      console.error('Fetch grocery error:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds, but skip if a fetch is already in-flight
    const syncInterval = setInterval(() => fetchData(true), 5000);
    return () => {
      clearInterval(syncInterval);
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || !itemName.trim()) return;
    isSubmittingRef.current = true;

    const name = itemName.trim();
    setIsModalOpen(false);
    showToast(`Adding "${name}"…`);
    resetForm();

    try {
      await fetch('/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category: itemCategory,
          quantity: itemQuantity,
          unit: itemUnit,
          estimatedPrice: itemPrice,
          assignedToId: assignedToId || undefined,
          notes: itemNotes,
        }),
      });
      await fetchData(false); // Non-poll fetch — always runs
      showToast(`Added "${name}" to grocery list!`);
    } catch (err) {
      console.error('Add item error:', err);
      showToast('Failed to add item. Please try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleSplitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(splitAmount) || 50.00;
    if (!splitTitle.trim() || numericAmount <= 0) return;
    setSubmittingSplit(true);

    const activeMembers = members.length > 0 ? members : [
      { userId: 'user-harman', user: { name: 'Harman' } },
      { userId: 'user-raj', user: { name: 'Raj' } },
      { userId: 'user-simar', user: { name: 'Simar' } },
      { userId: 'user-asis', user: { name: 'Asis' } },
      { userId: 'user-arman', user: { name: 'Arman' } },
    ];

    const perPerson = parseFloat((numericAmount / activeMembers.length).toFixed(2));
    setIsSplitModalOpen(false);
    showToast(`Split $${numericAmount.toFixed(2)} across ${activeMembers.length} members!`);

    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: splitTitle,
          amount: numericAmount,
          category: 'GROCERY',
          splits: activeMembers.map((m) => ({ userId: m.userId, amount: perPerson })),
        }),
      });
    } catch (err) {
      console.error('Split expense error:', err);
    } finally {
      setSubmittingSplit(false);
    }
  };

  const resetForm = () => {
    setItemName(''); setItemCategory('AUTO'); setItemQuantity('1');
    setItemUnit('pcs'); setItemPrice(''); setAssignedToId(''); setItemNotes('');
  };

  const togglePurchased = async (item: any) => {
    // Optimistic local toggle
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isPurchased: !i.isPurchased } : i));
    try {
      await fetch(`/api/grocery/item/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPurchased: !item.isPurchased }),
      });
      await fetchData(false);
    } catch (err) {
      console.error(err);
      await fetchData(false);
    }
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Item deleted');
    try {
      await fetch(`/api/grocery/item/${id}`, { method: 'DELETE' });
      await fetchData(false);
    } catch (err) {
      console.error(err);
      await fetchData(false);
    }
  };

  const handleTransferToInventory = async () => {
    setTransferring(true);
    try {
      const res = await fetch('/api/grocery/purchased-to-inventory', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Transferred to Pantry!');
      await fetchData(false);
    } catch (err) {
      console.error(err);
    } finally {
      setTransferring(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const filteredItems = selectedCategory === 'ALL'
    ? items
    : items.filter((i) => i.category?.toUpperCase() === selectedCategory);

  const purchasedCount = items.filter((i) => i.isPurchased).length;
  const totalEstimatedCost = items.reduce((sum, i) => sum + (i.estimatedPrice || 0) * (i.quantity || 1), 0);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-emerald-500 text-slate-950 font-bold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce border border-emerald-400">
          <Sparkles className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-emerald-400" />
          Household Grocery List · Live synced every 5s
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {purchasedCount > 0 && (
            <button type="button" onClick={handleTransferToInventory} disabled={transferring}
              className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer">
              <PackageCheck className="w-4 h-4 text-teal-400" /> Transfer {purchasedCount} to Pantry
            </button>
          )}
          <button type="button"
            onClick={() => { if (totalEstimatedCost > 0) setSplitAmount(totalEstimatedCost.toFixed(2)); setIsSplitModalOpen(true); }}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 hover:scale-105 cursor-pointer">
            <PieChart className="w-4 h-4 text-cyan-400" /> Split Expense
          </button>
          <button type="button" onClick={() => setIsModalOpen(true)}
            className="gradient-bg gradient-bg-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 hover:scale-105 cursor-pointer">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Layers className="w-5 h-5" />, label: 'Total Items', value: items.length, color: 'emerald' },
          { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Purchased', value: `${purchasedCount} of ${items.length}`, color: 'teal' },
          { icon: <DollarSign className="w-5 h-5" />, label: 'Estimated Total', value: `$${totalEstimatedCost.toFixed(2)}`, color: 'cyan' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-400`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
        {CATEGORIES.map((cat) => (
          <button type="button" key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat ? 'gradient-bg text-white shadow-md' : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="glass-card p-4 rounded-xl animate-pulse h-16 bg-slate-800/40" />)}</div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No items found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Click "Add Item" to start your grocery list.</p>
          <button type="button" onClick={() => setIsModalOpen(true)}
            className="gradient-bg text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg mt-2 inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add First Item
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div key={item.id}
              className={`glass-card p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                item.isPurchased ? 'border-slate-800/50 opacity-60 bg-slate-950/40' : 'border-slate-800 hover:border-emerald-500/30'
              }`}>
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <button type="button" onClick={() => togglePurchased(item)}
                  className="text-slate-400 hover:text-emerald-400 transition-colors shrink-0">
                  {item.isPurchased ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Circle className="w-6 h-6 text-slate-600" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${item.isPurchased ? 'line-through text-slate-500' : 'text-white'}`}>{item.name}</span>
                    <span className="text-xs text-slate-400">({item.quantity} {item.unit})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{item.category}</span>
                    {item.estimatedPrice > 0 && <span className="text-emerald-400">${(item.estimatedPrice * item.quantity).toFixed(2)}</span>}
                    {item.assignedTo && <span className="flex items-center gap-1"><User className="w-3 h-3 text-emerald-400" />{item.assignedTo.name}</span>}
                    {item.notes && <span className="italic text-slate-500">"{item.notes}"</span>}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => deleteItem(item.id)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-400" /> Add Grocery Item</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name</label>
                <input type="text" required autoFocus value={itemName} onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Organic Milk 1.5L"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                  <input type="number" min="1" step="any" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                  <input type="text" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} placeholder="pcs, kg"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
                    <option value="AUTO">✨ Auto-Detect</option>
                    {CATEGORIES.filter((c) => c !== 'ALL').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Est. Price ($)</label>
                  <input type="number" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="4.29"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign to Member</label>
                <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
                  <option value="">Anyone (Unassigned)</option>
                  {members.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" className="gradient-bg text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Split Modal */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><PieChart className="w-5 h-5 text-cyan-400" /> Split Grocery Bill</h2>
              <button type="button" onClick={() => setIsSplitModalOpen(false)} className="text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSplitExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Trip Title</label>
                <input type="text" required autoFocus value={splitTitle} onChange={(e) => setSplitTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Total Amount ($)</label>
                <input type="number" step="0.01" required value={splitAmount} onChange={(e) => setSplitAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5"><Users className="w-4 h-4" /> Split equally among 5:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Harman', 'Raj', 'Simar', 'Asis', 'Arman'].map((name) => (
                    <div key={name} className="flex items-center justify-between bg-slate-800/60 px-2 py-1 rounded">
                      <span className="text-slate-400">{name}</span>
                      <span className="font-semibold text-emerald-300">${((parseFloat(splitAmount) || 0) / 5).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsSplitModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={submittingSplit}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer">
                  {submittingSplit ? 'Splitting…' : 'Confirm Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
