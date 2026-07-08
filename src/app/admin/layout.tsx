"use client";
import React, { useState } from 'react';
import {
  LayoutDashboard, Calendar, Layers, BookOpen, Users,
  Image as ImageIcon, MessageSquare, Settings,
  LogOut, Menu, X, User, Camera, AppWindow, Info, Mail,
  Tag, Filter, Package // Add these three
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Import Next Image

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  // Project Constants
  const projectName = "ONLYYOULIFESTYLE";
  const logoPath = "/onlyYou.png";

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/admin/dashboard' },

    // --- CATEGORY MANAGEMENT SECTION ---
    { name: 'Categories', icon: <Layers size={18} />, path: '/admin/categories' },
    { name: 'Sub Categories', icon: <Tag size={18} />, path: '/admin/sub-categories' },
    { name: 'Inner Categories', icon: <Filter size={18} />, path: '/admin/inner-categories' },

    // --- PRODUCT & INVENTORY ---
    { name: 'Products', icon: <Package size={18} />, path: '/admin/products' },
    { name: 'Product bulk upload', icon: <ImageIcon size={18} />, path: '/admin/bulk-upload' },

    // --- OTHER LINKS ---
    { name: 'Orders', icon: <BookOpen size={18} />, path: '/admin/orders' },
    { name: 'Users', icon: <Users size={18} />, path: '/admin/users' },
    { name: 'Home Banner', icon: <AppWindow size={18} />, path: '/admin/home-banner' },
    { name: 'Reviews', icon: <MessageSquare size={18} />, path: '/admin/reviews' },

    // ADDED: Customer Inquiries / Messages
    { name: 'Messages', icon: <Mail size={18} />, path: '/admin/messages' },

    // { name: 'Settings', icon: <Settings size={18} />, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/adminlogin");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white text-black transition-all duration-300 ease-in-out flex flex-col fixed h-full z-50 border-r border-slate-200 shadow-sm`}>

        {/* Logo Section */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 min-h-[80px]">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-500">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm p-1.5">
                <Image
                  src={logoPath}
                  alt="Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-black tracking-tighter truncate w-32 uppercase">
                  {projectName}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Admin Panel</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex items-center justify-center w-full">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-black shadow-sm p-1.5">
                <Image
                  src={logoPath}
                  alt="Logo"
                  width={30}
                  height={30}
                  className="w-full h-full object-contain invert" // Inverted for black bg if needed
                />
              </div>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`absolute ${isSidebarOpen ? 'right-2' : 'right-[-12px] top-8'} p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-black transition-colors z-50 shadow-sm`}
          >
            {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-0.5 custom-scrollbar">
          {menuItems.map((item) => (
            <div
              key={item.name}
              onClick={() => router.push(item.path)}
              className="flex items-center p-2.5 rounded-xl hover:bg-black hover:text-white cursor-pointer transition-all duration-200 group relative"
            >
              <div className="text-slate-400 group-hover:text-white transition-colors">
                {item.icon}
              </div>
              {isSidebarOpen && (
                <span className="ml-3 font-bold text-xs tracking-tight">{item.name}</span>
              )}

              {!isSidebarOpen && (
                <div className="absolute left-16 bg-black text-white px-3 py-1.5 rounded-md text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  {item.name}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-2.5 rounded-xl hover:bg-red-600 hover:text-white text-slate-500 transition-all duration-200 group"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span className="ml-3 font-bold text-xs tracking-tight">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">
              {projectName} <span className="text-slate-300 font-light mx-1">/</span> <span className="text-slate-400">Command Center</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
              <LogOut size={18} />
            </button>
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white border-2 border-slate-100">
              <User size={16} />
            </div>
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}