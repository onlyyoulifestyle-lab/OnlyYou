"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { Plus, X, Upload, Trash2, Edit2, ChevronRight, Bookmark, ImageIcon } from 'lucide-react';

export default function ManageInnerCategories() {
  const [innerCategories, setInnerCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [subCatId, setSubCatId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const fetchData = async () => {
    const { data: innerData } = await supabase
      .from('inner_categories')
      .select(`*, sub_categories (id, name, category_id, categories (name))`)
      .order('created_at', { ascending: false });

    const { data: catData } = await supabase.from('categories').select('id, name');
    const { data: subData } = await supabase.from('sub_categories').select('id, name, category_id');
    
    if (innerData) setInnerCategories(innerData);
    if (catData) setCategories(catData);
    if (subData) setSubCategories(subData);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedCatId) {
      setFilteredSubs(subCategories.filter(s => s.category_id === selectedCatId));
    } else {
      setFilteredSubs([]);
    }
  }, [selectedCatId, subCategories]);

  const handleEdit = (inner: any) => {
    setEditId(inner.id);
    setSelectedCatId(inner.sub_categories?.category_id || "");
    setSubCatId(inner.sub_category_id);
    setName(inner.name);
    setDescription(inner.description || "");
    setExistingImageUrl(inner.image_url || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setSelectedCatId("");
    setSubCatId("");
    setName("");
    setDescription("");
    setImageFile(null);
    setExistingImageUrl("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let image_url = existingImageUrl;

    if (imageFile) {
      const fileName = `inner-${Date.now()}-${imageFile.name}`;
      const { data: uploadData } = await supabase.storage.from('category-images').upload(fileName, imageFile);
      if (uploadData) {
        const { data: pUrl } = supabase.storage.from('category-images').getPublicUrl(fileName);
        image_url = pUrl.publicUrl;
      }
    }

    const payload = { sub_category_id: subCatId, name, description, image_url };

    if (editId) {
      await supabase.from('inner_categories').update(payload).eq('id', editId);
    } else {
      await supabase.from('inner_categories').insert([payload]);
    }

    setLoading(false);
    closeModal();
    fetchData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-end bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2 font-bold uppercase text-[10px] tracking-widest">
            <Bookmark size={14} /> Micro-Classification
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase">Inner Categories</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
          <Plus size={20} /> Add Inner Level
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Preview</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Structure</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Name</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {innerCategories.map((inner) => (
              <tr key={inner.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                   <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                      <img src={inner.image_url || "/placeholder.png"} className="w-full h-full object-cover" alt="" />
                   </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-slate-400">{inner.sub_categories?.categories?.name}</span>
                    <ChevronRight size={10} className="text-slate-300" />
                    <span className="text-black">{inner.sub_categories?.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="font-black text-black uppercase tracking-tight">{inner.name}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{inner.description}</p>
                </td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => handleEdit(inner)} className="p-2 text-slate-300 hover:text-black transition-colors"><Edit2 size={16} /></button>
                  <button onClick={async () => {
                    if(confirm("Delete this?")) {
                      await supabase.from('inner_categories').delete().eq('id', inner.id);
                      fetchData();
                    }
                  }} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black uppercase tracking-tighter">{editId ? 'Edit' : 'New'} Inner Category</h2>
               <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Parent Category</label>
                <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm outline-none">
                  <option value="">Select Category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sub-Category</label>
                <select required value={subCatId} onChange={(e) => setSubCatId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm outline-none">
                  <option value="">Select Sub-Category...</option>
                  {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Inner Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm outline-none" placeholder="e.g. Matte Liquid" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-medium text-sm outline-none" placeholder="Describe this specific type..." />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Thumbnail Image</label>
                <div className="relative group border-2 border-dashed border-slate-100 rounded-2xl p-4 flex items-center gap-4 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} />
                   <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                      {imageFile ? <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" /> : existingImageUrl ? <img src={existingImageUrl} className="w-full h-full object-cover" /> : <Upload size={20} className="text-slate-300" />}
                   </div>
                   <p className="text-[11px] font-bold text-slate-500">{imageFile ? imageFile.name : "Click to upload image"}</p>
                </div>
              </div>

              <button disabled={loading} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-zinc-800 transition-all active:scale-95">
                {loading ? "Processing..." : editId ? "Update Inner Category" : "Create Inner Category"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}