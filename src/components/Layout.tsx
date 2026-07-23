import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, List, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Layout() {
  const location = useLocation();

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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white/5 border-r border-white/10 backdrop-blur-md flex flex-col z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
            <span className="text-white font-bold text-sm">GP</span>
          </div>
          <span className="font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">GeminiPilot</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
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
      <main className="flex-1 relative z-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
