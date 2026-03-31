"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/supabase";
import {
  Mail, Search, Trash2, Loader2,
  ChevronRight, Inbox, Clock, User, MessageSquare
} from 'lucide-react';

export default function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setMessages(data);
    setLoading(false);
  }

  const deleteMessage = async (id: string) => {
    if (!window.confirm("Delete this message permanently?")) return;
    setDeletingId(id);
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (!error) {
      setMessages(messages.filter(m => m.id !== id));
      if (selectedMsg?.id === id) setSelectedMsg(null);
    }
    setDeletingId(null);
  };

  const filtered = messages.filter(m =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">

      {/* UPDATED HEADER: MATCHING SETTINGS STYLE */}
      <div className="mt-2 mb-2 flex flex-col md:flex-row justify-between items-center md:items-end bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Mail size={16} className="text-black" />
            <span className="text-xs font-bold uppercase tracking-widest">Inquiry Inbox</span>
          </div>
          <h1 className="text-4xl font-[1000] text-black tracking-tight uppercase leading-none">
            Messages
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
            Customer Support & Outreach
          </p>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by sender or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-5 pl-16 pr-8 text-[11px] font-black uppercase tracking-widest focus:bg-white focus:border-slate-100 transition-all outline-none shadow-inner"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* MESSAGE LIST */}
        <div className="lg:col-span-5 space-y-4">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-rose-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-slate-200 text-center text-[10px] font-black uppercase text-slate-400">
              No messages found
            </div>
          ) : (
            filtered.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMsg(msg)}
                className={`p-6 rounded-[2rem] cursor-pointer transition-all border-2 ${selectedMsg?.id === msg.id
                    ? 'bg-slate-900 border-slate-900 shadow-xl translate-x-2'
                    : 'bg-white border-transparent hover:border-slate-200'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${selectedMsg?.id === msg.id ? 'text-rose-400' : 'text-rose-500'}`}>
                    {msg.status}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 italic">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className={`text-sm font-[1000] uppercase tracking-tight mb-1 ${selectedMsg?.id === msg.id ? 'text-white' : 'text-slate-900'}`}>
                  {msg.full_name}
                </h3>
                <p className={`text-[11px] font-bold truncate ${selectedMsg?.id === msg.id ? 'text-slate-400' : 'text-slate-500'}`}>
                  {msg.subject}
                </p>
              </div>
            ))
          )}
        </div>

        {/* MESSAGE DETAIL VIEW */}
        <div className="lg:col-span-7">
          {selectedMsg ? (
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 sticky top-12 shadow-sm">
              <div className="flex justify-between items-start mb-10">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
                  <User size={28} />
                </div>
                <button
                  onClick={() => deleteMessage(selectedMsg.id)}
                  disabled={deletingId === selectedMsg.id}
                  className="p-4 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"
                >
                  {deletingId === selectedMsg.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-[1000] uppercase tracking-tighter text-slate-900 leading-tight">
                    {selectedMsg.subject}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                      <Mail size={12} /> {selectedMsg.email}
                    </span>
                    <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(selectedMsg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-slate-50 w-full" />

                <div className="bg-slate-50/50 p-8 rounded-[2rem]">
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {selectedMsg.message}
                  </p>
                </div>

                <a
                  href={`mailto:${selectedMsg.email}`}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg"
                >
                  Reply via Email <ChevronRight size={14} />
                </a>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-white rounded-[3rem] border border-slate-100 border-dashed flex flex-col items-center justify-center text-slate-300">
              <Inbox size={48} className="mb-4 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select a message to read</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}