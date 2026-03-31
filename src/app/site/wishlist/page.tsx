"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { Heart, ArrowRight, Loader2, X } from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';
import ProductCard from "../../components/ProductCard"; // Importing your existing component

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      // Fetch wishlist with nested product details
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          products (
            *,
            categories(name),
            product_variants (*)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error: any) {
      console.error(error);
      toast.error("Could not load wishlist");
    } finally {
      setLoading(false);
    }
  }

  const removeItem = async (wishlistId: string) => {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', wishlistId);

    if (error) {
      toast.error("Failed to remove item");
    } else {
      setWishlistItems(wishlistItems.filter(item => item.id !== wishlistId));
      toast.success("Removed from Wishlist");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-300" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <Heart size={48} className="text-slate-200 mb-6" />
        <h2 className="text-2xl font-[1000] uppercase tracking-tighter mb-4">Your Boutique awaits</h2>
        <p className="text-slate-500 mb-8 max-w-xs">Please login to view your curated collection of favorites.</p>
        <Link href="/login" className="px-10 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
          Login / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-16">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-3">Curated Collection</p>
        <h1 className="text-5xl font-[1000] uppercase tracking-tighter">My Wishlist</h1>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="py-32 border-2 border-dashed border-slate-100 rounded-[3rem] text-center">
          <p className="text-slate-400 font-serif mb-8">"Your collection is currently empty..."</p>
          <Link href="/site/products" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:gap-5 transition-all">
            Explore Boutique <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {wishlistItems.map((item) => (
            <div key={item.id} className="relative group">
              {/* Specialized Remove Button for Wishlist Page */}
              <button 
                onClick={() => removeItem(item.id)}
                className="absolute top-4 right-4 z-20 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-500 hover:text-white transition-all duration-300"
                title="Remove from wishlist"
              >
                <X size={14} />
              </button>

              {/* Your Official Product Card Component */}
              <ProductCard 
                product={item.products} 
                user={user} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}