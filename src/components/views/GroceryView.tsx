'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  User, 
  PackageCheck, 
  Sparkles, 
  DollarSign,
  Filter,
  Layers,
  PieChart,
  Users
} from 'lucide-react';

const CATEGORIES = ['ALL', 'PRODUCE', 'DAIRY', 'MEAT', 'PANTRY', 'HOUSEHOLD', 'PERSONAL', 'GROCERY'];

export default function GroceryView() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Add Form State
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('AUTO');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState('pcs');
  const [itemPrice, setItemPrice] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Split Form State
  const [splitTitle, setSplitTitle] = useState('Grocery Shopping Trip');
  const [splitAmount, setSplitAmount] = useState('');
  const [submittingSplit, setSubmittingSplit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const memRes = await fetch('/api/household/members');
      const memData = await memRes.json();
      if (memData.members) setMembers(memData.members);

      const groceryRes = await fetch('/api/grocery');
      const groceryData = await groceryRes.json();
      if (groceryData.list?.items) {
        setItems(groceryData.list.items);
        const estTotal = groceryData.list.items.reduce((sum: number, i: any) => sum + (i.estimatedPrice || 0) * (i.quantity || 1), 0);
        if (estTotal > 0) setSplitAmount(estTotal.toFixed(2));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    try {
      const res = await fetch('/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          category: itemCategory,
          quantity: itemQuantity,
          unit: itemUnit,
          estimatedPrice: itemPrice,
          assignedToId: assignedToId || undefined,
          notes: itemNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.item) {
        setItems([data.item, ...items]);
        setIsModalOpen(false);
        resetForm();
        showToast('Item added to grocery list!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSplitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(splitAmount);
    if (!splitTitle.trim() || isNaN(numericAmount) || numericAmount <= 0) return;

    setSubmittingSplit(true);
    try {
      const effectiveMembers = members.length > 0 ? members : [
        { userId: 'demo-user-id-1', user: { name: 'Alex Morgan' } },
        { userId: 'demo-user-id-2', user: { name: 'Sam Taylor' } },
      ];

      const perPerson = parseFloat((numericAmount / effectiveMembers.length).toFixed(2));
      const splits = effectiveMembers.map((m) => ({
        userId: m.userId,
        amount: perPerson,
      }));

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: splitTitle,
          amount: numericAmount,
          category: 'GROCERY',
          splits,
        }),
      });

      if (res.ok) {
        setIsSplitModalOpen(false);
        showToast(`Split $${numericAmount.toFixed(2)} grocery bill across ${effectiveMembers.length} members!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSplit(false);
    }
  };

  const resetForm = () => {
    setItemName('');
    setItemCategory('AUTO');
    setItemQuantity('1');
    setItemUnit('pcs');
    setItemPrice('');
    setAssignedToId('');
    setItemNotes('');
  };

  const togglePurchased = async (item: any) => {
    const nextPurchasedState = !item.isPurchased;
    setItems(items.map((i) => (i.id === item.id ? { ...i, isPurchased: nextPurchasedState } : i)));

    try {
      await fetch(`/api/grocery/item/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPurchased: nextPurchasedState }),
      });
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const deleteItem = async (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    try {
      await fetch(`/api/grocery/item/${id}`, { method: 'DELETE' });
      showToast('Item deleted');
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const handleTransferToInventory = async () => {
    setTransferring(true);
    try {
      const res = await fetch('/api/grocery/purchased-to-inventory', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Purchased items transferred to Inventory!');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransferring(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredItems = selectedCategory === 'ALL'
    ? items
    : items.filter((i) => i.category.toUpperCase() === selectedCategory);

  const purchasedCount = items.filter((i) => i.isPurchased).length;
  const totalEstimatedCost = items.reduce((sum, i) => sum + (i.estimatedPrice || 0) * (i.quantity || 1), 0);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5" /> {toastMessage}
        </div>
      )}

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="text-xs text-slate-400 font-medium">
          Collaborative household shopping list
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {purchasedCount > 0 && (
            <button
              onClick={handleTransferToInventory}
              disabled={transferring}
              className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <PackageCheck className="w-4 h-4 text-teal-400" />
              Transfer {purchasedCount} Checked to Pantry
            </button>
          )}

          <button
            onClick={() => {
              if (totalEstimatedCost > 0) setSplitAmount(totalEstimatedCost.toFixed(2));
              setIsSplitModalOpen(true);
            }}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
          >
            <PieChart className="w-4 h-4 text-cyan-400" /> Split Expense
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="gradient-bg gradient-bg-hover text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Items</div>
            <div className="text-xl font-bold text-white">{items.length}</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Purchased</div>
            <div className="text-xl font-bold text-white">{purchasedCount} of {items.length}</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Estimated Total</div>
            <div className="text-xl font-bold text-emerald-400">${totalEstimatedCost.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'gradient-bg text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grocery List Items */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 rounded-xl animate-pulse h-16 bg-slate-800/40" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No items found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Your grocery list is clear! Click "Add Item" to start adding groceries for your household.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`glass-card p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                item.isPurchased
                  ? 'border-slate-800/50 opacity-60 bg-slate-950/40'
                  : 'border-slate-800 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <button
                  onClick={() => togglePurchased(item)}
                  className="text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                >
                  {item.isPurchased ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-600" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${item.isPurchased ? 'line-through text-slate-500' : 'text-white'}`}>
                      {item.name}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      ({item.quantity} {item.unit})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">
                      {item.category}
                    </span>

                    {item.estimatedPrice > 0 && (
                      <span className="text-emerald-400 font-medium">
                        ~${(item.estimatedPrice * item.quantity).toFixed(2)}
                      </span>
                    )}

                    {item.assignedTo && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <User className="w-3 h-3 text-emerald-400" /> {item.assignedTo.name}
                      </span>
                    )}

                    {item.notes && <span className="italic text-slate-500">"{item.notes}"</span>}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteItem(item.id)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Add Grocery Item
            </h2>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Organic Almond Milk"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="pcs, kg, carton"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="AUTO">✨ Auto-Detect</option>
                    {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Est. Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="3.99"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign to Member</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Anyone (Unassigned)</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
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
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Split Expense Modal */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-cyan-400" /> Split Grocery Bill Across Household
            </h2>

            <form onSubmit={handleSplitExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Trip / Expense Title</label>
                <input
                  type="text"
                  required
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                  placeholder="Walmart Grocery Run"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Total Bill Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value)}
                  placeholder="45.90"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" /> Automatic Equal Split:
                </div>
                <div>
                  Each member pays ~${((parseFloat(splitAmount) || 0) / (members.length || 2)).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSplitModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSplit}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold px-4 py-2 rounded-xl shadow-lg transition-all"
                >
                  {submittingSplit ? 'Splitting...' : 'Confirm Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
