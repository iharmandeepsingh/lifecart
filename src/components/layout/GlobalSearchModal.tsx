'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ShoppingCart, Package, Receipt, DollarSign, History, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results) setResults(data.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectResult = (link: string) => {
    onClose();
    router.push(link);
  };

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'GROCERY': return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
      case 'INVENTORY': return <Package className="w-4 h-4 text-cyan-400" />;
      case 'RECEIPT': return <Receipt className="w-4 h-4 text-teal-400" />;
      case 'EXPENSE': return <DollarSign className="w-4 h-4 text-amber-400" />;
      case 'PURCHASE': return <History className="w-4 h-4 text-purple-400" />;
      default: return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search purchases, receipts, inventory, grocery items..."
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded">
            Esc
          </button>
        </div>

        {/* Results Stream */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No results found for "{query}". Try searching for product names, stores, or expenses.
            </div>
          ) : (
            results.map((result) => (
              <div
                key={result.id}
                onClick={() => handleSelectResult(result.link)}
                className="glass-card p-3 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getBadgeIcon(result.type)}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      {result.title}
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        {result.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{result.subtitle}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
