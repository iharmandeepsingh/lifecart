'use client';

import React, { useState, useEffect } from 'react';
import { Home, Users, Copy, Check, Shield, UserPlus, Mail } from 'lucide-react';

export default function MembersView() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) {
        setCurrentUser(userData.user);
      }

      const memRes = await fetch('/api/household/members');
      const memData = await memRes.json();
      if (memData.members) {
        setMembers(memData.members);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (currentUser?.household?.inviteCode) {
      navigator.clipboard.writeText(currentUser.household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Home className="w-3.5 h-3.5" /> {currentUser?.household?.name || 'Household Members'}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Household Members & Invites</h1>
          <p className="text-sm text-slate-400 mt-1">Manage everyone sharing your grocery lists, expenses, and pantry inventory</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 p-3 rounded-xl flex items-center gap-3">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Invite Code</div>
            <div className="text-lg font-mono font-bold text-emerald-400 tracking-wider">
              {currentUser?.household?.inviteCode || 'CART-XXXX'}
            </div>
          </div>
          <button
            onClick={copyInviteCode}
            className="gradient-bg gradient-bg-hover text-white p-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>

      {/* Active Members Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" /> Active Household Members ({members.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse h-28 bg-slate-800/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white text-lg font-bold shadow-md shadow-emerald-500/20">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      {member.user.name}
                      {member.userId === currentUser?.id && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" /> {member.user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs font-semibold text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  {member.role}
                </div>
              </div>
            ))}

            {/* Invite Card Placeholder */}
            <div className="glass-card p-5 rounded-2xl border border-dashed border-slate-700/80 flex items-center justify-between hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                  <UserPlus className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200 text-sm">Invite Roommate or Partner</div>
                  <div className="text-xs text-slate-400">Share code <span className="font-mono text-emerald-400 font-bold">{currentUser?.household?.inviteCode}</span></div>
                </div>
              </div>
              <button
                onClick={copyInviteCode}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
