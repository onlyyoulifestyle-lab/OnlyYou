"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { ChevronRight, ArrowRight, Loader2, Sparkles, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<any>(null);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  async function fetchHierarchy() {
    const { data } = await supabase
      .from('categories')
      .select(`
        id, name, image_url, description,
        sub_categories (
          id, name, image_url,
          inner_categories (id, name)
        )
      `);
    
    if (data) {
      setCategories(data);
      setActiveCat(data[0]);
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-slate-200" size={30} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      
      {/* LEFT SIDE: THE MINI SIDEBAR (Premium Small Size) */}
      <div className="w-[320px] h-screen sticky top-0 bg-white border-r border-slate-100 p-4 flex flex-col gap-6">
        <header className="px-2 pt-4">
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <LayoutGrid size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Menu</span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter">Collections</h1>
        </header>

        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              onMouseEnter={() => setActiveCat(cat)}
              className={`group relative flex items-center gap-3 p-2 rounded-xl transition-all duration-300 cursor-pointer
                ${activeCat?.id === cat.id 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                  : 'hover:bg-slate-50 text-slate-600'}`}
            >
              {/* Small Image */}
              <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100">
                <img 
                  src={cat.image_url || 'https://via.placeholder.com/100'} 
                  className="w-full h-full object-cover" 
                  alt="" 
                />
              </div>

              {/* Small Text & Description */}
              <div className="flex flex-col min-w-0">
                <h4 className="text-[13px] font-bold uppercase tracking-tight truncate">
                  {cat.name}
                </h4>
                <p className={`text-[10px] truncate leading-tight ${activeCat?.id === cat.id ? 'text-slate-400' : 'text-slate-400'}`}>
                  {cat.description || "View Collection"}
                </p>
              </div>

              {activeCat?.id === cat.id && (
                <div className="ml-auto pr-2">
                  <ChevronRight size={14} className="text-rose-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: THE CONTENT AREA */}
      <div className="flex-1 px-12 py-12">
        {activeCat && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Banner Area */}
            <div className="relative h-[250px] w-full rounded-3xl overflow-hidden mb-12 shadow-2xl">
              <img src={activeCat.image_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-12">
                <span className="text-rose-400 text-[10px] font-black uppercase tracking-[0.5em] mb-2 flex items-center gap-2">
                   <Sparkles size={12} /> Premium Selection
                </span>
                <h2 className="text-5xl font-[1000] text-white uppercase tracking-tighter">{activeCat.name}</h2>
              </div>
            </div>

            {/* Sub-categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {activeCat.sub_categories?.map((sub: any) => (
                <div key={sub.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800">{sub.name}</h3>
                    <Link href={`/site/products?sub=${sub.id}`} className="p-2 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all">
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {sub.inner_categories?.map((inner: any) => (
                      <Link 
                        key={inner.id}
                        href={`/site/products?inner=${inner.id}`}
                        className="text-[10px] font-bold uppercase tracking-tight px-4 py-2 bg-slate-50 text-slate-500 rounded-full hover:bg-rose-500 hover:text-white transition-all"
                      >
                        {inner.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}