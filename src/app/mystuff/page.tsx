'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { 
  Laptop, 
  Sparkles, 
  Search, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Sliders, 
  FileText,
  Upload,
  Calendar,
  AlertTriangle,
  Clock,
  Download,
  Trash2
} from 'lucide-react';

export default function MyStuffPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'assistant' | 'compare' | 'owned' | 'vault' | 'warranties'>('assistant');
  const [ownedProducts, setOwnedProducts] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [docSearch, setDocSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // AI Buying Assistant Form
  const [category, setCategory] = useState('Laptop');
  const [budget, setBudget] = useState('1000');
  const [usage, setUsage] = useState('Programming');
  const [priority, setPriority] = useState('Performance');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [calculating, setCalculating] = useState(false);

  // Add Owned Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ownedName, setOwnedName] = useState('');
  const [ownedCategory, setOwnedCategory] = useState('ELECTRONICS');
  const [ownedPrice, setOwnedPrice] = useState('');
  const [ownedStore, setOwnedStore] = useState('');

  // Upload Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('RECEIPT');
  const [docVendor, setDocVendor] = useState('');
  const [docAmount, setDocAmount] = useState('');

  useEffect(() => {
    fetchData();
    runRecommendation('Laptop', 1000, 'Programming', 'Performance');
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setCurrentUser(userData.user);

      const stuffRes = await fetch('/api/mystuff');
      const stuffData = await stuffRes.json();
      if (stuffData.owned) setOwnedProducts(stuffData.owned);

      const docsRes = await fetch('/api/documents');
      const docsData = await docsRes.json();
      if (docsData.documents) setDocuments(docsData.documents);

      const warRes = await fetch('/api/warranties');
      const warData = await warRes.json();
      if (warData.warranties) setWarranties(warData.warranties);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocSearch = async (query: string) => {
    setDocSearch(query);
    try {
      const res = await fetch(`/api/documents?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.documents) setDocuments(data.documents);
    } catch (err) {
      console.error(err);
    }
  };

  const runRecommendation = async (cat: string, bud: number, usg: string, prio: string) => {
    setCalculating(true);
    try {
      const res = await fetch('/api/buying-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, budget: bud, usage: usg, priority: prio }),
      });
      const data = await res.json();
      if (data.recommendations) setRecommendations(data.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const handleAddOwnedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownedName.trim()) return;

    try {
      const res = await fetch('/api/mystuff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ownedName,
          category: ownedCategory,
          purchasePrice: ownedPrice,
          storeName: ownedStore,
        }),
      });

      const data = await res.json();
      if (res.ok && data.item) {
        setOwnedProducts([data.item, ...ownedProducts]);
        setIsModalOpen(false);
        setOwnedName('');
        setOwnedPrice('');
        setOwnedStore('');
        showToast('Product registered in My Stuff!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          docType,
          vendorName: docVendor,
          amount: docAmount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.document) {
        setDocuments([data.document, ...documents]);
        setIsDocModalOpen(false);
        setDocTitle('');
        setDocVendor('');
        setDocAmount('');
        showToast('Document saved to Document Vault!');
      }
    } catch (err) {
      console.error(err);
    }
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
        {/* Header Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Laptop className="w-3.5 h-3.5" /> AI Buying Assistant, Warranties & Document Vault
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Stuff & Document Wallet</h1>
            <p className="text-sm text-slate-400 mt-1">Digital wallet for owned products, warranties, receipts, invoices & AI document search</p>
          </div>

          {/* Section Tabs */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'assistant' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              "What Should I Buy?"
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'vault' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Document Vault ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('warranties')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'warranties' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Warranty Wallet
            </button>
            <button
              onClick={() => setActiveTab('owned')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'owned' ? 'gradient-bg text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registered Products ({ownedProducts.length})
            </button>
          </div>
        </div>

        {/* Tab 1: AI Buying Assistant */}
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Filter Controls Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" /> Enter Your Requirements
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Product Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Phone">Phone</option>
                      <option value="Headphones">Headphones</option>
                      <option value="TV">TV / Display</option>
                      <option value="Appliance">Household Appliance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Maximum Budget (€/$)</label>
                    <input
                      type="number"
                      step="50"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Usage</label>
                    <select
                      value={usage}
                      onChange={(e) => setUsage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Programming">Programming & Development</option>
                      <option value="Gaming">Gaming & Heavy 3D</option>
                      <option value="University">University & Study</option>
                      <option value="Everyday">Everyday & Media</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Top Feature Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Performance">Performance & Speed</option>
                      <option value="Battery">Battery Life</option>
                      <option value="Portability">Portability & Weight</option>
                      <option value="Value">Value for Money</option>
                    </select>
                  </div>

                  <button
                    onClick={() => runRecommendation(category, Number(budget), usage, priority)}
                    disabled={calculating}
                    className="w-full gradient-bg gradient-bg-hover text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {calculating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Calculate Ranked Match Scores
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Recommendations Stream */}
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" /> Ranked Recommendations ({recommendations.length})
              </h2>

              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div
                    key={rec.id}
                    className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                          <h3 className="text-lg font-bold text-white">{rec.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {rec.badge}
                          </span>
                          <span>Brand: {rec.brand}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-emerald-400">
                          {rec.matchScore}% <span className="text-xs font-semibold text-slate-400">Match</span>
                        </div>
                        <div className="text-sm font-bold text-slate-200">€{rec.price}</div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-400">Why this score? </span>
                        {rec.explanation}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-300 text-[11px] uppercase">Key Specs</div>
                        {Object.entries(rec.specs || {}).map(([key, val]) => (
                          <div key={key} className="text-slate-400 flex justify-between">
                            <span>{key}:</span>
                            <span className="text-slate-200 font-medium">{val as string}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold text-slate-300 text-[11px] uppercase">Pros & Highlights</div>
                        {(rec.pros || []).map((pro: string, pIdx: number) => (
                          <div key={pIdx} className="text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {pro}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Document Vault */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" /> Document Vault & AI Natural Search
                </h2>
                <p className="text-xs text-slate-400 mt-1">Receipts, invoices, warranties, manuals, rental & household documents</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={docSearch}
                    onChange={(e) => handleDocSearch(e.target.value)}
                    placeholder="AI Search (e.g. 'laptop receipt')..."
                    className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="gradient-bg text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload Document
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{doc.title}</div>
                      <div className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold mt-1 inline-block">
                        {doc.docType}
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm">${doc.amount.toFixed(2)}</span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                    <div>Vendor: {doc.vendorName || 'Retailer'}</div>
                    <div>Date: {new Date(doc.docDate).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Warranty Wallet */}
        {activeTab === 'warranties' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" /> Warranty Expiration Tracker
              </h2>
              <p className="text-xs text-slate-400">Automated 30-day warranty expiration alerts for household appliances and electronics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warranties.map((w) => (
                <div
                  key={w.id}
                  className={`glass-card p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${
                    w.status === 'EXPIRED'
                      ? 'border-rose-500/30 bg-rose-950/10'
                      : w.status === 'EXPIRING_SOON'
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-base">{w.name}</div>
                      <div className="text-xs text-slate-400">{w.category}</div>
                    </div>

                    {w.status === 'EXPIRED' ? (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Expired
                      </span>
                    ) : w.status === 'EXPIRING_SOON' ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" /> {w.daysRemaining} days left
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Active ({w.daysRemaining} days)
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                    Purchase Price: ${w.purchasePrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Registered Owned Products */}
        {activeTab === 'owned' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Registered Household Products & Wallet
                </h2>
                <p className="text-xs text-slate-400 mt-1">Keep track of electronics, appliances, purchase dates, and warranties</p>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="gradient-bg text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Register New Product
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedProducts.map((item) => (
                <div key={item.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-base">{item.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{item.category}</div>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm">${item.purchasePrice.toFixed(2)}</span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                    <div>Store: {item.storeName || 'Retailer'}</div>
                    <div>Registered: {new Date(item.purchaseDate).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Register Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Register Owned Product
            </h2>

            <form onSubmit={handleAddOwnedProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={ownedName}
                  onChange={(e) => setOwnedName(e.target.value)}
                  placeholder="e.g. MacBook Air M3, LG OLED TV"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={ownedCategory}
                    onChange={(e) => setOwnedCategory(e.target.value)}
                    placeholder="ELECTRONICS, APPLIANCE"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ownedPrice}
                    onChange={(e) => setOwnedPrice(e.target.value)}
                    placeholder="999.00"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store / Retailer</label>
                <input
                  type="text"
                  value={ownedStore}
                  onChange={(e) => setOwnedStore(e.target.value)}
                  placeholder="e.g. Apple Store, Amazon, Best Buy"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-bg text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Register Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" /> Upload Document
            </h2>

            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Laptop Receipt, Apartment Lease"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="RECEIPT">RECEIPT</option>
                    <option value="INVOICE">INVOICE</option>
                    <option value="WARRANTY">WARRANTY</option>
                    <option value="MANUAL">MANUAL</option>
                    <option value="BILL">BILL</option>
                    <option value="RENTAL">RENTAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={docAmount}
                    onChange={(e) => setDocAmount(e.target.value)}
                    placeholder="199.00"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor / Store Name</label>
                <input
                  type="text"
                  value={docVendor}
                  onChange={(e) => setDocVendor(e.target.value)}
                  placeholder="e.g. Apple Store, Best Buy"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-bg text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
