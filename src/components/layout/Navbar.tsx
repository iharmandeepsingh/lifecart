'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingBag, 
  Home, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Sparkles,
  Search,
  Menu, 
  X,
  Laptop,
  BrainCircuit,
  Database
} from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import GlobalSearchModal from './GlobalSearchModal';
import LifeCartAiModal from './LifeCartAiModal';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    householdId?: string | null;
    household?: { name: string; inviteCode: string } | null;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const displayUser = user || { name: 'Alex Morgan', email: 'alex@lifecart.com' };

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Demo data loaded successfully!');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
    { href: '/money', label: 'Money', icon: DollarSign },
    { href: '/household', label: 'Household', icon: Package },
    { href: '/mystuff', label: 'My Stuff', icon: Laptop },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xl tracking-tight text-white">Life</span>
                    <span className="font-bold text-xl tracking-tight gradient-text">Cart</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> AI Engine
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* 5 Core Navigation Sections */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                      isActive
                        ? 'gradient-bg text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Controls */}
            <div className="hidden md:flex items-center gap-2.5">
              <button
                onClick={() => setAiModalOpen(true)}
                className="flex items-center gap-1.5 gradient-bg text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 hover:scale-105 transition-transform"
              >
                <BrainCircuit className="w-4 h-4" /> AI Assistant
              </button>

              <button
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-400 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>Search...</span>
                <kbd className="bg-slate-800 text-[9px] font-mono px-1.5 py-0.5 rounded text-slate-400">⌘K</kbd>
              </button>

              <button
                onClick={handleLoadDemo}
                disabled={loadingDemo}
                title="Load Demo Data"
                className="bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" /> Demo
              </button>

              <NotificationDropdown />

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shadow" title={displayUser.email}>
                  {displayUser.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Mobile Button */}
            <div className="flex md:hidden items-center gap-2">
              <button onClick={() => setAiModalOpen(true)} className="p-2 text-emerald-400">
                <BrainCircuit className="w-5 h-5" />
              </button>
              <button onClick={() => setSearchModalOpen(true)} className="p-2 text-slate-300">
                <Search className="w-5 h-5 text-emerald-400" />
              </button>
              <NotificationDropdown />
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive ? 'gradient-bg text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 text-emerald-400" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      <GlobalSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      <LifeCartAiModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </>
  );
}
