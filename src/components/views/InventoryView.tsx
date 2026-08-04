'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Utensils
} from 'lucide-react';

const LOCATIONS = ['ALL', 'PANTRY', 'FRIDGE', 'FREEZER', 'STORAGE'];

export default function InventoryView() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('PANTRY');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [minThreshold, setMinThreshold] = useState('1');
  const [location, setLocation] = useState('PANTRY');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const invRes = await fetch('/api/inventory');
      const invData = await invRes.json();
      if (invData.items) setItems(invData.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          quantity,
          unit,
          minThreshold,
          location,
        }),
      });

      const data = await res.json();
      if (res.ok && data.item) {
        setItems([data.item, ...items]);
        setIsModalOpen(false);
        resetForm();
        showToast('Item added to Pantry Inventory!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('PANTRY');
    setQuantity('1');
    setUnit('pcs');
    setMinThreshold('1');
    setLocation('PANTRY');
  };

  const handleConsumeOne = async (item: any) => {
    const newQty = Math.max(0, item.quantity - 1);
    const thresh = item.minThreshold;
    const newStatus = newQty <= 0 ? 'OUT_OF_STOCK' : newQty <= thresh ? 'LOW_STOCK' : 'IN_STOCK';

    setItems(items.map((i) => (i.id === item.id ? { ...i, quantity: newQty, status: newStatus } : i)));

    try {
      await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, consumeOne: true }),
      });
      showToast(`Consumed 1 ${item.unit} of ${item.name}`);
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);
    const thresh = item.minThreshold;
    const newStatus = newQty <= 0 ? 'OUT_OF_STOCK' : newQty <= thresh ? 'LOW_STOCK' : 'IN_STOCK';

    setItems(items.map((i) => (i.id === id ? { ...i, quantity: newQty, status: newStatus } : i)));

    try {
      await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: newQty }),
      });
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const deleteItem = async (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    try {
      await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      showToast('Item removed from inventory');
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const handleRestockLowStock = async () => {
    setRestocking(true);
    try {
      const res = await fetch('/api/inventory/restock', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Low stock items added to Grocery List!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRestocking(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredItems = items.filter((i) => {
    const matchesLoc = selectedLocation === 'ALL' || i.location === selectedLocation;
    const matchesStatus = selectedStatus === 'ALL' || (i.status || (i.quantity <= i.minThreshold ? 'LOW_STOCK' : 'IN_STOCK')) === selectedStatus;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLoc && matchesStatus && matchesSearch;
  });

  const lowStockCount = items.filter((i) => i.quantity <= i.minThreshold).length;

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
            <Package className="w-3.5 h-3.5" /> Smart Household Inventory
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pantry & Inventory Management</h1>
          <p className="text-sm text-slate-400 mt-1">Track stock levels, mark items consumed, and auto-restock low pantry inventory</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lowStockCount > 0 && (
            <button
              onClick={handleRestockLowStock}
              disabled={restocking}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              Restock {lowStockCount} Low Stock Item(s)
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="gradient-bg gradient-bg-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Inventory Item
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLocation === loc
                  ? 'gradient-bg text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pantry..."
            className="w-full bg-slate-900/90 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-4 py-2 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Inventory Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 rounded-2xl animate-pulse h-36 bg-slate-800/40" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No inventory items found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Scan receipts or add items directly to track your household pantry stock.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const status = item.quantity <= 0 ? 'OUT_OF_STOCK' : item.quantity <= item.minThreshold ? 'LOW_STOCK' : 'IN_STOCK';

            return (
              <div
                key={item.id}
                className={`glass-card p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                  status === 'OUT_OF_STOCK'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : status === 'LOW_STOCK'
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-100 text-base">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                        {item.location}
                      </span>
                      <span>Threshold: {item.minThreshold} {item.unit}</span>
                    </div>
                  </div>

                  {status === 'OUT_OF_STOCK' ? (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <XCircle className="w-3 h-3 text-rose-400" /> Out of Stock
                    </span>
                  ) : status === 'LOW_STOCK' ? (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> Low Stock
                    </span>
                  ) : (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> In Stock
                    </span>
                  )}
                </div>

                {/* Quantity Controller & Consumed Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-emerald-400 min-w-[40px] text-center">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.quantity > 0 && (
                      <button
                        onClick={() => handleConsumeOne(item)}
                        className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-300 flex items-center gap-1 transition-colors"
                        title="Mark 1 unit as consumed"
                      >
                        <Utensils className="w-3 h-3 text-amber-400" /> Consumed
                      </button>
                    )}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
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

      {/* Add Inventory Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Add Inventory Item
            </h2>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Extra Virgin Olive Oil"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs, bottles, kg"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Low Stock Limit</label>
                  <input
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Storage Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="PANTRY">PANTRY</option>
                    <option value="FRIDGE">FRIDGE</option>
                    <option value="FREEZER">FREEZER</option>
                    <option value="STORAGE">STORAGE</option>
                  </select>
                </div>
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
