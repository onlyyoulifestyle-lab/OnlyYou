"use client";
import React, { useState } from 'react';
import { supabase } from "../../lib/supabase";
import { 
  X, Mail, Lock, ArrowRight, Loader2, 
  BadgeCheck, Sparkles, LogIn 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // Added 'forgot' to the view state
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!isOpen) return null;

 const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage({ type: '', text: '' });

  if (view === 'login') {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Welcome back! Entering Boutique...' });
      setTimeout(() => { onClose(); window.location.reload(); }, 1500);
    }
  } else if (view === 'register') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        // This 'data' object is what the SQL trigger reads as 'raw_user_meta_data'
        data: { 
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}` // Optional: generates a default avatar
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      // If Email Confirmation is ON, the profile is created only AFTER they click the link
      // If Email Confirmation is OFF, the profile is created immediately
      setMessage({ type: 'success', text: 'Success! Please check your email to confirm.' });
    }
  }
  setLoading(false);
};

  // New function for Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Reset link sent! Check your inbox.' });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={onClose} />

      <div className="relative bg-white dark:bg-zinc-950 w-full max-w-[950px] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in duration-500">
        
        {/* LEFT: BRANDING SIDE */}
        <div className="hidden md:flex md:w-[45%] bg-black relative p-12 flex-col justify-between text-white overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" className="object-cover w-full h-full" alt="Fashion" />
          </div>
          <div className="relative z-10">
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-[0.85] ">
              The <br /><span className="text-rose-500">Boutique</span> <br />Experience.
            </h2>
          </div>
        </div>

        {/* RIGHT: AUTH SIDE */}
        <div className="flex-1 p-8 md:p-14 bg-white dark:bg-zinc-950 relative flex flex-col justify-center">
          <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-rose-500 transition-all">
            <X size={24} />
          </button>

          <div className="mb-10">
            <h3 className="text-3xl font-black uppercase tracking-tighter  text-slate-900 dark:text-white">
              {view === 'login' ? "Sign In" : view === 'register' ? "Register" : "Reset Password"}
            </h3>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border ${
              message.type === 'error' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-rose-50 border-rose-100 text-rose-500'
            }`}>
              {message.text}
            </div>
          )}

          <form className="space-y-4" onSubmit={view === 'forgot' ? handleForgotPassword : handleAuth}>
            {view === 'register' && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                <input 
                  type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-white/5 px-6 py-4 rounded-2xl text-[11px] font-bold outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Email</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-white/5 px-6 py-4 rounded-2xl text-[11px] font-bold outline-none focus:border-rose-500"
              />
            </div>

            {view !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Password</label>
                  {view === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setView('forgot')} 
                      className="text-[9px] font-black uppercase text-rose-500 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-white/5 px-6 py-4 rounded-2xl text-[11px] font-bold outline-none focus:border-rose-500"
                />
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (
                <>{view === 'login' ? "Enter Boutique" : view === 'register' ? "Create Profile" : "Send Reset Link"} <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <button 
              onClick={() => {
                setView(view === 'login' ? 'register' : 'login');
                setMessage({ type: '', text: '' });
              }}
              className="text-black dark:text-white font-black border-b-2 border-rose-500 pb-0.5 ml-1"
            >
              {view === 'login' ? "Register Now" : "Back to Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}