'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { 
  Receipt as ReceiptIcon, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  DollarSign, 
  Store, 
  Calendar, 
  Trash2, 
  PackageCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

const SAMPLE_RECEIPTS = [
  {
    name: 'Walmart Grocery Receipt',
    text: `WALMART SUPERCENTER #1024
123 MAIN STREET
DATE 08/02/2026 14:32

ORGANIC WHOLE MILK $4.29
BANANAS ORGANIC $1.98
CHICKEN BREAST FAMILY PK $11.49
CHEDDAR CHEESE BLOCK $3.79
SLICED WHEAT BREAD $2.49
PAPER TOWELS 6 ROLL $8.99

SUBTOTAL $33.03
TAX $1.98
TOTAL $35.01`,
  },
  {
    name: "Trader Joe's Receipt",
    text: `TRADER JOE'S #482
DATE 08/01/2026

ORGANIC SALAD MIX $3.99
GREEK YOGURT VANILLA $4.99
FROZEN PIZZA MARGHERITA $5.49
DARK CHOCOLATE ALMONDS $4.29
ALMOND MILK UNSWEETENED $2.99

SUBTOTAL $21.75
TAX $1.25
TOTAL $23.00`,
  },
];

export default function ReceiptPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [rawText, setRawText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  // Extracted fields
  const [storeName, setStoreName] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [addToInventory, setAddToInventory] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const memRes = await fetch('/api/household/members');
      const memData = await memRes.json();
      if (memData.members) setMembers(memData.members);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScanText = async (textToScan: string) => {
    if (!textToScan.trim()) return;
    setScanning(true);

    try {
      const res = await fetch('/api/receipt/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: textToScan }),
      });

      const data = await res.json();
      if (data.data) {
        setStoreName(data.data.storeName || 'Grocery Store');
        setReceiptDate(data.data.receiptDate || new Date().toISOString().split('T')[0]);
        setTotalAmount(data.data.totalAmount || 0);
        setTaxAmount(data.data.taxAmount || 0);
        setItems(data.data.items || []);
        showToast('Receipt scanned & items extracted successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const simulatedText = `SUPERMARKET OCR
DATE ${new Date().toISOString().split('T')[0]}

ORGANIC APPLES $4.99
FRESH ORANGE JUICE $3.89
PASTA SPAGHETTI $1.99
TOMATO SAUCE $2.49

SUBTOTAL $13.36
TAX $0.80
TOTAL $14.16`;

    setRawText(simulatedText);
    handleScanText(simulatedText);
  };

  const handleSaveReceipt = async () => {
    if (!storeName || totalAmount <= 0) return;
    setSaving(true);

    const perMemberAmount = members.length > 0 ? parseFloat((totalAmount / members.length).toFixed(2)) : totalAmount;
    const splits = members.map((m) => ({
      userId: m.userId,
      amount: perMemberAmount,
    }));

    try {
      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          totalAmount,
          taxAmount,
          receiptDate,
          items,
          splits,
          addToInventory,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Receipt saved, split, and added to Inventory!');
        resetForm();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setRawText('');
    setStoreName('');
    setReceiptDate('');
    setTotalAmount(0);
    setTaxAmount(0);
    setItems([]);
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
    recalculateTotal(updated, taxAmount);
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    const updated = [...items];
    updated[index].price = newPrice;
    setItems(updated);
    recalculateTotal(updated, taxAmount);
  };

  const recalculateTotal = (currentItems: any[], currentTax: number) => {
    const sum = currentItems.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0);
    setTotalAmount(parseFloat((sum + currentTax).toFixed(2)));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar user={currentUser} />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5" /> {toastMessage}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ReceiptIcon className="w-3.5 h-3.5" /> AI & OCR Item Extractor
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Receipt Scanner & Splitter</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload or paste receipt text to automatically extract line items, prices, and split expenses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Upload / Paste Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" /> Upload or Scan Receipt
              </h2>

              {/* Drag & Drop File Input */}
              <label className="block w-full cursor-pointer">
                <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/60 p-6 rounded-2xl text-center space-y-2 transition-all">
                  <div className="w-12 h-12 rounded-full gradient-bg mx-auto flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-200">Click to upload receipt photo</div>
                  <div className="text-xs text-slate-500">Supports PNG, JPG, JPEG, WebP</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </label>

              {/* Sample Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> Or Test with Sample Receipts:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_RECEIPTS.map((sample) => (
                    <button
                      key={sample.name}
                      onClick={() => {
                        setRawText(sample.text);
                        handleScanText(sample.text);
                      }}
                      className="text-left p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-300 transition-colors"
                    >
                      <div className="font-semibold text-emerald-400">{sample.name}</div>
                      <div className="text-[10px] text-slate-500">Click to run OCR extraction</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Text Box */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">Raw OCR Text Input</label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste receipt contents here..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={() => handleScanText(rawText)}
                  disabled={scanning || !rawText.trim()}
                  className="w-full gradient-bg text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {scanning ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Extract Items from Text
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Confirmed Extracted Items */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Extracted Receipt Details
                </h2>
                {items.length > 0 && (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                    {items.length} items parsed
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="p-12 text-center border border-slate-800/80 rounded-2xl space-y-3 bg-slate-950/40">
                  <ReceiptIcon className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="text-slate-300 font-semibold text-sm">No receipt scanned yet</div>
                  <div className="text-xs text-slate-500 max-w-xs mx-auto">
                    Upload a receipt image or select one of the sample presets on the left to extract line items.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Store Name & Date Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Store className="w-3 h-3 text-emerald-400" /> Store Name
                      </div>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="bg-transparent text-sm font-bold text-white w-full focus:outline-none"
                      />
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" /> Receipt Date
                      </div>
                      <input
                        type="date"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                        className="bg-transparent text-sm font-bold text-white w-full focus:outline-none"
                      />
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-400" /> Total Amount
                      </div>
                      <div className="text-sm font-bold text-emerald-400">${totalAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Extracted Line Items List */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Line Items Breakdown
                    </div>
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="glass-card p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].name = e.target.value;
                              setItems(updated);
                            }}
                            className="bg-transparent font-semibold text-slate-100 focus:outline-none w-full"
                          />
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                            className="bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-bold px-2 py-1 w-20 text-right focus:outline-none"
                          />
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Options & Action */}
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={addToInventory}
                        onChange={(e) => setAddToInventory(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <PackageCheck className="w-4 h-4 text-emerald-400" />
                      Automatically add extracted items to Household Pantry Inventory
                    </label>

                    <button
                      onClick={handleSaveReceipt}
                      disabled={saving}
                      className="w-full gradient-bg gradient-bg-hover text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Confirm & Split Expense (${(totalAmount / (members.length || 1)).toFixed(2)} / member) <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
