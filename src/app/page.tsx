'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Receipt, 
  PieChart, 
  Package, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4" /> AI-Powered Smart Household & Shopping Assistant
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Simplify Household Shopping & <span className="gradient-text">Split Expenses Effortlessly</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            LifeCart is the all-in-one platform for families, roommates, and students to manage shared grocery lists, OCR receipt scanning, expense splitting, and document wallet storage.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="gradient-bg gradient-bg-hover text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center gap-2 hover:scale-105 transition-all"
            >
              Open Household Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/grocery"
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base px-8 py-4 rounded-2xl transition-all"
            >
              View Smart Grocery List
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Shared Grocery Lists</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time collaboration across household members with auto-category detection and member assignments.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-md">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">OCR Receipt Scanning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extract line items, prices, tax, and totals directly from receipt photos using client/server OCR.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-md">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Expense & Bill Splitting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic net balance calculation between household members with instant one-click settlement.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-md">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Pantry Inventory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Live stock level tracking with threshold alerts. Automatically add low-stock pantry items back to grocery lists.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
