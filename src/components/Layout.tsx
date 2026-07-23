import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, List, LogOut, Menu, X } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Jobs & Logs', path: '/jobs', icon: <List className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-gray-200 flex flex-col md:flex-row font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-xl z-[60]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <span className="text-white font-bold text-sm">GP</span>
          </div>
          <span className="font-bold tracking-tight text-white">GeminiPilot</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-64 bg-[#0A0A0E] border-r border-white/10 flex flex-col z-[50] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="hidden md:flex p-6 items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <span className="text-white font-bold text-sm">GP</span>
          </div>
          <span className="font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">GeminiPilot</span>
        </div>

        {/* Mobile Sidebar Header */}
        <div className="flex md:hidden p-6 items-center justify-between border-b border-white/5 pt-20">
          <span className="font-bold text-gray-400 tracking-wider text-xs uppercase">Navigation</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                location.pathname === item.path
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-gray-400 hover:bg-white/5 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 h-[calc(100vh-73px)] md:h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
