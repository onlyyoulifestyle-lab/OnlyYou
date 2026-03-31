"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from "../../../lib/supabase";
import ProductCard from "../../components/ProductCard";
import { Filter, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Filter States
  const [sortBy, setSortBy] = useState("latest");
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || "all");
  const [selectedSub, setSelectedSub] = useState<string | null>(searchParams.get('sub'));
  const [selectedInner, setSelectedInner] = useState<string | null>(searchParams.get('inner'));

  // Accordion States
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    fetchHierarchy();
  }, []);

  // Sync state with URL changes
  useEffect(() => {
    const cat = searchParams.get('category');
    const sub = searchParams.get('sub');
    const inner = searchParams.get('inner');

    if (cat) setSelectedCat(cat);
    if (sub) setSelectedSub(sub);
    if (inner) setSelectedInner(inner);

    fetchProducts();
  }, [searchParams, sortBy, selectedCat, selectedSub, selectedInner]);

  async function fetchHierarchy() {
    const { data } = await supabase
      .from('categories')
      .select(`
        id, name,
        sub_categories (
          id, name,
          inner_categories (id, name)
        )
      `);

    if (data) {
      setCategories(data);
      
      // Auto-expand logic based on URL params
      const catParam = searchParams.get('category');
      const subParam = searchParams.get('sub');
      const innerParam = searchParams.get('inner');

      data.forEach((cat: any) => {
        // If deep linked to inner/sub, find and expand parents
        cat.sub_categories?.forEach((sub: any) => {
          const hasInner = sub.inner_categories?.some((inner: any) => inner.id === innerParam);
          if (hasInner || sub.id === subParam) {
            setExpandedCat(cat.id);
            setExpandedSub(sub.id);
          }
        });
        if (cat.id === catParam) setExpandedCat(cat.id);
      });
    }
  }

  async function fetchProducts() {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, categories(name), product_variants(*)')
      .eq('active', true);

    if (sortBy === "price-low") query = query.order('price', { ascending: true });
    else if (sortBy === "price-high") query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    if (selectedInner) query = query.eq('inner_category_id', selectedInner);
    else if (selectedSub) query = query.eq('sub_category_id', selectedSub);
    else if (selectedCat !== "all") query = query.eq('category_id', selectedCat);

    const { data } = await query;
    if (data) setProducts(data);
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-5xl font-[1000] uppercase tracking-tighter text-slate-900">The Boutique</h1>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mt-2">Only You Lifestyle Essentials</p>
        </div>
        <div className="relative">
          <select 
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-slate-50 px-10 py-4 pr-14 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none ring-1 ring-slate-100 focus:ring-2 ring-black/5"
          >
            <option value="latest">Latest Arrivals</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* SIDEBAR */}
        <aside className="w-full lg:w-72 space-y-8">
          <h3 className="text-[11px] font-[1000] uppercase tracking-[0.3em] mb-8 flex items-center gap-2 border-b border-slate-50 pb-4 text-slate-900">
            <Filter size={14} className="text-rose-500"/> Filter By
          </h3>
          
          <div className="space-y-2">
            <button 
              onClick={() => { setSelectedCat("all"); setSelectedSub(null); setSelectedInner(null); setExpandedCat(null); }}
              className={`w-full text-left text-[10px] font-black uppercase tracking-widest py-3 px-5 rounded-2xl transition-all ${selectedCat === 'all' ? 'bg-black text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              All Collections
            </button>

            {categories.map(cat => {
              const isCatActive = selectedCat === cat.id;
              return (
                <div key={cat.id} className="group">
                  <button 
                    onClick={() => {
                      setExpandedCat(expandedCat === cat.id ? null : cat.id);
                      setSelectedCat(cat.id);
                      setSelectedSub(null);
                      setSelectedInner(null);
                    }}
                    className={`w-full flex items-center justify-between text-left text-[10px] font-[1000] uppercase tracking-widest py-3 px-5 rounded-2xl transition-all duration-300
                      ${isCatActive ? 'bg-slate-900 text-white shadow-lg translate-x-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <span className="flex items-center gap-2">
                      {cat.name}
                      {isCatActive && <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${expandedCat === cat.id ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedCat === cat.id && (
                    <div className="ml-6 pl-4 border-l border-slate-100 space-y-1 py-3 animate-in fade-in slide-in-from-left-2">
                      {cat.sub_categories?.map((sub: any) => {
                        const isSubActive = selectedSub === sub.id;
                        return (
                          <div key={sub.id}>
                            <button 
                              onClick={() => {
                                setSelectedSub(sub.id);
                                setSelectedInner(null);
                                setExpandedSub(expandedSub === sub.id ? null : sub.id);
                              }}
                              className={`w-full flex items-center justify-between text-[9px] font-bold uppercase py-2 px-4 rounded-xl transition-all
                                ${isSubActive ? 'text-rose-600 bg-rose-50/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                              {sub.name}
                              {sub.inner_categories?.length > 0 && <ChevronRight size={12} className={`transition-transform ${expandedSub === sub.id ? 'rotate-90' : ''}`} />}
                            </button>

                            {expandedSub === sub.id && (
                              <div className="ml-4 space-y-1 mt-1 border-l border-rose-100">
                                {sub.inner_categories?.map((inner: any) => {
                                  const isInnerActive = selectedInner === inner.id;
                                  return (
                                    <button 
                                      key={inner.id}
                                      onClick={() => setSelectedInner(inner.id)}
                                      className={`w-full text-left text-[8px] font-black uppercase py-2 px-5 transition-all
                                        ${isInnerActive ? 'text-rose-600 font-black' : 'text-slate-400 hover:text-rose-400'}`}
                                    >
                                      {isInnerActive ? '● ' : '○ '} {inner.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* PRODUCTS */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[450px] bg-slate-50 rounded-[3rem] animate-pulse flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-200" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {products.length > 0 ? (
                products.map(product => <ProductCard key={product.id} product={product} user={user} />)
              ) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No products found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-200" size={40} /></div>}>
      <ProductsContent />
    </Suspense>
  );
}