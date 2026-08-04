'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import ExpensesView from '@/components/views/ExpensesView';
import ReceiptView from '@/components/views/ReceiptView';
import { DollarSign } from 'lucide-react';

export default function MoneySectionPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'expenses' | 'receipt'>('expenses');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Household Financial Hub
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Expenses, Receipts & Spending Intelligence</h1>
            <p className="text-sm text-slate-400 mt-1">Split household bills, scan OCR receipts, and track spending trends</p>
          </div>

          {/* Section Tabs */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'expenses' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expenses & Splits
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'receipt' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Scan Receipt
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'expenses' && <ExpensesView />}
        {activeTab === 'receipt' && <ReceiptView />}
      </main>
    </div>
  );
}
