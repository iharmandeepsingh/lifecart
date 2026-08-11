'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { ShieldAlert, BarChart3, CheckCircle2, AlertTriangle, FileText, Sparkles, Database } from 'lucide-react';

export default function UniversityEvaluationDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [evalData, setEvalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      });

    fetch('/api/admin/evaluation')
      .then((res) => {
        if (res.status === 403) throw new Error('Forbidden: System Admin Authorization Required');
        return res.json();
      })
      .then((data) => setEvalData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <BarChart3 className="w-3.5 h-3.5" /> University Research & Evaluation Metrics
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">University Evaluation Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Verified empirical performance metrics for OCR, predictions, and optimization</p>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
            SYSTEM_ADMIN Secured
          </span>
        </div>

        {error ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-rose-500/30 space-y-3 bg-rose-950/10">
            <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-rose-300">{error}</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This dashboard is strictly protected. Log in with a system administrator account to inspect research metrics.
            </p>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse h-28 bg-slate-800/40" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-5 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Total Scanned Receipts</div>
                <div className="text-2xl font-bold text-white mt-1">{evalData?.summary?.totalReceipts || 0}</div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Tracked Purchases</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{evalData?.summary?.totalPurchases || 0}</div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Active Demo Households</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1">{evalData?.summary?.totalHouseholds || 0}</div>
              </div>
            </div>

            {/* OCR Accuracy & Verification Log */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> Verified OCR Performance & Corrections
              </h2>

              {evalData?.ocrEvaluations?.length === 0 ? (
                <div className="text-xs text-slate-400 italic">
                  Insufficient evaluation data. Scan receipts to generate OCR accuracy metrics.
                </div>
              ) : (
                <div className="space-y-2">
                  {evalData?.ocrEvaluations?.map((rec: any) => (
                    <div key={rec.id} className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">Confidence: {rec.ocrConfidence}%</span>
                        <span className="text-slate-400 ml-2">Extracted {rec.extractedItemsCount} items</span>
                      </div>
                      <span className={`font-bold ${rec.correctedItemsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {rec.correctedItemsCount > 0 ? `${rec.correctedItemsCount} user corrections` : '100% Verified Correct'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
