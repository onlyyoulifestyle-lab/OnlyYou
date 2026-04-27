import React from "react";
import Header from "../components/Header";
import { supabase } from "../../lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Camera, Globe } from 'lucide-react';

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Fetch Contact Details from the single 'site_settings' row
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .maybeSingle(); // maybeSingle returns null instead of an error if empty

  // Logo Path relative to the public folder
  const logoPath = "/onlyYou.png";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* GLOBAL HEADER - It is 'fixed' in the Header component, so it floats */}
      <Header />

      {/* MAIN CONTENT AREA 
          pt-[80px]: Padding top for mobile (Header height)
          lg:pt-[120px]: Padding top for Desktop (Header + Nav height)
          Adjust these based on your actual Header.tsx height.
      */}
      <main className="flex-grow pt-[80px] lg:pt-[120px]">
        {children}
      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-slate-50 border-t border-slate-100 pt-20 pb-10 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">

            {/* BRAND INFO with LOGO */}
            <div className="col-span-1 md:col-span-1 flex flex-col gap-5">
              <Link href="/site" className="flex items-center gap-3">
                <div className="relative w-12 h-12 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1">
                  <Image
                    src={logoPath}
                    alt="OnlyYou Lifestyle Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-[1000] uppercase tracking-tighter leading-none">
                    ONLYYOU
                  </h2>
                  <span className="text-[9px] font-black tracking-[0.3em] uppercase text-rose-500">
                    LIFESTYLE
                  </span>
                </div>
              </Link>
              <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest max-w-xs">
                Curating the finest in beauty, bags, and luxury essentials for the modern icon.
              </p>
            </div>

            {/* QUICK LINKS */}
            <div className="md:pl-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-slate-900">Explore</h4>
              <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <li><Link href="/site/products" className="hover:text-rose-500 transition-colors">The Boutique</Link></li>
                <li><Link href="/site/categories" className="hover:text-rose-500 transition-colors">Collections</Link></li>
              </ul>
            </div>

            {/* CUSTOMER CARE */}
            <div className="md:pl-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-slate-900">Assistance</h4>
              <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <li><Link href="/site/about" className="hover:text-rose-500 transition-colors">Our Story</Link></li>
                <li><Link href="/site/contact" className="hover:text-rose-500 transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            {/* NEW CONTACT & CONNECT SECTION (Replaces Newsletter) */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-slate-900">Connect with Us</h4>

              <div className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {settings?.office_address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="leading-relaxed">{settings.office_address}</span>
                  </div>
                )}
                {settings?.whatsapp_number && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="flex-shrink-0 text-slate-400" />
                    <span>{settings.whatsapp_number}</span>
                  </div>
                )}
                {settings?.email_address && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="flex-shrink-0 text-slate-400" />
                    <span className="lowercase hover:text-rose-500 transition-colors truncate">{settings.email_address}</span>
                  </div>
                )}
              </div>

              {/* SOCIAL MEDIA ICONS */}
              <div className="flex gap-4 pt-2">
                {settings?.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white rounded-full border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 shadow-sm">
                    <Camera size={18} />
                  </a>
                )}
                {settings?.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white rounded-full border border-slate-100 text-slate-400 hover:text-black hover:border-slate-300 transition-all active:scale-95 shadow-sm">
                    < Globe size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">

            {/* LEFT SIDE */}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center md:text-left">
              © {new Date().getFullYear()} ONLYYOU LIFESTYLE. All Rights Reserved.
            </p>

            {/* CENTER LINKS */}
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <a
                href="/TermsONLYyou.pdf"
                target="_blank"
                className="hover:text-rose-500 transition-colors"
              >
                Terms & Conditions
              </a>
            </div>

            {/* RIGHT SIDE */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-right">
              Designed & Developed by{" "}
              <a
                href="https://rakvih.in/"
                target="_blank"
                className="text-rose-500 hover:underline"
              >
                Rakvih
              </a>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}