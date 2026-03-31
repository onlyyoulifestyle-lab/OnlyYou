"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { User, Mail, Shield, Package, Heart, LogOut, Camera, Loader2, Check } from 'lucide-react';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ orders: 0, wishlist: 0 });

  // Form States
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setFullName(user.user_metadata?.full_name || "");

      // Fetch Quick Stats
      const [orderRes, wishRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('wishlist').select('id', { count: 'exact' }).eq('user_id', user.id)
      ]);

      setStats({
        orders: orderRes.count || 0,
        wishlist: wishRes.count || 0
      });

    } catch (error) {
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateProfile = async () => {
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    if (error) toast.error(error.message);
    else toast.success("Profile updated successfully");
    setUpdating(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="mb-16">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-3">Settings</p>
        <h1 className="text-5xl font-[1000] uppercase tracking-tighter">Account Identity</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left: Quick Actions & Avatar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 rounded-[2.5rem] p-10 text-center border border-slate-100">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-white text-3xl font-[1000]">
                {user.email?.[0].toUpperCase()}
              </div>
              
            </div>
            <h2 className="text-xl font-[1000] uppercase tracking-tighter mb-1">{fullName || "Lifestyle Member"}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{user.email}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-100">
                <p className="text-2xl font-[1000]">{stats.orders}</p>
                <p className="text-[8px] font-black uppercase text-slate-400">Orders</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-100">
                <p className="text-2xl font-[1000]">{stats.wishlist}</p>
                <p className="text-[8px] font-black uppercase text-slate-400">Saved</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSignOut}
            className="w-full py-5 border-2 border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500 transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Right: Personal Details Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
              <User size={18} className="text-rose-500" /> Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-rose-100 transition-all"
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-400 flex items-center gap-3">
                  <Mail size={14} /> {user.email}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-slate-50 flex justify-end">
              <button 
                onClick={handleUpdateProfile}
                disabled={updating}
                className="px-10 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-zinc-800 transition-all flex items-center gap-2"
              >
                {updating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} 
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
              <Shield size={18} className="text-rose-500" /> Security & Privacy
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Your account is secured with end-to-end encryption. To change your password or update sensitive security settings, click the button below.
            </p>
            <button 
              onClick={() => toast.info("Password reset link sent to your email.")}
              className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:text-rose-500 hover:border-rose-500 transition-all"
            >
              Request Password Reset
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}