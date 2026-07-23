import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './lib/firebase';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Settings from './pages/Settings';
import Chatbot from './components/Chatbot';

export default function App() {
  const [user, setUser] = useState<any>(undefined); // undefined means loading

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {user ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
      {user && <Chatbot />}
    </BrowserRouter>
  );
}


