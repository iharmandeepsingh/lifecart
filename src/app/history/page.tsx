'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { 
  History, 
  Store, 
  Tag, 
  Calendar, 
  DollarSign, 
  Search, 
  ShoppingBag,
  Filter,
  User
} from 'lucide-react';

export default function PurchaseHistoryPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const histRes = await fetch('/api/history');
      const histData = await histRes.json();
      if (histData.purchases) setPurchases(histData.purchases);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalSpentHistory = purchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <History className="w-3.5 h-3.5" /> Itemized Ledger
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Product Purchase History</h1>
            <p className="text-sm text-slate-400 mt-1">Detailed product-level history across all scanned receipts and purchases</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-xl flex items-center gap-4">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Tracked Purchases</div>
              <div className="text-xl font-bold text-emerald-400">${totalSpentHistory.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product or store..."
              className="w-full bg-slate-900/90 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'GROCERY', 'PRODUCE', 'DAIRY', 'MEAT', 'PANTRY', 'HOUSEHOLD', 'PERSONAL'].map((cat) => (
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
        </div>

        {/* Purchase History Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-slate-300 font-semibold text-sm">No purchase records found</div>
              <div className="text-xs text-slate-500 max-w-xs mx-auto">
                Scan receipts to build your product purchase history and unlock smart purchase predictions.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Product Name</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Store</th>
                    <th className="px-6 py-3.5">Price</th>
                    <th className="px-6 py-3.5">Purchased By</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        {purchase.productName}
                        {purchase.quantity > 1 && (
                          <span className="text-slate-400 ml-1.5 font-normal">({purchase.quantity}x)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono text-[10px]">
                          {purchase.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-1.5 text-slate-300">
                        <Store className="w-3.5 h-3.5 text-emerald-400" /> {purchase.storeName}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400">
                        ${purchase.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {purchase.user?.name || 'Household'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
