"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";
import { Plus, X, Upload, Trash2, Edit2, Tag, AlertCircle } from 'lucide-react';

export default function ManageSubCategories() {
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [parentId, setParentId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const fetchData = async () => {
    const { data: subData } = await supabase
      .from('sub_categories')
      .select(`*, categories (name)`)
      .order('created_at', { ascending: false });

    const { data: catData } = await supabase.from('categories').select('id, name');
    
    if (subData) setSubCategories(subData);
    if (catData) setParentCategories(catData);
  };

  useEffect(() => { fetchData(); }, []);

  // Handle Edit Click
  const handleEditClick = (sub: any) => {
    setEditId(sub.id);
    setParentId(sub.category_id);
    setName(sub.name);
    setDescription(sub.description || "");
    setExistingImageUrl(sub.image_url || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setParentId("");
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
      const fileName = `sub-${Date.now()}-${imageFile.name}`;
      const { data: uploadData } = await supabase.storage.from('category-images').upload(fileName, imageFile);
      if (uploadData) {
        const { data: pUrl } = supabase.storage.from('category-images').getPublicUrl(fileName);
        image_url = pUrl.publicUrl;
      }
    }

    const payload = { category_id: parentId, name, description, image_url };

    if (editId) {
      await supabase.from('sub_categories').update(payload).eq('id', editId);
    } else {
      await supabase.from('sub_categories').insert([payload]);
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
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Tag size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Store Hierarchy</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase">Sub-Categories</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} /> Add Sub-Category
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Preview</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Sub-Category</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Parent Category</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {subCategories.map((sub) => (
              <tr key={sub.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={sub.image_url || '/placeholder.png'} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="font-bold text-black text-lg">{sub.name}</p>
                  <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{sub.description}</p>
                </td>
                <td className="px-8 py-5">
                  <span className="px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-tighter">
                    {sub.categories?.name || 'Unlinked'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(sub)} className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-black transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={async () => {
                       if(confirm("Delete this sub-category?")) {
                          await supabase.from('sub_categories').delete().eq('id', sub.id);
                          fetchData();
                       }
                    }} className="p-3 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter">{editId ? 'Edit' : 'New'} Sub-Category</h2>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Parent Category</label>
                  <select 
                    required
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm outline-none appearance-none"
                  >
                    <option value="">Select Parent...</option>
                    {parentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sub-Category Name</label>
                  <input 
                    required
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm outline-none focus:bg-white focus:border-black transition-all"
                    placeholder="e.g. Sling Bags"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    rows={2}
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-medium text-sm outline-none focus:bg-white focus:border-black transition-all resize-none"
                    placeholder="Describe this collection..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Banner Image</label>
                  <div className="relative border border-dashed border-slate-200 rounded-2xl p-4 flex items-center gap-4 bg-slate-50 cursor-pointer">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} />
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center">
                       {imageFile ? <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover"/> : existingImageUrl ? <img src={existingImageUrl} className="w-full h-full object-cover"/> : <Upload size={20} className="text-slate-300"/>}
                    </div>
                    <p className="text-xs font-bold text-slate-500">{imageFile ? imageFile.name : "Choose sub-category image"}</p>
                  </div>
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
                >
                  {loading ? "Processing..." : editId ? "Update Sub-Category" : "Create Sub-Category"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}