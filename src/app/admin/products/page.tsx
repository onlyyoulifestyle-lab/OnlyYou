"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import {
  Plus, X, Upload, Trash2, Package, Tag, Layers,
  IndianRupee, Edit3, Eye, Search, Filter, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function ProductManager() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewProduct, setViewProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Form State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [innerCategories, setInnerCategories] = useState<any[]>([]);
  const [displaySubs, setDisplaySubs] = useState<any[]>([]);
  const [displayInners, setDisplayInners] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [catId, setCatId] = useState("");
  const [subId, setSubId] = useState("");
  const [innerId, setInnerId] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [variants, setVariants] = useState([{ size: "", mrp: "", stock: "", unit: "ml" }]);

  // --- Fetch Data ---
  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select(`
      *, 
      product_variants(*),
      categories(name),
      sub_categories(name),
      inner_categories(name)
    `).order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
    const fetchSelects = async () => {
      const { data: cat } = await supabase.from('categories').select('id, name');
      const { data: sub } = await supabase.from('sub_categories').select('id, name, category_id');
      const { data: inner } = await supabase.from('inner_categories').select('id, name, sub_category_id');
      if (cat) { setCategories(cat); setSubCategories(sub || []); setInnerCategories(inner || []); }
    };
    fetchSelects();
  }, []);

  useEffect(() => {
    if (catId) setDisplaySubs(subCategories.filter(s => s.category_id === catId));
    else setDisplaySubs([]);
  }, [catId, subCategories]);

  useEffect(() => {
    if (subId) setDisplayInners(innerCategories.filter(i => i.sub_category_id === subId));
    else setDisplayInners([]);
  }, [subId, innerCategories]);

  // --- Handlers ---
  const resetForm = () => {
    setName(""); setDescription(""); setCatId(""); setSubId(""); setInnerId("");
    setGalleryFiles([]); setExistingImages([]);
    setVariants([{ size: "", mrp: "", stock: "", unit: "ml" }]);
    setEditingId(null);
  };

  const startEditing = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description || "");
    setCatId(product.category_id || "");
    setSubId(product.sub_category_id || "");
    setInnerId(product.inner_category_id || "");
    setExistingImages(product.gallery_urls || []);

    if (product.product_variants?.length > 0) {
      setVariants(product.product_variants.map((v: any) => ({
        size: v.size || "",
        mrp: v.mrp?.toString() || "",
        stock: v.stock?.toString() || "",
        unit: v.unit || "ml"
      })));
    }
    setViewProduct(null);
    setShowModal(true);
  };

  const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (err: any) { alert(err.message); }
  };

  const removeExistingImage = (urlToRemove: string) => {
    setExistingImages(existingImages.filter(url => url !== urlToRemove));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalGallery = [...existingImages];

      // Upload new files if any
      if (galleryFiles.length > 0) {
        for (const file of galleryFiles) {
          const path = `products/${Date.now()}-${file.name}`;
          await supabase.storage.from('product-images').upload(path, file);
          const { data } = supabase.storage.from('product-images').getPublicUrl(path);
          finalGallery.push(data.publicUrl);
        }
      }

      const payload = {
        name, description,
        category_id: catId || null,
        sub_category_id: subId || null,
        inner_category_id: innerId || null,
        thumbnail_url: finalGallery[0] || "", // First image as thumbnail
        gallery_urls: finalGallery
      };

      const { data: pData, error } = editingId
        ? await supabase.from('products').update(payload).eq('id', editingId).select().single()
        : await supabase.from('products').insert([payload]).select().single();

      if (error) throw error;

      if (pData) {
        await supabase.from('product_variants').delete().eq('product_id', pData.id);
        const vPayload = variants.map(v => ({
          product_id: pData.id,
          size: v.size,
          mrp: parseFloat(v.mrp) || 0,
          stock: parseInt(v.stock) || 0,
          unit: v.unit
        }));
        await supabase.from('product_variants').insert(vPayload);
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="bg-[#F8FAFC] p-6 lg:p-1">

      {/* HEADER */}
      <div className="flex justify-between items-end mb-10 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Tag size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Store Hierarchy</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase">Products</h1>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
          <Plus size={18} /> Add Product
        </button>
      </div>


      {/* PRODUCT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
          <div key={product.id} onClick={() => setViewProduct(product)} className="group bg-white rounded-[2rem] p-4 border border-slate-100 hover:border-black transition-all cursor-pointer shadow-sm flex flex-col">
            <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-slate-50 relative">
              <img src={product.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />

              {/* Action Buttons Overlay */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={(e) => startEditing(product, e)} className="p-3 bg-white/90 backdrop-blur rounded-xl text-slate-900 hover:bg-black hover:text-white transition-all shadow-md">
                  <Edit3 size={16} />
                </button>
                <button onClick={(e) => handleDeleteProduct(product.id, e)} className="p-3 bg-white/90 backdrop-blur rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-md">
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
            <div className="pt-6 pb-2 space-y-2">
              <h3 className="font-black text-lg uppercase truncate leading-none">{product.name}</h3>
              <p className="text-slate-400 text-xs font-bold line-clamp-1">{product.description || "No description provided."}</p>
              <div className="flex justify-between items-center pt-2">
                <p className="text-xl font-black tracking-tighter text-slate-900"><IndianRupee size={14} className="inline mb-1" />{product.product_variants?.[0]?.mrp || 0}</p>
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${product.product_variants?.[0]?.stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  Stock: {product.product_variants?.[0]?.stock || 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: FORM (ADD/EDIT) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full p-10 overflow-y-auto animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black uppercase">{editingId ? "Edit Product" : "New Arrival"}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X /></button>
            </div>

            <form onSubmit={handlePublish} className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-slate-400">Category Chain</label>
                <div className="grid grid-cols-3 gap-2">
                  <select required value={catId} onChange={e => setCatId(e.target.value)} className="p-4 bg-slate-50 rounded-xl border-none text-[10px] font-black uppercase outline-none">
                    <option value="">Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select required value={subId} onChange={e => setSubId(e.target.value)} className="p-4 bg-slate-50 rounded-xl border-none text-[10px] font-black uppercase outline-none">
                    <option value="">Sub Category</option>
                    {displaySubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={innerId} onChange={e => setInnerId(e.target.value)} className="p-4 bg-slate-50 rounded-xl border-none text-[10px] font-black uppercase outline-none">
                    <option value="">Inner Category</option>
                    {displayInners.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              </div>

              <input required value={name} onChange={e => setName(e.target.value)} placeholder="PRODUCT NAME" className="w-full p-6 bg-slate-50 rounded-2xl border-none font-black text-xl uppercase outline-none" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Full description..." rows={3} className="w-full p-6 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-slate-400">Price & Stock Variants</label>
                  <button type="button" onClick={() => setVariants([...variants, { size: "", mrp: "", stock: "", unit: "ml" }])} className="text-[9px] font-black uppercase bg-black text-white px-4 py-2 rounded-lg">+ Add Variant</button>
                </div>
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2">
                    <input placeholder="Size" className="p-4 bg-slate-50 rounded-xl text-xs font-bold" value={v.size} onChange={e => { const newV = [...variants]; newV[i].size = e.target.value; setVariants(newV); }} />
                    <input placeholder="MRP" className="p-4 bg-slate-50 rounded-xl text-xs font-bold" value={v.mrp} onChange={e => { const newV = [...variants]; newV[i].mrp = e.target.value; setVariants(newV); }} />
                    <input placeholder="Stock" className="p-4 bg-slate-50 rounded-xl text-xs font-bold" value={v.stock} onChange={e => { const newV = [...variants]; newV[i].stock = e.target.value; setVariants(newV); }} />
                    <select className="p-4 bg-slate-50 rounded-xl text-[10px] font-black uppercase" value={v.unit} onChange={e => { const newV = [...variants]; newV[i].unit = e.target.value; setVariants(newV); }}>
                      <option value="ml">ml</option><option value="gm">gm</option><option value="kg">kg</option><option value="pc">pc</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-slate-400">Media Gallery</label>

                {/* Image Previews with Delete Option */}
                {existingImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {existingImages.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 relative group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img)}
                          className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-slate-50 transition-all relative">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setGalleryFiles(Array.from(e.target.files || []))} />
                  <Upload className="mx-auto text-slate-300 mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    {galleryFiles.length > 0 ? `${galleryFiles.length} new files selected` : "Click to upload more photos"}
                  </p>
                </div>
              </div>

              <button disabled={loading} className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest hover:shadow-xl active:scale-[0.98] transition-all">
                {loading ? "Syncing..." : (editingId ? "Save Changes" : "Create Product")}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ... (Keep ViewProduct Modal Same as your code) ... */}


      {/* POPUP: VIEW DETAILS */}
      {viewProduct && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 shadow-2xl h-[90vh] md:h-auto overflow-y-auto">
            <div className="md:w-1/2 h-[400px] md:h-auto bg-slate-100">
              <img src={viewProduct.thumbnail_url} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="md:w-1/2 p-12 relative flex flex-col justify-between">
              <button onClick={() => setViewProduct(null)} className="absolute top-8 right-8 p-3 hover:bg-slate-50 rounded-full transition-all"><X /></button>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{viewProduct.categories?.name}</span>
                  <span className="text-[9px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{viewProduct.sub_categories?.name}</span>
                  {viewProduct.inner_categories?.name && <span className="text-[9px] font-black bg-black text-white px-3 py-1 rounded-full uppercase tracking-widest">{viewProduct.inner_categories?.name}</span>}
                </div>

                <h2 className="text-5xl font-black uppercase leading-none tracking-tighter">{viewProduct.name}</h2>
                <p className="text-slate-500 font-bold text-sm leading-relaxed">{viewProduct.description || "Premium store item."}</p>

                <div className="space-y-4 pt-6">
                  <h4 className="text-xs font-black uppercase text-slate-400 border-b pb-2">Availability & Pricing</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {viewProduct.product_variants?.map((v: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-black text-lg uppercase leading-none">{v.size} {v.unit}</span>
                          <span className={`text-[10px] font-bold mt-1 ${v.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {v.stock > 0 ? `${v.stock} in stock` : 'Out of Stock'}
                          </span>
                        </div>
                        <span className="font-[1000] text-2xl text-slate-900 tracking-tighter"><IndianRupee size={18} className="inline mb-1" />{v.mrp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex gap-4">
                <button onClick={() => startEditing(viewProduct)} className="flex-1 py-5 bg-black text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-zinc-800 transition-all">Modify Listing</button>
                <button onClick={() => setViewProduct(null)} className="px-10 py-5 bg-slate-50 text-slate-400 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:text-black transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}