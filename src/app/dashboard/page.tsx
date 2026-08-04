'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  Sparkles, 
  ShoppingCart, 
  Receipt, 
  DollarSign, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BrainCircuit, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Store,
  ChevronRight,
  Database
} from 'lucide-react';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [lowInventory, setLowInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const predRes = await fetch('/api/predictions');
      const predData = await predRes.json();
      if (predData.predictions) setPredictions(predData.predictions);

      const intelRes = await fetch('/api/intelligence');
      const intelData = await intelRes.json();
      if (intelData) setIntelligence(intelData);

      const warRes = await fetch('/api/warranties');
      const warData = await warRes.json();
      if (warData.warranties) setWarranties(warData.warranties);

      const invRes = await fetch('/api/inventory');
      const invData = await invRes.json();
      if (invData.items) {
        setLowInventory(invData.items.filter((i: any) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Demo data loaded successfully!');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const expiringWarranties = warranties.filter((w) => w.status === 'EXPIRING_SOON' || w.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Today in LifeCart Header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Daily Summary Feed
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Today in LifeCart — {currentUser?.household?.name || 'My Household'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, {currentUser?.name || 'Alex'}! Here is your prioritized daily household summary.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLoadDemo}
              disabled={loadingDemo}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              {loadingDemo ? 'Loading Demo...' : 'Load 1-Click Demo Data'}
            </button>

            <Link
              href="/privacy"
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              Privacy Controls
            </Link>
          </div>
        </div>

        {/* LifeCart AI Quick Assistant Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-base">Ask LifeCart AI Engine</div>
              <div className="text-xs text-slate-400">
                Grounded natural language answers for shopping lists, receipts, warranties & expenses
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-bold hidden md:inline">
              Try: "What products are running low?"
            </span>
          </div>
        </div>

        {/* Priority Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Low Stock Alert */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold uppercase">Pantry Stock</span>
              <Package className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{lowInventory.length} Items</div>
            <div className="text-xs text-slate-400">
              {lowInventory.length > 0
                ? `${lowInventory[0]?.name || 'Milk'} running low`
                : 'All pantry items in stock'}
            </div>
          </div>

          {/* Card 2: Expiring Warranties */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold uppercase">Expiring Warranties</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{expiringWarranties.length} Products</div>
            <div className="text-xs text-amber-400 font-semibold">
              {warranties.find((w) => w.status === 'EXPIRING_SOON')?.name
                ? `${warranties.find((w) => w.status === 'EXPIRING_SOON')?.name} (expiring soon)`
                : 'No urgent warranty expirations'}
            </div>
          </div>

          {/* Card 3: Predicted Purchases */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold uppercase">Predicted Purchases</span>
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{predictions.length} Suggestions</div>
            <div className="text-xs text-slate-400">
              {predictions.length > 0 ? `Next buy: ${predictions[0]?.productName}` : 'No predictions yet'}
            </div>
          </div>

          {/* Card 4: LifeCart Savings */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold uppercase">Multi-Store Savings</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">$3.55 Saved</div>
            <div className="text-xs text-slate-400">Via Split-Trip Optimization</div>
          </div>
        </div>

        {/* 5 Core Feature Access Navigation Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Explore LifeCart Core Sections</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/shopping"
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="font-bold text-white text-base">Shopping & Deals</div>
              <div className="text-xs text-slate-400">Grocery list, price comparison & basket optimizer</div>
            </Link>

            <Link
              href="/money"
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="font-bold text-white text-base">Money & Receipts</div>
              <div className="text-xs text-slate-400">Expense splits, settle up & OCR receipt scanner</div>
            </Link>

            <Link
              href="/household"
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <div className="font-bold text-white text-base">Pantry & Members</div>
              <div className="text-xs text-slate-400">Pantry stock levels, consumed items & roommates</div>
            </Link>

            <Link
              href="/mystuff"
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="font-bold text-white text-base">My Stuff & Vault</div>
              <div className="text-xs text-slate-400">Document vault, warranties & AI buying assistant</div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
