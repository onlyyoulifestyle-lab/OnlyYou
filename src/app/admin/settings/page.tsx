"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { 
  Save, Globe, Camera, Phone, Mail, MapPin, Info, Loader2, Sparkles 
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    id: null, // Track the ID of the single row
    tagline: "",
    description: "",
    instagram_url: "",
    facebook_url: "",
    whatsapp_number: "",
    email_address: "",
    office_address: ""
  });

  // --- Fetch the single row on load ---
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle(); // maybeSingle won't throw an error if table is empty

      if (data) {
        setFormData(data);
      }
      setFetching(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { id, updated_at, ...payload } = formData as any;

      let result;

      if (id) {
        // 1. If row exists, UPDATE it
        result = await supabase
          .from('site_settings')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
      } else {
        // 2. If no row exists, INSERT the first one
        result = await supabase
          .from('site_settings')
          .insert([payload])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Update state with the returned data (keeps ID in sync)
      if (result.data) {
        setFormData(result.data);
      }

      alert("ONLYYOULIFESTYLE Settings Synchronized!");
    } catch (err: any) {
      console.error(err);
      alert("Sync Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-12 text-center font-black uppercase text-slate-400">Connecting to Server...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* HEADER */}
      <div className="mt-4 mb-8 flex justify-between items-end bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Globe size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Global Configuration</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase leading-none">Settings</h1>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} 
          {formData.id ? "Update Settings" : "Initialize Settings"}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* BRAND IDENTITY */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h2 className="text-sm font-black uppercase flex items-center gap-2 mb-4"><Sparkles size={16} className="text-amber-400"/> Brand Identity</h2>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Website Tagline</label>
            <input 
              value={formData.tagline}
              onChange={e => setFormData({...formData, tagline: e.target.value})}
              className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-black transition-all" 
              placeholder="e.g. Elevating your everyday lifestyle" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">About the Website</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={6}
              className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-black transition-all" 
              placeholder="Detailed description of ONLYYOULIFESTYLE..." 
            />
          </div>
        </div>

        {/* SOCIAL & CONTACTS */}
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-sm font-black uppercase flex items-center gap-2 mb-2"><Camera size={16}/> Social Media</h2>
                <div className="space-y-4">
                    <div className="relative">
                        <Camera size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            value={formData.instagram_url}
                            onChange={e => setFormData({...formData, instagram_url: e.target.value})}
                            className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-xl font-bold text-xs outline-none border-2 border-transparent focus:border-black transition-all"
                            placeholder="Instagram Profile URL"
                        />
                    </div>
                    <div className="relative">
                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            value={formData.facebook_url}
                            onChange={e => setFormData({...formData, facebook_url: e.target.value})}
                            className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-xl font-bold text-xs outline-none border-2 border-transparent focus:border-black transition-all"
                            placeholder="Facebook Page URL"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-sm font-black uppercase flex items-center gap-2 mb-2"><Phone size={16}/> Communication</h2>
                <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            value={formData.whatsapp_number}
                            onChange={e => setFormData({...formData, whatsapp_number: e.target.value})}
                            className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-xl font-bold text-xs outline-none"
                            placeholder="WhatsApp Number"
                        />
                    </div>
                    <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            value={formData.email_address}
                            onChange={e => setFormData({...formData, email_address: e.target.value})}
                            className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-xl font-bold text-xs outline-none"
                            placeholder="Official Email Address"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* ADDRESS (Full Width) */}
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h2 className="text-sm font-black uppercase flex items-center gap-2 mb-6"><MapPin size={16}/> Physical Location</h2>
            <div className="relative">
                <MapPin size={16} className="absolute left-4 top-6 text-slate-400" />
                <textarea 
                    value={formData.office_address}
                    onChange={e => setFormData({...formData, office_address: e.target.value})}
                    rows={3}
                    className="w-full pl-12 pr-5 py-5 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-black transition-all"
                    placeholder="Full Business Address..."
                />
            </div>
        </div>
      </form>
    </div>
  );
}