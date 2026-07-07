"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { ShoppingBag, Trash2, Plus, Minus, Loader2, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Shipping address form state ---
  const [address, setAddress] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('cart')
        .select(`*, products (id, name, thumbnail_url)`)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error: any) {
      toast.error("Error loading cart");
    } finally {
      setLoading(false);
    }
  }

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    const { error } = await supabase.from('cart').update({ quantity: newQty }).eq('id', id);
    if (!error) {
      setCartItems(cartItems.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('cart').delete().eq('id', id);
    if (!error) {
      setCartItems(cartItems.filter(item => item.id !== id));
      toast.success("Item removed");
    }
  };

  const handleAddressChange = (field: keyof typeof address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const isAddressValid = () => {
    const required = ['full_name', 'phone', 'address_line1', 'city', 'state', 'pincode'] as const;
    return required.every((field) => address[field].trim().length > 0);
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => {
    // Assuming you stored the price in the cart or need to fetch it from variants. 
    // For now, using a placeholder logic or fetching from your variant data if available.
    return acc + (450 * item.quantity); // Replace 450 with item.price if available in your schema
  }, 0);

  const gst = subtotal * 0.18;
  const shipping = subtotal > 1000 ? 0 : 99;
  const total = subtotal + gst + shipping;

  // Fires off both the customer confirmation and shop-owner alert emails.
  // Failures here are logged but never block the checkout flow.
  const sendNewOrderEmails = async (orderId: string) => {
    try {
      const res = await fetch('/api/notify-new-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId: user.id,
          totalAmount: total,
          items: cartItems,
          shippingAddress: address,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Order email failed:', data.error || res.statusText);
      }
    } catch (err) {
      console.error('Failed to send order emails:', err);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAddressValid()) {
      toast.error("Please fill in your full shipping address");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Order — select the inserted row back so we get its id
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          items: cartItems,
          shipping_address: address,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Clear Cart
      await supabase.from('cart').delete().eq('user_id', user.id);

      // 3. Send confirmation email to customer + alert email to shop owner
      if (newOrder?.id) {
        sendNewOrderEmails(newOrder.id);
      }

      toast.success("Order Placed Successfully!");
      router.push('/site/orders'); // Redirect to orders page
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
            <ShoppingBag size={40} className="text-slate-200" />
        </div>
        <h2 className="text-3xl font-[1000] uppercase tracking-tighter mb-4">Your Bag is Empty</h2>
        <p className="text-slate-400 mb-8 max-w-xs font-medium">Looks like you haven't added anything to your collection yet.</p>
        <Link href="/site/products" className="px-10 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-16">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-3">Your Selection</p>
        <h1 className="text-5xl font-[1000] uppercase tracking-tighter">Shopping <span className="text-slate-300 font-light">Bag</span></h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Left: Cart Items + Address */}
        <div className="lg:col-span-2 space-y-16">

          {/* --- Cart Items --- */}
          <div className="space-y-8">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-6 pb-8 border-b border-slate-100 group">
                <div className="w-32 h-40 bg-slate-50 rounded-3xl overflow-hidden flex-shrink-0">
                  <img src={item.products?.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-[1000] uppercase tracking-tighter">{item.products?.name}</h3>
                      <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-all">
                          <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Size: {item.size}</p>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-slate-400 hover:text-black"><Minus size={14} /></button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-slate-400 hover:text-black"><Plus size={14} /></button>
                    </div>
                    <p className="text-lg font-[1000]">₹{(450 * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- Shipping Address Form --- */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-500">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="text-xl font-[1000] uppercase tracking-tighter">Shipping Address</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Where should we deliver your order?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                type="text"
                placeholder="Full Name"
                value={address.full_name}
                onChange={(e) => handleAddressChange('full_name', e.target.value)}
                className="col-span-1 bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-medium focus:bg-white focus:border-slate-100 transition-all outline-none"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={address.phone}
                onChange={(e) => handleAddressChange('phone', e.target.value)}
                className="col-span-1 bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-medium focus:bg-white focus:border-slate-100 transition-all outline-none"
              />
              <input
                type="text"
                placeholder="Address Line 1"
                value={address.address_line1}
                onChange={(e) => handleAddressChange('address_line1', e.target.value)}
                className="md:col-span-2 bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-medium focus:bg-white focus:border-slate-100 transition-all outline-none"
              />
              <input
                type="text"
                placeholder="Address Line 2 (optional)"
                value={address.address_line2}
                onChange={(e) => handleAddressChange('address_line2', e.target.value)}
                className="md:col-span-2 bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-medium focus:bg-white focus:border-slate-100 transition-all outline-none"
              />
              <input
                type="text"
                placeholder="City"
                value={address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="col-span-1 bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-medium focus:bg-white focus:border-slate-100 transition-all outline-none"
              />
              <input
                type="text"
                placeholder="State"
                value={address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="col-span-1 bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-medium focus:bg-white focus:border-slate-100 transition-all outline-none"
              />
              <input
                type="text"
                placeholder="Pincode"
                value={address.pincode}
                onChange={(e) => handleAddressChange('pincode', e.target.value)}
                className="col-span-1 bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-medium focus:bg-white focus:border-slate-100 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 rounded-[2.5rem] p-10 sticky top-24">
            <h3 className="text-xl font-[1000] uppercase tracking-tighter mb-8">Order Summary</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Subtotal</span>
                <span className="text-black font-black">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>GST (18%)</span>
                <span className="text-black font-black">₹{gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Shipping</span>
                <span className="text-black font-black">{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between">
                <span className="text-lg font-[1000] uppercase tracking-tighter">Total</span>
                <span className="text-2xl font-[1000]">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full py-5 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-300"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : (
                <>Place Order <ArrowRight size={16} /></>
              )}
            </button>

            <div className="mt-8 flex items-center gap-3 text-[9px] font-black uppercase text-slate-400 justify-center">
                <ShieldCheck size={14} /> Secure Checkout Guaranteed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}