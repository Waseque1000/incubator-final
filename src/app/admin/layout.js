"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, FileText, LogOut, Box, RefreshCw, Users, Menu, X, Shield } from 'lucide-react';
import api from '@/lib/api/axios';

export default function AdminLayout({ children }) {
  const [profile, setProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      fetchProfile();
    }
  }, [router]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/admin/me');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch profile');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Forms', path: '/admin/forms', icon: FileText },
    { name: 'Member List', path: '/admin/enrollment', icon: Users },
    { name: 'Admins', path: '/admin/admins', icon: Shield },
  ];

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f8fd] via-white to-[#f1f5f9] text-slate-800 font-sans flex flex-col selection:bg-indigo-100">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-2xl border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo area */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Box className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-900 tracking-tight">
                Incubator.
              </h1>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-sm font-black text-slate-800 leading-none mb-1.5">{profile?.name || 'Admin'}</span>
                <span className="text-xs font-semibold text-slate-400 leading-none">{profile?.email || 'Administrator'}</span>
              </div>
              
              <button onClick={() => window.location.reload()} className="hidden sm:flex p-2.5 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-100">
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className="hidden md:flex items-center px-4 py-2.5 text-sm font-bold text-rose-500 bg-white border border-rose-100 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-3 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all shadow-sm border border-slate-100"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div className={`md:hidden bg-white/90 backdrop-blur-3xl border-b border-slate-100 transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100 shadow-xl' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-5 py-4 rounded-2xl text-base font-bold transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-5 py-4 text-base font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full relative z-10">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-100/30 to-transparent -z-10 pointer-events-none rounded-b-[4rem]"></div>
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-white/40 backdrop-blur-lg border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              © {new Date().getFullYear()} Incubator System. All rights reserved.
            </p>
            <p className="text-sm font-semibold text-slate-500">
              Crafted with <span className="text-rose-500">♥</span> by <span className="text-indigo-600 font-black tracking-tight">Wasee</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
