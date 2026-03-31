"use client";
import React, { useState } from 'react';
import { Mail, MapPin, Send, Sparkles, Globe, ShieldCheck, Loader2, Star } from 'lucide-react';
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";

export default function AboutPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          full_name: formData.get('full_name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message'),
        }]);

      if (error) throw error;

      toast.success("Message sent! The Only You team will contact you soon.");
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error("Failed to send message. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
    {/* BRAND HERO SECTION - Compact & Clear */}
      <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden bg-slate-50">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=2000" 
            className="w-full h-full object-cover" // Removed opacity and grayscale
            alt="Only You Lifestyle"
          />
          {/* Subtle overlay just to make sure white text is readable if needed */}
          <div className="absolute inset-0 bg-black/10"></div> 
        </div>
        
        <div className="relative z-10 text-center px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white drop-shadow-md mb-3">
            Established 2024
          </p>
          <h1 className="text-5xl md:text-7xl font-[1000] text-white uppercase tracking-tighter leading-[0.9] drop-shadow-xl">
            ONLY YOU <br /> 
            <span className="text-rose-400 font-light">LIFESTYLE</span>
          </h1>
          <p className="mt-4 text-[10px] md:text-xs font-bold text-white tracking-[0.2em] uppercase drop-shadow-md">
            Authentic K-Beauty • Curated for Indian Skin
          </p>
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section className="max-w-7xl mx-auto px-6 py-32 border-t border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl transform -rotate-2">
              <img 
                src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1000" 
                alt="Product detail"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-black text-white p-10 rounded-[3rem] shadow-2xl hidden md:block">
               <Star className="text-rose-400 mb-4 fill-rose-400" size={32} />
               <p className="text-3xl font-[1000]">SEOUL</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Directly Sourced</p>
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-[1000] uppercase tracking-tighter mb-8 leading-none">
              The Ritual of <br /><span className="text-rose-500">Self-Preservation.</span>
            </h2>
            <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
              <p className="text-xl font-serif text-slate-400">
                "Skincare is not a routine at Only You Lifestyle; it is an intimate conversation between you and your reflection."
              </p>
              <p>
                We founded <span className="font-black text-black">Only You Lifestyle</span> to bridge the gap between South Korea’s skincare innovation and the unique environmental challenges faced by the modern Indian individual. 
              </p>
              <p>
                Every product in our collection is hand-selected from Seoul’s most prestigious laboratories, ensuring that the legendary "Glass Skin" glow is accessible, authentic, and optimized for your lifestyle.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-12">
              <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl">
                <ShieldCheck className="text-rose-500 shrink-0" size={24} />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Authenticity</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Certified Imports</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl">
                <Globe className="text-slate-900 shrink-0" size={24} />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Impact</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Pan-India Reach</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & SUPPORT SECTION */}
      <section className="bg-slate-50 py-24 rounded-[4rem] mx-4 mb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            
            {/* Brand Contact Info */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-3">Concierge</p>
              <h2 className="text-5xl font-[1000] uppercase tracking-tighter mb-12">Connect with <br/>Only You <span className="text-slate-300 font-light">Lifestyle</span></h2>
              
              <div className="space-y-10">
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-black group-hover:text-white transition-all">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Inquiries</p>
                    <p className="text-sm font-bold">hello@onlyyoulifestyle.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-black group-hover:text-white transition-all">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Presence</p>
                    <p className="text-sm font-bold">Mumbai • Seoul • Delhi</p>
                  </div>
                </div>
              </div>

              <div className="mt-20 p-10 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white">
                <Sparkles className="text-rose-400 mb-4" />
                <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
                  Our beauty experts are available Monday to Friday to help you build your perfect K-Beauty ritual.
                </p>
              </div>
            </div>

            {/* Support Form */}
            <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl border border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-400">Your Name</label>
                    <input name="full_name" required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-rose-100 transition-all" placeholder="Enter name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-400">Email Address</label>
                    <input name="email" required type="email" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-rose-100 transition-all" placeholder="email@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-400">Subject</label>
                  <select name="subject" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-rose-100 appearance-none">
                    <option>Product Inquiry</option>
                    <option>Bulk/Business Inquiry</option>
                    <option>Order Assistance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-slate-400">Message</label>
                  <textarea name="message" required rows={4} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-rose-100 transition-all" placeholder="How can we assist your glow journey?"></textarea>
                </div>
                
                <button 
                  disabled={loading}
                  className="w-full py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>Submit Inquiry <Send size={16} /></>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}