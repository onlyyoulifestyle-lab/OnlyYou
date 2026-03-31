"use client";
import React, { useState } from 'react';
import { supabase } from "../../../lib/supabase";
import { Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully! Redirecting...' });
      setTimeout(() => window.location.href = '/', 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-950 p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5">
        <div className="text-center mb-10">
          <Sparkles className="text-rose-500 mx-auto mb-4" size={32} />
          <h1 className="text-3xl font-black uppercase tracking-tighter">New Password</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Secure your OnlyYou Lifestyle account</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl text-[10px] font-black uppercase text-center border ${
            message.type === 'error' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-rose-50 border-rose-100 text-rose-500'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Enter New Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-300" size={18} />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-white/5 px-12 py-4 rounded-2xl text-sm font-bold focus:border-rose-500 outline-none transition-all"
              />
            </div>
          </div>

          <button disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <>Update Password <ArrowRight size={14} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}