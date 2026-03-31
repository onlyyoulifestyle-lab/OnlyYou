"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { Package, Calendar, CheckCircle2, Clock, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("Error loading your orders");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  if (orders.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Package size={32} className="text-slate-200" />
        </div>
        <h2 className="text-3xl font-[1000] uppercase tracking-tighter mb-4">No Orders Yet</h2>
        <p className="text-slate-400 mb-8 max-w-xs font-medium">Your purchase history is currently empty. Time to start your lifestyle journey.</p>
        <Link href="/site/products" className="px-10 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
          Explore Boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-3">Order History</p>
          <h1 className="text-5xl font-[1000] uppercase tracking-tighter">My Archive</h1>
        </div>
        <Link href="/site/products" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
          Continue Shopping <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-10">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Order Header */}
            <div className="bg-slate-50/50 px-8 py-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Order ID</p>
                  <p className="text-[10px] font-bold text-black font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Placed On</p>
                  <p className="text-[10px] font-bold text-black uppercase">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Amount</p>
                  <p className="text-[10px] font-black text-black">₹{order.total_amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                {order.status === 'pending' ? (
                  <Clock size={12} className="text-amber-500" />
                ) : (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                )}
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {order.status === 'pending' ? 'Processing' : order.status}
                </span>
              </div>
            </div>

            {/* Order Items (from JSONB) */}
            <div className="px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center group">
                    <div className="w-16 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                      <img src={item.products?.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight line-clamp-1">{item.products?.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">QTY: {item.quantity} • SIZE: {item.size}</p>
                      <Link href={`/site/products/${item.product_id}`} className="text-[8px] font-black uppercase text-rose-500 mt-2 inline-block hover:underline">
                        Write a Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Footer Actions */}
            <div className="px-8 py-5 bg-white border-t border-slate-50 flex justify-end">
               <button onClick={() => toast.info("Support ticket created. We'll reach out shortly.")} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-all">
                  Need Help?
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}