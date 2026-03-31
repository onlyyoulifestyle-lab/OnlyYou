"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

export default function ProductCardSmall({ product, user }: { product: any, user: any }) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (product.product_variants?.length > 0) {
      setSelectedVariant(product.product_variants[0]);
    }
    const checkWishlistStatus = async () => {
      if (user) {
        const { data } = await supabase.from('wishlist').select('id').eq('user_id', user.id).eq('product_id', product.id).maybeSingle();
        if (data) setIsWishlisted(true);
      }
    };
    checkWishlistStatus();
  }, [product, user]);

  const checkAuth = () => {
    if (!user) {
      toast.error("Auth Required", { description: "Please sign in.", duration: 2000 });
      return false;
    }
    return true;
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!checkAuth()) return;
    if (isWishlisted) {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', product.id);
      if (!error) { setIsWishlisted(false); toast.info("Removed", { description: product.name }); }
    } else {
      const { error } = await supabase.from('wishlist').insert([{ product_id: product.id, user_id: user.id }]);
      if (!error) { setIsWishlisted(true); toast.success("Saved", { description: product.name }); }
    }
  };

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!checkAuth() || !selectedVariant) return;
    if (selectedVariant.stock <= 0) return toast.error("Sold Out");

    setLoading(true);
    const { error } = await supabase.from('cart').insert([{ 
      product_id: product.id, user_id: user.id, quantity: 1,
      variant_id: selectedVariant.id, size: `${selectedVariant.size}${selectedVariant.unit || ''}` 
    }]);

    if (error) toast.error("Error adding to bag");
    else toast.success("Added", { description: `${product.name} (${selectedVariant.size}${selectedVariant.unit || ''})` });
    setLoading(false);
  };

  if (!selectedVariant) return null;

  return (
    <div className="group relative bg-white border border-slate-100 rounded-[1.8rem] overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 max-w-[210px]">
      
      {/* 1. COMPACT IMAGE SECTION */}
      <div className="relative aspect-[1/1.2] overflow-hidden bg-[#fafafa]">
        <Link href={`/site/products/${product.id}`}>
          <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </Link>

        {/* SMALL BADGE */}
        {product.is_new && (
          <div className="absolute top-2 left-2">
            <span className="bg-white/90 backdrop-blur-md text-[7px] font-black uppercase tracking-tighter px-2 py-1 rounded-full border border-slate-100 shadow-sm flex items-center gap-1">
              <Sparkles size={8} className="text-rose-500 fill-rose-500" /> NEW
            </span>
          </div>
        )}

        {/* MINI WISHLIST */}
        <button onClick={handleWishlist} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all">
          <Heart size={14} className={isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
        </button>
      </div>

      {/* 2. MINIMIZED CONTENT SECTION */}
      <div className="p-3">
        <p className="text-[7px] font-black text-rose-500 uppercase tracking-[0.3em] mb-0.5 leading-none">
          {product.categories?.name || "Boutique"}
        </p>
        <h3 className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight mb-2">
          {product.name}
        </h3>

        {/* MINI VARIANTS (Simple Underline Style) */}
        <div className="flex gap-2 mb-3">
          {product.product_variants?.map((v: any) => (
            <button key={v.id} onClick={(e) => { e.preventDefault(); setSelectedVariant(v); }}
              className={`text-[8px] font-black transition-all ${selectedVariant.id === v.id ? "text-black border-b-2 border-black" : "text-slate-300 hover:text-slate-500"}`}>
              {v.size}{v.unit}
            </button>
          ))}
        </div>

        {/* PRICE & MINI CART */}
        <div className="flex items-center justify-between border-t border-slate-50 pt-2">
          <div className="flex flex-col">
            <span className="text-[13px] font-[1000] text-black leading-none">₹{selectedVariant.mrp}</span>
            <span className={`text-[6px] font-black uppercase mt-1 tracking-widest ${selectedVariant.stock > 0 ? "text-emerald-500" : "text-rose-400"}`}>
              {selectedVariant.stock > 0 ? `${selectedVariant.stock} In Stock` : "Sold Out"}
            </span>
          </div>

          <button onClick={handleCart} disabled={loading || selectedVariant.stock === 0}
            className="h-8 w-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-rose-600 transition-all active:scale-90 disabled:bg-slate-100">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <ShoppingBag size={14} />}
          </button>
        </div>

        {/* SLIM VIEW BUTTON */}
        <Link href={`/site/products/${product.id}`} className="flex items-center justify-between w-full mt-2 pt-1 group/btn border-t border-slate-50/50">
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover/btn:text-black transition-colors">
            View details
          </span>
          <ArrowRight size={10} className="text-slate-200 group-hover/btn:text-black group-hover/btn:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}