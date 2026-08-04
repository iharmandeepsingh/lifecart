'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import InventoryView from '@/components/views/InventoryView';
import MembersView from '@/components/views/MembersView';
import { Package } from 'lucide-react';

export default function HouseholdSectionPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'members'>('inventory');

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
              <Package className="w-3.5 h-3.5" /> Household Space
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pantry Inventory & Members</h1>
            <p className="text-sm text-slate-400 mt-1">Manage pantry stock levels, consumed items, and household members</p>
          </div>

          {/* Section Tabs */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'inventory' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pantry Inventory
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'members' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Members & Invites
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'members' && <MembersView />}
      </main>
    </div>
  );
}
