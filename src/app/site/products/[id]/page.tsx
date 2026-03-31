"use client";
import React, { useState, useEffect, use } from 'react';
import { supabase } from "../../../../lib/supabase";
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, Heart, Star, Camera, X, Check, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import ProductCard from "../../../components/ProductCard";
import Link from 'next/link';

export default function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [mainImageUrl, setMainImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [allReviews, setAllReviews] = useState<any[]>([]);

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data, error } = await supabase
        .from('products')
        .select(`*, categories(name, id), product_variants(*)`)
        .eq('id', productId)
        .single();

      if (data) {
        setProduct(data);
        setSelectedVariant(data.product_variants?.[0]);
        setMainImageUrl(data.thumbnail_url);

        const { data: related } = await supabase
          .from('products')
          .select(`*, categories(name), product_variants(*)`)
          .eq('category_id', data.category_id)
          .neq('id', productId)
          .limit(4);
        setRelatedProducts(related || []);

        const { data: revs } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });
        setAllReviews(revs || []);

        if (user) {
          const { data: wish } = await supabase.from('wishlist').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
          if (wish) setIsWishlisted(true);
        }
      }
      setLoading(false);
    }
    getData();
  }, [productId]);

  const checkAuth = () => {
    if (!user) {
      toast.error("Authentication Required", { description: "Please login to continue." });
      return false;
    }
    return true;
  };

  const handleWishlist = async () => {
    if (!checkAuth()) return;
    if (isWishlisted) {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', product.id);
      if (!error) { setIsWishlisted(false); toast.info("Removed from wishlist"); }
    } else {
      const { error } = await supabase.from('wishlist').insert([{ product_id: product.id, user_id: user.id }]);
      if (!error) { setIsWishlisted(true); toast.success("Added to wishlist"); }
    }
  };

  const handleCart = async () => {
    if (!checkAuth() || !selectedVariant) return;
    setCartLoading(true);
    const { error } = await supabase.from('cart').insert([{
      product_id: product.id, user_id: user.id, quantity: 1,
      variant_id: selectedVariant.id, size: `${selectedVariant.size}${selectedVariant.unit || ''}`
    }]);
    if (error) toast.error("Error adding to bag");
    else toast.success("Added to Bag");
    setCartLoading(false);
  };

  const handlePostReview = async () => {
    if (!checkAuth()) return;
    if (!reviewComment) return toast.error("Please write a comment");

    setIsSubmittingReview(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of reviewFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const { error } = await supabase.from('reviews').insert([{
        product_id: productId,
        user_id: user.id,
        rating: reviewRating,
        comment: reviewComment,
        images: uploadedUrls
      }]);

      if (error) throw error;
      toast.success("Review Posted Successfully");
      setReviewComment("");
      setReviewFiles([]);
      setReviewRating(5);
      setAllReviews([{
        rating: reviewRating,
        comment: reviewComment,
        images: uploadedUrls,
        created_at: new Date().toISOString()
      }, ...allReviews]);

    } catch (err: any) {
      toast.error(err.message || "Failed to post review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase tracking-widest">Loading Boutique...</div>;

  const mrp = selectedVariant?.mrp || 0;
  const discount = selectedVariant?.discount_percent || 0;
  const finalPrice = mrp - (mrp * discount / 100);
  const isOutOfStock = (selectedVariant?.stock ?? 0) <= 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 relative">

{/* STRICK/FIXED ACTIONS - Stays in position while scrolling */}
<div className="fixed top-48 right-10 z-50 flex flex-col gap-4">
  <Link
    href="/site/products"
    className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-2xl hover:bg-black hover:text-white transition-all group"
  >
    <ArrowLeft size={20} className="text-black group-hover:text-white" />
  </Link>

  <button
    onClick={handleCart}
    className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-2xl hover:bg-black hover:text-white transition-all text-black"
  >
    <ShoppingBag size={20} />
  </button>

  <button
    onClick={handleWishlist}
    className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-2xl hover:bg-rose-50 transition-all"
  >
    <Heart 
      size={20} 
      className={isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-400"} 
    />
  </button>
</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-12">
        <div className="flex flex-col md:flex-row-reverse gap-4">
          <div className="flex-1 aspect-square rounded-[3rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
            <img src={mainImageUrl} className="w-full h-full object-cover" alt={product.name} />
          </div>
          <div className="flex md:flex-col gap-4 md:w-24 overflow-x-auto">
            {[product.thumbnail_url, ...(product.gallery_urls || [])].map((url: string, i: number) => (
              <div key={i} onClick={() => setMainImageUrl(url)} className={`aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all flex-shrink-0 ${mainImageUrl === url ? 'border-black' : 'border-slate-100 opacity-60'}`}>
                <img src={url} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-3">{product.categories?.name}</p>
          <h1 className="text-4xl font-[1000] uppercase tracking-tighter mb-4">{product.name}</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 border-l-2 border-slate-100 pl-6">{product.description}</p>

          <div className="flex items-end gap-4 mb-10">
            <span className="text-4xl font-[1000]">₹{finalPrice.toLocaleString()}</span>
            {discount > 0 && <span className="text-lg font-bold text-slate-300 line-through">₹{mrp.toLocaleString()}</span>}
          </div>

          <div className="mb-10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Select Size</h4>
            <div className="flex flex-wrap gap-3">
              {product.product_variants?.map((v: any) => (
                <button key={v.id} onClick={() => setSelectedVariant(v)}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase border-2 
                    ${selectedVariant?.id === v.id ? 'border-black bg-black text-white' : 'border-slate-100 text-slate-400'}`}>
                  {v.size} {v.unit}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 mb-12">
            <button
              onClick={handleCart}
              disabled={isOutOfStock || cartLoading}
              className="w-full py-5 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:bg-slate-200 transition-all hover:bg-zinc-800"
            >
              {cartLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : isOutOfStock ? 'Notify Me' : 'Buy It Now'}
            </button>
            <button
              onClick={handleCart}
              className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} /> Add to Bag
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-10">
            <div className="text-center"><Truck size={20} className="mx-auto text-slate-400" /><p className="text-[8px] font-black uppercase text-slate-500 mt-2">Free Delivery</p></div>
            <div className="text-center border-x border-slate-100"><RotateCcw size={20} className="mx-auto text-slate-400" /><p className="text-[8px] font-black uppercase text-slate-500 mt-2">Easy Returns</p></div>
            <div className="text-center"><ShieldCheck size={20} className="mx-auto text-slate-400" /><p className="text-[8px] font-black uppercase text-slate-500 mt-2">100% Authentic</p></div>
          </div>
        </div>
      </div>

      {/* 2. COMPACT REVIEW SECTION */}
      <div className="border-t border-slate-100 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="sticky top-24">
              <div className="mb-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-2">Community</h2>
                <h3 className="text-3xl font-[1000] uppercase tracking-tighter text-slate-900">
                  Client <span className="text-slate-300 font-light">Stories</span>
                </h3>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rate Quality</span>
                  <div className="flex gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s} size={16}
                        onClick={() => setReviewRating(s)}
                        className={`cursor-pointer transition-all ${s <= reviewRating ? 'fill-black text-black scale-110' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full h-32 bg-white border border-slate-100 rounded-2xl p-5 text-sm outline-none focus:ring-2 ring-rose-100 transition-all placeholder:text-slate-300 mb-6 resize-none"
                />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <label className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-black transition-all">
                      <Camera size={18} className="text-slate-300" />
                      <input type="file" multiple className="hidden" onChange={(e) => setReviewFiles([...reviewFiles, ...Array.from(e.target.files || [])])} />
                    </label>
                    {reviewFiles.map((file, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-xl border border-slate-200 overflow-hidden">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                        <button onClick={() => setReviewFiles(reviewFiles.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all text-white"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={handlePostReview} disabled={isSubmittingReview} className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-600 disabled:bg-slate-300 transition-all">
                    {isSubmittingReview ? "..." : "Post"}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[550px] overflow-y-auto pr-4 no-scrollbar space-y-6">
              {allReviews.length === 0 ? (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-50 rounded-[2.5rem]">
                  <p className="text-slate-300 text-sm">No reviews yet. Be the first.</p>
                </div>
              ) : (
                allReviews.map((rev, i) => (
                  <div key={i} className="p-8 border border-slate-50 rounded-[2.5rem] bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} size={8} className={idx < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-100"} />
                        ))}
                      </div>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Verified Client</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed font-serif mb-4">"{rev.comment}"</p>
                    {rev.images?.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {rev.images.map((img: string, idx: number) => (
                          <img key={idx} src={img} className="w-12 h-16 object-cover rounded-lg border border-slate-50" alt="Review" />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <div className="mt-2 pt-10 border-t border-slate-100">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-2">Curated for you</p>
              <h2 className="text-3xl font-[1000] uppercase tracking-tighter">You May Also Like</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}