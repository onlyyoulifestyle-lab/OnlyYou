"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, ShoppingBag, Heart, User,
  Menu, X, Sparkles, LogOut, Package, Settings
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from "../../lib/supabase";
import AuthModal from './AuthModal';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Fetches the real cart & wishlist counts for the current user
  const fetchCounts = async (userId: string) => {
    const [{ count: cartCnt }, { count: wishlistCnt }] = await Promise.all([
      supabase.from('cart').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('wishlist').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    setCartCount(cartCnt || 0);
    setWishlistCount(wishlistCnt || 0);
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCounts(session.user.id);
    });

    // Listen for login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCounts(session.user.id);
      } else {
        setCartCount(0);
        setWishlistCount(0);
      }
    });

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  // Keep counts live: re-fetch whenever cart or wishlist rows change for this user.
  // This means if a product is added to the cart/wishlist from anywhere in the
  // app (e.g. ProductCardSmall), the header badge updates instantly.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`header-counts-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart', filter: `user_id=eq.${user.id}` },
        () => fetchCounts(user.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wishlist', filter: `user_id=eq.${user.id}` },
        () => fetchCounts(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    window.location.reload();
  };

  const logoPath = "/onlyYou.png";

  return (
    <>
      <header className={`w-full fixed top-0 z-[100] transition-all duration-500 ${scrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-2" : "bg-white py-4"
        }`}>
        {/* 1. ANNOUNCEMENT BAR */}
        {!scrolled && (
          <div className="w-full bg-black text-white text-[9px] font-black uppercase tracking-[0.3em] py-2 text-center overflow-hidden">
            <div className="animate-pulse">Free Express Shipping on Orders Over ₹999 • Shop the New Summer Collection</div>
          </div>
        )}

        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between">

          {/* LEFT: SEARCH */}
          <div className="hidden lg:flex items-center flex-1">
            <div className="group flex items-center bg-slate-50 rounded-full px-5 py-2.5 w-full max-w-xs border border-transparent focus-within:border-black/10 focus-within:bg-white transition-all">
              <Search size={14} className="text-slate-400 group-focus-within:text-black" />
              <input
                type="text"
                placeholder="SEARCH BEAUTY..."
                className="bg-transparent border-none ml-3 text-[10px] font-bold uppercase tracking-widest outline-none w-full placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* CENTER: LOGO */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="flex flex-col items-center group">
              <div className="relative w-12 h-12 transition-transform duration-500 group-hover:scale-110">
                <Image src={logoPath} alt="Logo" fill className="object-contain" priority />
              </div>
              <div className="flex flex-col items-center mt-1 text-center">
                <span className="text-lg font-[1000] tracking-[-0.05em] uppercase leading-none">ONLYYOU</span>
                <span className="text-[8px] font-black tracking-[0.5em] uppercase text-rose-500">LIFESTYLE</span>
              </div>
            </Link>
          </div>

          {/* RIGHT: ACTIONS */}
          {/* RIGHT: ACTIONS */}
          <div className="flex-1 flex justify-end items-center gap-2 sm:gap-6">
            <button className="lg:hidden p-2 text-slate-800">
              <Search size={20} />
            </button>

            {/* ONLY SHOW WISHLIST & CART IF LOGGED IN */}
            {user && (
              <>
                <Link href="/site/wishlist" className="relative group p-2 transition-all active:scale-90">
                  <Heart size={20} className="text-slate-800 group-hover:text-rose-500 transition-colors" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-0 bg-rose-500 text-white text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>

                <Link href="/site/cart" className="relative group p-2 transition-all active:scale-90">
                  <ShoppingBag size={20} className="text-slate-800 group-hover:text-rose-600 transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-0 bg-black text-white text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* PROFILE ICON OR SIGN IN */}
            {!user ? (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="hidden sm:block bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl active:scale-95 border border-black hover:border-rose-600"
              >
                Sign In
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 group outline-none"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center hover:border-rose-500 transition-all overflow-hidden ring-2 ring-transparent group-hover:ring-rose-100 shadow-sm">
                    <User size={18} className="text-slate-600 group-hover:text-rose-500" />
                  </div>
                </button>

                {/* DROPDOWN MENU */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-4 w-56 bg-white border border-slate-100 shadow-2xl rounded-[2rem] p-4 animate-in fade-in slide-in-from-top-2 duration-300 z-[110]">
                    <div className="px-4 py-3 mb-2 border-b border-slate-50">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Welcome back</p>
                      <p className="text-[11px] font-black uppercase truncate text-slate-800">
                        {user.user_metadata?.full_name || 'Member'}
                      </p>
                    </div>
                    <Link href="/site/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider transition-colors">
                      <Settings size={14} className="text-slate-400" /> Account
                    </Link>
                    <Link href="/site/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider transition-colors">
                      <Package size={14} className="text-slate-400" /> My Orders
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 p-3 mt-2 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button className="lg:hidden p-2 text-slate-800" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* 2. LOWER NAVIGATION (Desktop Tabs) */}
        <nav className="hidden lg:flex justify-center items-center gap-12 mt-4 pb-2">
          {[
            { name: 'Home', path: '/site/home', hot: false },
            { name: 'The Products', path: '/site/products', hot: true },
            { name: 'Categories', path: '/site/categories', hot: false },
            { name: 'Our Story', path: '/site/about', hot: false },
          ].map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-black transition-all relative group flex items-center gap-1"
            >
              {link.hot && <Sparkles size={10} className="text-amber-400 animate-pulse" />}
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-rose-500 transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* MOBILE MENU (Slide-in) */}
        <div className={`fixed inset-0 bg-white z-[200] transition-transform duration-500 flex flex-col p-10 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex justify-between items-center mb-20">
            <span className="font-black text-xl uppercase tracking-tighter">OnlyYou</span>
            <button onClick={() => setIsMenuOpen(false)}><X size={32} /></button>
          </div>
          <div className="flex flex-col gap-8">
            {['Home', 'Products', 'Categories', 'Gallery', 'About Us'].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-4xl font-[1000] uppercase tracking-tighter hover:text-rose-500">
                {item}
              </Link>
            ))}
            <button
              onClick={() => { setIsMenuOpen(false); setIsAuthOpen(true); }}
              className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              {user ? "View Profile" : "Sign In / Register"}
            </button>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}