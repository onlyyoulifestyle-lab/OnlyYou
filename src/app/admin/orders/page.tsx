"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/supabase";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Package, Search, Eye, Loader2, X, ShoppingBag,
  TrendingUp, Calendar, Hash, IndianRupee, User, ChevronDown, Download
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  }

  // Sends the status-change notification email via our API route.
  // The route looks up the customer's email server-side from Supabase Auth
  // using order.user_id, since the orders table itself has no email column.
  const sendStatusEmail = async (order: any, newStatus: string) => {
    if (!order.user_id) {
      console.warn(`No user_id found on order ${order.id}, skipping notification.`);
      return;
    }

    try {
      setEmailSendingId(order.id);
      const res = await fetch('/api/notify-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: order.user_id,
          orderId: order.id,
          status: newStatus,
          totalAmount: order.total_amount,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Status email failed:', data.error || res.statusText);
      }
    } catch (err) {
      console.error('Failed to send status email:', err);
    } finally {
      setEmailSendingId(null);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      const updatedOrder = orders.find(o => o.id === orderId);

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      // Fire the email notification after a successful status update
      if (updatedOrder) {
        sendStatusEmail(updatedOrder, newStatus);
      }
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'out_for_delivery': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'confirmed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const formatStatusLabel = (status: string) => {
    const match = STATUS_OPTIONS.find(s => s.value === status?.toLowerCase());
    return match ? match.label : status;
  };

  // Builds and downloads a PDF invoice for the given order.
  const downloadInvoice = (order: any) => {
    const doc = new jsPDF();
    const shortId = order.id.slice(0, 8).toUpperCase();
    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    // --- Header ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('OnlyYou Lifestyle', 14, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text('onlyyoulifestyle@gmail.com', 14, 26);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 196, 20, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`#${shortId}`, 196, 26, { align: 'right' });

    doc.setDrawColor(230);
    doc.line(14, 32, 196, 32);

    // --- Order meta ---
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Order Date: ${orderDate}`, 14, 40);
    doc.text(`Status: ${formatStatusLabel(order.status)}`, 14, 46);
    doc.text(`Customer ID: ${order.user_id}`, 14, 52);

    // --- Shipping address (only if present on the order) ---
    let tableStartY = 60;
    if (order.shipping_address && Object.keys(order.shipping_address).length > 0) {
      const addr = order.shipping_address;
      doc.setFont('helvetica', 'bold');
      doc.text('Ship To:', 130, 40);
      doc.setFont('helvetica', 'normal');
      const addressLines = [
        addr.full_name,
        addr.phone,
        addr.address_line1,
        addr.address_line2,
        [addr.city, addr.state, addr.pincode].filter(Boolean).join(', '),
      ].filter(Boolean);
      doc.text(addressLines, 130, 46);
      tableStartY = 46 + addressLines.length * 5 + 10;
    }

    // --- Items table ---
    const rows = (order.items || []).map((item: any) => {
      const name = item.name || item.products?.name || 'Item';
      const qty = item.quantity || 1;
      const price = item.price || item.mrp || 0;
      return [name, item.variant || item.size || 'Standard', String(qty), `Rs. ${Number(price).toLocaleString()}`, `Rs. ${(price * qty).toLocaleString()}`];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [['Item', 'Variant', 'Qty', 'Unit Price', 'Total']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    // --- Totals ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 140, finalY);
    doc.text(`Rs. ${Number(order.total_amount).toLocaleString()}`, 196, finalY, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('Thank you for shopping with OnlyYou Lifestyle.', 14, finalY + 20);

    doc.save(`Invoice-${shortId}.pdf`);
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-sans">

      {/* --- HEADER --- */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center md:items-end bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">Live Logistics</span>
          </div>
          <h1 className="text-4xl font-[1000] text-black tracking-tight uppercase leading-none">
            Order Tracking
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
            Order Management & Status
          </p>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-5 pl-16 pr-8 text-[11px] font-black uppercase tracking-widest focus:bg-white focus:border-slate-100 transition-all outline-none shadow-inner"
          />
        </div>
      </div>

      {/* --- STATS OVERVIEW --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <TrendingUp className="absolute -right-4 -top-4 w-32 h-32 text-white/5 rotate-12" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-2">Gross Revenue</p>
          <h2 className="text-4xl font-[1000]">₹{orders.reduce((acc, curr) => acc + Number(curr.total_amount), 0).toLocaleString()}</h2>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] group hover:bg-rose-500 transition-all duration-500">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 group-hover:text-rose-100 mb-2">Pending Orders</p>
          <h2 className="text-4xl font-[1000] text-slate-900 group-hover:text-white">{orders.filter(o => o.status === 'pending').length}</h2>
        </div>
        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Volume</p>
          <h2 className="text-4xl font-[1000] text-slate-900">{orders.length} <span className="text-lg font-bold text-slate-300">Units</span></h2>
        </div>
      </div>

      {/* --- MAIN DATA TABLE --- */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400">Reference</th>
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400">Total</th>
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400">Status</th>
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-rose-500" size={40} /></td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-100 rounded-2xl text-slate-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <Hash size={14} />
                      </div>
                      <div>
                        <div className="font-[1000] text-sm text-slate-900 uppercase">#{order.id.slice(0, 8)}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-8 font-[1000] text-sm text-slate-900">₹{Number(order.total_amount).toLocaleString()}</td>
                  <td className="p-8">
                    <span className={`px-5 py-2 rounded-full text-[9px] font-[1000] uppercase tracking-widest border shadow-sm ${getStatusStyle(order.status)}`}>
                      {formatStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex justify-end items-center gap-3">
                      {/* --- STATUS DROPDOWN --- */}
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={emailSendingId === order.id}
                          className={`appearance-none cursor-pointer h-10 pl-4 pr-9 rounded-2xl text-[9px] font-[1000] uppercase tracking-widest border shadow-sm outline-none transition-all disabled:opacity-50 ${getStatusStyle(order.status)}`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60"
                        />
                      </div>

                      {/* --- DOWNLOAD INVOICE BUTTON --- */}
                      <button
                        onClick={() => downloadInvoice(order)}
                        title="Download Invoice"
                        className="w-10 h-10 flex items-center justify-center text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                        <Download size={16} />
                      </button>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="h-10 px-6 flex items-center justify-center gap-2 text-white bg-black rounded-2xl hover:bg-rose-500 transition-all shadow-lg active:scale-95"
                      >
                        <Eye size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SLIDE-OUT DETAIL DRAWER --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-md p-4 transition-all">
          <div className="w-full max-w-xl bg-white h-full rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-500 ease-out">

            {/* Drawer Header */}
            <div className="p-10 border-b border-slate-50 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.4em] mb-2 block">Order Summary</span>
                <h2 className="text-3xl font-[1000] uppercase tracking-tighter">Manifest #{selectedOrder.id.slice(0, 8)}</h2>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase border border-slate-100 px-3 py-1.5 rounded-xl">
                    <Calendar size={12} /> {new Date(selectedOrder.created_at).toLocaleString()}
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${getStatusStyle(selectedOrder.status)}`}>
                    {formatStatusLabel(selectedOrder.status)}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-4 bg-slate-50 rounded-3xl hover:bg-rose-500 hover:text-white transition-all shadow-inner">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10">

              {/* Customer Info */}
              <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm"><User size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer ID</p>
                    <p className="text-xs font-black uppercase text-slate-900">{selectedOrder.user_id}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <h3 className="text-[11px] font-[1000] uppercase tracking-[0.3em] text-slate-900 flex items-center gap-2">
                    <ShoppingBag size={14} className="text-rose-500" /> Line Items
                  </h3>
                  <span className="text-[10px] font-black text-slate-300 uppercase">{selectedOrder.items?.length || 0} Total Units</span>
                </div>

                <div className="grid gap-4">
                  {selectedOrder.items?.map((item: any, idx: number) => {
                    // Logic to find the best image URL available
                    const imageUrl = item.thumbnail_url || item.image_url || item.image || (item.gallery_urls && item.gallery_urls[0]);

                    return (
                      <div key={idx} className="group flex items-center gap-6 p-5 rounded-[2rem] border-2 border-slate-50 hover:border-rose-100 hover:bg-rose-50/20 transition-all duration-300">
                        <div className="h-20 w-20 bg-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                          <img 
                            src={imageUrl || 'https://placehold.co/400x400/f1f5f9/64748b?text=No+Image'}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Final fallback if the Supabase link fails to load
                              target.src = 'https://placehold.co/400x400/f1f5f9/rose-500/white?text=Load+Error';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">{item.category || 'Lifestyle Item'}</p>
                          <p className="text-sm font-[1000] text-slate-900 uppercase truncate">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Qty: {item.quantity || 1} • Size: {item.variant || 'Standard'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-400 line-through mb-1">₹{(item.mrp || 0).toLocaleString()}</p>
                          <p className="text-sm font-[1000] text-slate-900">₹{(item.price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t-2 border-dashed border-slate-100 pt-8 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase text-emerald-500">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <p className="text-[10px] font-[1000] uppercase tracking-widest text-slate-900">Total Settlement</p>
                  <p className="text-3xl font-[1000] text-slate-900 tracking-tighter">₹{Number(selectedOrder.total_amount).toLocaleString()}</p>
                </div>
              </div>

              {/* --- DOWNLOAD INVOICE BUTTON (drawer) --- */}
              <button
                onClick={() => downloadInvoice(selectedOrder)}
                className="w-full py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm flex items-center justify-center gap-3"
              >
                <Download size={16} /> Download Invoice
              </button>
            </div>

            {/* Drawer Footer Actions --- STATUS DROPDOWN --- */}
            <div className="p-10 bg-slate-50/50">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Update Status</p>
              <div className="relative">
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  disabled={emailSendingId === selectedOrder.id}
                  className={`w-full appearance-none cursor-pointer py-5 pl-6 pr-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border-2 outline-none shadow-sm transition-all disabled:opacity-50 ${getStatusStyle(selectedOrder.status)}`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-60"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}