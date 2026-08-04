'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Shield, Download, Trash2, Lock, CheckCircle2, Sparkles } from 'lucide-react';

export default function PrivacyPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      });
  }, []);

  const handleExportData = () => {
    window.open('/api/privacy/export', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" /> GDPR & Data Governance
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Privacy, Consent & Data Ownership</h1>
          <p className="text-sm text-slate-400 mt-1">Export your complete household dataset, manage permissions, or request data deletion</p>
        </div>

        {/* Section 1: Data Export */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" /> Export Household Data (JSON)
          </h2>
          <p className="text-xs text-slate-400">
            In compliance with GDPR Article 20 (Right to Data Portability), you can download a complete structured JSON copy of all your household shopping lists, expense records, scanned receipts, inventory items, documents, and registered warranty products.
          </p>
          <button
            onClick={handleExportData}
            className="gradient-bg text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Complete JSON Export
          </button>
        </div>

        {/* Section 2: Privacy Principles & Encryption */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" /> Household Data Isolation & Security
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Isolated Household Scopes
              </div>
              <p className="text-slate-400">Strict database-level checks ensure only verified members with your invite code access household data.</p>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Password Hashing
              </div>
              <p className="text-slate-400">User credentials are encrypted using bcrypt hashing before storage.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
