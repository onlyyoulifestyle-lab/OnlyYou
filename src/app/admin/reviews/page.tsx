"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/supabase";
import { 
  Trash2, Search, Loader2, MessageSquare, 
  Star, Package, Mail, Calendar, AlertCircle 
} from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

async function fetchReviews() {
  setLoading(true);
  try {
    // 1. Fetch only the reviews first to see if data exists
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Error:", error.message);
      return;
    }

    if (data) {
      setReviews(data);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  } finally {
    setLoading(false);
  }
}

  const deleteReview = async (id: string) => {
    if (!window.confirm("Delete this review permanently?")) return;
    
    setDeletingId(id);
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (!error) {
      setReviews(reviews.filter(r => r.id !== id));
    } else {
      alert("Error: " + error.message);
    }
    setDeletingId(null);
  };

  const filteredReviews = reviews.filter(r => 
    r.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      
  {/* UPDATED HEADER: MATCHING SETTINGS STYLE */}
<div className="mb-8 flex flex-col md:flex-row justify-between items-center md:items-end bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
  <div>
    <div className="flex items-center gap-2 text-slate-400 mb-2">
      <Star size={16} className="text-black " />
      <span className="text-xs font-bold uppercase tracking-widest">Trust Metrics</span>
    </div>
    <h1 className="text-4xl font-[1000] text-black tracking-tight uppercase leading-none">
      Reviews
    </h1>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
      Customer Feedback & Ratings
    </p>
  </div>

  <div className="relative w-full md:w-96 group">
    <Search 
      className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" 
      size={18} 
    />
    <input 
      type="text"
      placeholder="Search email or feedback..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-5 pl-16 pr-8 text-[11px] font-black uppercase tracking-widest focus:bg-white focus:border-slate-100 transition-all outline-none shadow-inner"
    />
  </div>
</div>

      {/* REVIEWS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400">Customer & Rating</th>
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400">Feedback</th>
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400">Product Ref</th>
                <th className="p-8 text-[10px] font-[1000] uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-rose-500" size={30} />
                  </td>
                </tr>
              ) : filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-slate-50/30 transition-all group">
                  {/* Customer Info */}
                  <td className="p-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={12} 
                            className={i < review.rating ? "fill-rose-500 text-rose-500" : "text-slate-200 fill-slate-100"} 
                          />
                        ))}
                      </div>
                      <div className="text-[11px] font-black text-slate-900 flex items-center gap-2">
                        <Mail size={12} className="text-slate-300" />
                        {review.user_email || "Anonymous"}
                      </div>
                    </div>
                  </td>

                  {/* Feedback Text */}
                  <td className="p-8 max-w-md">
                    <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic">
                      "{review.comment || "No written feedback provided."}"
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      <Calendar size={12} />
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Product ID Link */}
                  <td className="p-8">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                      <Package size={12} className="text-rose-500" />
                      ID: {review.product_id?.slice(0, 8)}...
                    </div>
                  </td>

                  {/* Delete Button */}
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => deleteReview(review.id)}
                      disabled={deletingId === review.id}
                      className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all active:scale-90 disabled:opacity-50"
                    >
                      {deletingId === review.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!loading && filteredReviews.length === 0 && (
        <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 mt-6">
           <MessageSquare className="mx-auto text-slate-200 mb-3" size={40} />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">No reviews to moderate</p>
        </div>
      )}
    </div>
  );
}