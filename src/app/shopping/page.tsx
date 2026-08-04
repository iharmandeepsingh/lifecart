'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import GroceryView from '@/components/views/GroceryView';
import { 
  ShoppingCart, 
  Store, 
  Sparkles, 
  Zap
} from 'lucide-react';

export default function ShoppingSectionPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'grocery' | 'compare' | 'optimizer'>('grocery');
  const [optimizerResult, setOptimizerResult] = useState<any>(null);
  const [comparisonProducts, setComparisonProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchShoppingData();
  }, []);

  const fetchShoppingData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const optRes = await fetch('/api/shopping/optimize');
      const optData = await optRes.json();
      if (optData.result) setOptimizerResult(optData.result);

      const compRes = await fetch('/api/shopping/compare');
      const compData = await compRes.json();
      if (compData.products) setComparisonProducts(compData.products);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShoppingCart className="w-3.5 h-3.5" /> Unified Shopping Center
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Shopping, Prices & Basket Optimization</h1>
            <p className="text-sm text-slate-400 mt-1">Smart grocery list, multi-store price comparison, and basket optimizer</p>
          </div>

          {/* Section Tabs */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('grocery')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'grocery' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grocery List
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'compare' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Price Comparison
            </button>
            <button
              onClick={() => setActiveTab('optimizer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'optimizer' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Basket Optimizer
            </button>
          </div>
        </div>

        {/* Tab 1: Grocery List */}
        {activeTab === 'grocery' && <GroceryView />}

        {/* Tab 2: Store Price Comparison */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" /> Store & Retailer Price Comparison
              </h2>
              <p className="text-xs text-slate-400">Normalized price-per-unit metrics across major grocery retailers</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {[
                  {
                    name: 'Organic Whole Milk (1 Gallon)',
                    category: 'DAIRY',
                    stores: [
                      { name: 'Walmart Supercenter', price: 4.29, unitPrice: '$4.29 / gal', isCheapest: true },
                      { name: "Trader Joe's", price: 4.69, unitPrice: '$4.69 / gal' },
                      { name: 'Target', price: 4.89, unitPrice: '$4.89 / gal' },
                    ],
                    badge: '🔥 Great Deal at Walmart',
                  },
                  {
                    name: 'Chicken Breast Family Pack (3 lbs)',
                    category: 'MEAT',
                    stores: [
                      { name: 'Costco Wholesale', price: 9.99, unitPrice: '$3.33 / lb', isCheapest: true },
                      { name: 'Walmart Supercenter', price: 11.49, unitPrice: '$3.83 / lb' },
                      { name: 'Kroger', price: 12.99, unitPrice: '$4.33 / lb' },
                    ],
                    badge: '⚡ Historic Low at Costco',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-base">{item.name}</h3>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      {item.stores.map((s, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/60">
                          <div className="flex items-center gap-2">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-200">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono text-[11px]">{s.unitPrice}</span>
                            <span className={`font-bold ${s.isCheapest ? 'text-emerald-400' : 'text-slate-300'}`}>
                              ${s.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Shopping Basket Optimizer */}
        {activeTab === 'optimizer' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-400" /> Shopping Basket Optimizer
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Calculates cheapest single store vs. split-trip multi-store combination</p>
                </div>
                {optimizerResult?.cheapestMultiStore?.estimatedSavings > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> Save ${optimizerResult.cheapestMultiStore.estimatedSavings.toFixed(2)} with Multi-Store
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Single Store Option */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Option A: Cheapest Single Store</div>
                  <div className="text-2xl font-bold text-white">
                    {optimizerResult?.cheapestSingleStore?.storeName || 'Walmart Supercenter'}
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    ${(optimizerResult?.cheapestSingleStore?.totalCost || 24.95).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Buy all items in 1 trip for convenience.
                  </div>
                </div>

                {/* Multi Store Option */}
                <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-4">
                  <div className="text-xs text-emerald-400 font-semibold uppercase">Option B: Optimized Multi-Store Combination</div>
                  <div className="text-2xl font-bold text-white">Split Trip Optimization</div>
                  <div className="text-xl font-bold text-emerald-400">
                    ${(optimizerResult?.cheapestMultiStore?.totalCost || 21.40).toFixed(2)}
                  </div>
                  <div className="text-xs text-emerald-300">
                    Save ~15% by splitting your grocery list across optimal stores.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
