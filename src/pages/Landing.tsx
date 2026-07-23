import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { Bot, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Initialize user doc if not exists
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: result.user.email,
            googleConnected: true,
            createdAt: new Date().toISOString(),
            preferences: {
              model: 'gemini-3.1-pro'
            }
          });
        }
      }
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-gray-200 flex flex-col items-center justify-center font-sans relative overflow-hidden p-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(139,92,246,0.5)]">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          GeminiPilot
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-10">
          Your autonomous AI agent for GitHub. Powered by Gemini, it reviews code, resolves issues, and manages pull requests directly from your repository.
        </p>

        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 py-3.5 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google to Continue
        </button>
      </motion.div>
    </div>
  );
}
