"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/supabase";
import { deleteAuthUser } from "./actions"; 
import { 
  Trash2, Search, Loader2, UserMinus, Users ,
  Mail, Calendar, Hash, User 
} from 'lucide-react';

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    // Fetch profiles - 'email' will now come from our updated SQL trigger
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (data) setProfiles(data);
    setLoading(false);
  }

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Permanently revoke access for this user?")) return;
    
    setProcessingId(userId);
    const result = await deleteAuthUser(userId);
    
    if (result.success) {
      setProfiles(profiles.filter(p => p.id !== userId));
    } else {
      alert("Error: " + result.error);
    }
    setProcessingId(null);
  };

  const filteredUsers = profiles.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      
     {/* UPDATED HEADER: MATCHING SETTINGS STYLE */}
<div className="mb-8 flex flex-col md:flex-row justify-between items-center md:items-end bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
  <div>
    <div className="flex items-center gap-2 text-slate-400 mb-2">
      <Users size={16} className="text-rose-500" />
      <span className="text-xs font-bold uppercase tracking-widest">User Management</span>
    </div>
    <h1 className="text-4xl font-[1000] text-black tracking-tight uppercase leading-none">
      Registry
    </h1>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
      Auth & Profile Management
    </p>
  </div>

  <div className="relative w-full md:w-96 group">
    <Search 
      className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" 
      size={18} 
    />
    <input 
      type="text"
      placeholder="Search name, email or ID..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-5 pl-16 pr-8 text-[11px] font-black uppercase tracking-widest focus:bg-white focus:border-slate-100 transition-all outline-none shadow-inner"
    />
  </div>
</div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400">User Identity</th>
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400">Unique ID</th>
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400">Joined Date</th>
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-rose-500" size={30} />
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/30 transition-all group">
              <td className="p-8">
  <div className="flex flex-col">
    <span className="font-[1000] text-sm text-slate-900 uppercase">
      {user.full_name || "New Member"}
    </span>
    <span className="mt-1">
      {user.email ? (
        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 lowercase">
          <Mail size={12} className="text-rose-500" /> {user.email}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest">
          <Loader2 size={10} className="animate-spin" /> Syncing Email...
        </span>
      )}
    </span>
  </div>
</td>
                  <td className="p-8">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 font-mono tracking-tighter">
                      <Hash size={10} className="text-slate-200" /> {user.id}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase tracking-widest">
                       <Calendar size={14} className="text-slate-300" />
                       {user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'MAR 2026'}
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => handleDelete(user.id)}
                      disabled={processingId === user.id}
                      className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all active:scale-90 disabled:opacity-50 border border-transparent hover:border-rose-200"
                    >
                      {processingId === user.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 mt-6">
           <UserMinus className="mx-auto text-slate-200 mb-3" size={40} />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Zero active users in registry</p>
        </div>
      )}
    </div>
  );
}