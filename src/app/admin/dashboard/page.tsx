"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/supabase";
import { 
  Users, Package, IndianRupee, MessageSquare, 
  Clock, ShoppingBag, ArrowUpRight, Loader2 
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalReviews: 0,
    revenue: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    
    // 1. Fetch Counts from your tables (using { count: 'exact', head: true } for performance)
    const [users, products, orders, reviews] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
    ]);

    // 2. Fetch Recent Orders for the table
    const { data: latestOrders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    setStats({
      totalUsers: users.count || 0,
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalReviews: reviews.count || 0,
      revenue: 0 // Replace with a sum query if you have a 'total_price' column in orders
    });

    if (latestOrders) setRecentOrders(latestOrders);
    setLoading(false);
  }

  const statCards = [
    { name: 'Total Customers', value: stats.totalUsers, icon: <Users className="text-blue-600" />, color: 'bg-blue-50' },
    { name: 'Total Products', value: stats.totalProducts, icon: <Package className="text-purple-600" />, color: 'bg-purple-50' },
    { name: 'Total Orders', value: stats.totalOrders, icon: <ShoppingBag className="text-green-600" />, color: 'bg-green-50' },
    { name: 'User Reviews', value: stats.totalReviews, icon: <MessageSquare className="text-orange-600" />, color: 'bg-orange-50' },
  ];

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-[1000] uppercase tracking-tighter text-slate-900">Only You Life Style</h1>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Real-time Store Performance</p>
        </div>
        <button onClick={fetchDashboardData} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
          <Clock size={18} className="text-slate-400" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((item, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center`}>
              {item.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</p>
              <h3 className="text-2xl font-[1000] text-slate-900">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-[1000] uppercase tracking-widest text-slate-900">Latest Shipments</h3>
            <ArrowUpRight size={18} className="text-slate-300" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em]">
                  <th className="px-8 py-5">Order ID</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5 text-[11px] font-black text-slate-900 font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                        {order.status || 'Processing'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right text-[11px] font-bold text-slate-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Summary Card */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl">
          <div>
            <div className="w-12 h-12 bg-rose-500 rounded-2xl mb-6 flex items-center justify-center">
              <IndianRupee size={24} />
            </div>
            <h3 className="text-xl font-[1000] uppercase tracking-tight mb-2">Inventory Value</h3>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
              Monitoring {stats.totalProducts} active products across all categories.
            </p>
          </div>
          
          <div className="mt-12 space-y-4">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 w-2/3" />
            </div>
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.3em]">Storage Capacity: Optimal</p>
          </div>
        </div>
      </div>
    </div>
  );
}