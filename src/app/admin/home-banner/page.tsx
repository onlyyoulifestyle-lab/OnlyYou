"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { 
  Plus, X, Upload, Trash2, Edit3, Save, 
  ImageIcon, Type, AlignLeft, Loader2, Image as LucideImage 
} from 'lucide-react';

export default function MultiBannerManager() {
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // --- Form State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('home_banner')
      .select('*')
      .order('created_at', { ascending: false }); // Now works with the SQL fix above
    
    if (error) {
      console.error("Supabase Error:", error.message);
      return;
    }
    
    if (data) {
      setBanners(data);
      console.log("Banners loaded:", data);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setImageFile(null);
    setPreviewUrl("");
  };

  const handleEdit = (banner: any) => {
    setEditingId(banner.id);
    setTitle(banner.title);
    setDescription(banner.description);
    setPreviewUrl(banner.image_url);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await supabase.from('home_banner').delete().eq('id', id);
    fetchBanners();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalUrl = previewUrl;

      if (imageFile) {
        const path = `banners/${Date.now()}`;
        await supabase.storage.from('product-images').upload(path, imageFile);
        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        finalUrl = data.publicUrl;
      }

      const payload = { title, description, image_url: finalUrl };

      if (editingId) {
        await supabase.from('home_banner').update(payload).eq('id', editingId);
      } else {
        await supabase.from('home_banner').insert([payload]);
      }

      setShowModal(false);
      resetForm();
      fetchBanners();
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <LucideImage size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Slider Management</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase">Home Banners</h1>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
          <Plus size={18} /> Add New Banner
        </button>
      </div>

      {/* BANNER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="group bg-white rounded-[2.5rem] p-4 border border-slate-100 hover:border-black transition-all shadow-sm">
            <div className="aspect-[21/9] rounded-[1.8rem] overflow-hidden bg-slate-100 relative">
              <img src={banner.image_url} className="w-full h-full object-cover" alt="" />
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => handleEdit(banner)} className="p-3 bg-white/90 backdrop-blur rounded-xl text-black hover:bg-black hover:text-white transition-all shadow-md">
                  <Edit3 size={16}/>
                </button>
                <button onClick={() => handleDelete(banner.id)} className="p-3 bg-white/90 backdrop-blur rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-md">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-black text-lg uppercase truncate">{banner.title}</h3>
              <p className="text-slate-400 text-xs font-bold line-clamp-1">{banner.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADD/EDIT */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white h-full p-10 overflow-y-auto animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black uppercase">{editingId ? "Edit Banner" : "New Banner"}</h2>
              <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X/></button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div 
                className="relative aspect-[21/9] bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center group cursor-pointer"
                onClick={() => document.getElementById('banner-upload')?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto text-slate-300 mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase">Upload Image</p>
                  </div>
                )}
                <input id="banner-upload" type="file" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                }} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Banner Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-lg uppercase outline-none focus:ring-2 ring-black/5" placeholder="DISPLAY TITLE" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-sm outline-none" placeholder="Small description..." />
              </div>

              <button disabled={loading} className="w-full py-6 bg-black text-white rounded-[2rem] font-[1000] uppercase tracking-widest hover:shadow-xl transition-all">
                {loading ? "Saving..." : (editingId ? "Update Banner" : "Create Banner")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}