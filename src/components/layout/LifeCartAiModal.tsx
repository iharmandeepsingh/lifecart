'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BrainCircuit, 
  X, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ShoppingCart, 
  Receipt, 
  ShieldCheck, 
  Zap, 
  ArrowRight
} from 'lucide-react';

interface LifeCartAiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LifeCartAiModal({ isOpen, onClose }: LifeCartAiModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState('');

  if (!isOpen) return null;

  const handleAsk = async (queryText?: string) => {
    const textToAsk = queryText || query;
    if (!textToAsk.trim()) return;

    setLoading(true);
    setAiResult(null);
    setActionSuccess('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToAsk }),
      });

      const data = await res.json();
      if (data.result) {
        setAiResult(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (action: any) => {
    if (action.actionType === 'ADD_TO_LIST' && action.payload) {
      try {
        for (const item of action.payload) {
          await fetch('/api/grocery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name || item.productName,
              category: item.category || 'GROCERY',
              quantity: item.minThreshold || 1,
              unit: item.unit || 'pcs',
              notes: 'Added via LifeCart AI Assistant',
            }),
          });
        }
        setActionSuccess('Item(s) added to Grocery List!');
      } catch (err) {
        console.error(err);
      }
    } else if (action.actionType === 'VIEW_DOCUMENTS') {
      onClose();
      router.push('/mystuff');
    } else if (action.actionType === 'VIEW_OPTIMIZER') {
      onClose();
      router.push('/shopping');
    } else if (action.actionType === 'VIEW_WARRANTY') {
      onClose();
      router.push('/mystuff');
    }
  };

  const sampleQueries = [
    'What products are running low in pantry?',
    'What should I buy this week?',
    'Find my laptop receipt',
    'When does my warranty expire?',
    'Find the cheapest shopping plan',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-emerald-500/30 shadow-2xl space-y-6 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                LifeCart AI Assistant <Sparkles className="w-4 h-4 text-emerald-400" />
              </h2>
              <p className="text-xs text-slate-400">Grounded intent engine for shopping, receipts, warranties & expenses</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input & Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="relative"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask LifeCart AI (e.g. 'What is running low?' or 'Find my laptop receipt')..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 gradient-bg text-white p-2 rounded-lg disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Sample Prompt Chips */}
        {!aiResult && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-semibold uppercase">Or Try Example Prompts</div>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(prompt);
                    handleAsk(prompt);
                  }}
                  className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs px-3 py-1.5 rounded-xl transition-all text-left"
                >
                  ✨ {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Response Feed */}
        {aiResult && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold uppercase tracking-wider">
                  Intent: {aiResult.intent}
                </span>
                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">
                  Grounded LifeCart Data
                </span>
              </div>

              <div className="text-sm text-slate-100 leading-relaxed font-medium">
                {aiResult.answer}
              </div>

              {/* Action Button */}
              {aiResult.suggestedAction && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Suggested Action:</span>
                  <button
                    onClick={() => handleExecuteAction(aiResult.suggestedAction)}
                    className="gradient-bg text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 hover:scale-105 transition-all"
                  >
                    {aiResult.suggestedAction.label} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {actionSuccess && (
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {actionSuccess}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
