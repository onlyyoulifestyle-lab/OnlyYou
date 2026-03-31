"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/supabase";
import Link from 'next/link';
import { ChevronRight, ArrowRight, ShoppingBag, Sparkles, Heart } from 'lucide-react';
// Import your main ProductCard component
import ProductCard from "../../components/ProductCard";

export default function HomePage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Get User Session for the ProductCard logic (Wishlist/Cart)
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // 1. Fetch Banners
      const { data: bannerData } = await supabase
        .from('home_banner')
        .select('*')
        .order('created_at', { ascending: false });
      
      // 2. Fetch Categories
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .limit(4);

      // 3. Fetch Featured Products (New Arrivals)
      const { data: productData } = await supabase
        .from('products')
        .select('*, categories(name), product_variants(*)')
        .eq('active', true)
        .limit(8)
        .order('created_at', { ascending: false });

      if (bannerData) setBanners(bannerData);
      if (categoryData) setCategories(categoryData);
      if (productData) setProducts(productData);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setActiveBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-black uppercase tracking-[0.5em] text-slate-200 animate-pulse">
      Only You Lifestyle...
    </div>
  );

  return (
    <main className="min-h-screen bg-white">
      
      {/* 1. HERO BANNER SECTION */}
      <section className="relative w-full h-[75vh] md:h-[90vh] overflow-hidden bg-slate-900">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === activeBanner ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img 
              src={banner.image_url} 
              alt={banner.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center">
              <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="max-w-2xl text-white space-y-6">
                  <h1 className="text-6xl md:text-8xl font-[1000] uppercase tracking-tighter leading-[0.9] ">
                    {banner.title}
                  </h1>
                  <p className="text-lg opacity-80 max-w-md font-medium">{banner.description}</p>
                  <Link href="/site/products" className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all shadow-2xl">
                    Shop Now <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setActiveBanner(i)} className={`h-1 rounded-full transition-all ${i === activeBanner ? "w-16 bg-white" : "w-4 bg-white/30"}`} />
          ))}
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-6 pb-14 pt-10">
        <div className="flex justify-between items-end mb-10">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 flex items-center gap-2">
              <Sparkles size={14} /> The Curated Selection
            </span>
            <h2 className="text-5xl font-[1000] uppercase tracking-tighter">Categories</h2>
          </div>
          <Link href="/site/categories" className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:text-rose-500 hover:border-rose-500 transition-all">
            Explore All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/site/products?category=${cat.id}`} className="group relative h-[500px] rounded-[3rem] overflow-hidden">
              <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-10 text-white">
                <h3 className="text-3xl font-black uppercase tracking-tighter ">{cat.name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">Shop Collection</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. NEW ARRIVALS (Using your Premium ProductCard) */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl font-[1000] uppercase tracking-tighter ">New Arrivals</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Handpicked essentials for your unique lifestyle</p>
          </div>

          {/* Using the standard ProductCard for that advanced glassmorphism look */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} user={user} />
            ))}
          </div>

          <div className="mt-20 text-center">
             <Link href="/site/products" className="inline-block border-2 border-black px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-xl hover:shadow-2xl active:scale-95">
               View Entire Boutique
             </Link>
          </div>
        </div>
      </section>

      {/* 4. TRUST BAR */}
      <section className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Free Shipping", sub: "On orders over ₹1999" },
            { label: "100% Genuine", sub: "Authentic products only" },
            { label: "Secure Pay", sub: "Safe & encrypted checkout" },
            { label: "Easy Returns", sub: "7-day hassle-free policy" },
          ].map((item, idx) => (
            <div key={idx} className="space-y-3 group">
              <div className="h-1 w-12 bg-rose-500 mx-auto transition-all group-hover:w-20" />
              <h4 className="font-black uppercase text-[11px] tracking-widest">{item.label}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}