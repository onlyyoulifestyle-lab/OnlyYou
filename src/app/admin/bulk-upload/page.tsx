"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../../../lib/supabase";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Info, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export default function ProductBulkUpload() {
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dictionaries to map names from Excel to DB IDs
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [subMap, setSubMap] = useState<Record<string, string>>({});
  const [innerMap, setInnerMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch categories on load to build lookup tables
    const fetchCategories = async () => {
      const { data: cat } = await supabase.from('categories').select('id, name');
      const { data: sub } = await supabase.from('sub_categories').select('id, name');
      const { data: inner } = await supabase.from('inner_categories').select('id, name');

      if (cat) setCatMap(Object.fromEntries(cat.map(c => [c.name.trim().toLowerCase(), c.id])));
      if (sub) setSubMap(Object.fromEntries(sub.map(s => [s.name.trim().toLowerCase(), s.id])));
      if (inner) setInnerMap(Object.fromEntries(inner.map(i => [i.name.trim().toLowerCase(), i.id])));
    };
    fetchCategories();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus({ type: 'idle', message: '' });
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;

        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        if (!ws || !ws['!ref']) {
          setStatus({ type: 'error', message: 'Excel sheet appears to be empty.' });
          return;
        }

        const range = XLSX.utils.decode_range(ws['!ref']);
        const headerRow = range.s.r;
        const headers: Record<number, string> = {};
        for (let c = range.s.c; c <= range.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r: headerRow, c });
          if (ws[addr]) headers[c] = ws[addr].v;
        }

        let imageHeaderKey: string | null = null;
        Object.values(headers).forEach((h) => {
          if (typeof h === 'string' && h.toLowerCase().includes('image')) {
            imageHeaderKey = h;
          }
        });

        const data: any[] = [];
        for (let r = headerRow + 1; r <= range.e.r; r++) {
          const rowObj: any = {};
          let hasData = false;
          for (let c = range.s.c; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[addr];
            const key = headers[c];
            if (!key) continue;
            let value = cell?.v;
            if ((value === undefined || value === null || value === '') && cell?.l?.Target) {
              value = cell.l.Target;
            }
            if (value !== undefined) {
              rowObj[key] = value;
              hasData = true;
            }
          }
          if (hasData) {
            rowObj._rowIndex = r;
            data.push(rowObj);
          }
        }

        const rowToImage: Record<number, { blob: Blob; ext: string }> = {};
        try {
          const zip = await JSZip.loadAsync(arrayBuffer);
          const drawingFile = zip.file('xl/drawings/drawing1.xml');
          const relsFile = zip.file('xl/drawings/_rels/drawing1.xml.rels');

          if (drawingFile && relsFile) {
            const drawingXml = await drawingFile.async('string');
            const relsXml = await relsFile.async('string');
            const parser = new DOMParser();
            const drawingDoc = parser.parseFromString(drawingXml, 'text/xml');
            const relsDoc = parser.parseFromString(relsXml, 'text/xml');

            const getByLocalName = (node: any, localName: string): any[] => {
              const all = node.getElementsByTagName('*');
              const results: any[] = [];
              for (let i = 0; i < all.length; i++) {
                const tag = all[i].tagName || all[i].nodeName || '';
                const local = tag.includes(':') ? tag.split(':')[1] : tag;
                if (local === localName) results.push(all[i]);
              }
              return results;
            };
            const getAttrLocal = (node: any, localName: string): string | null => {
              const attrs = node.attributes;
              for (let i = 0; i < attrs.length; i++) {
                const name = attrs[i].name || attrs[i].nodeName || '';
                const local = name.includes(':') ? name.split(':')[1] : name;
                if (local === localName) return attrs[i].value;
              }
              return null;
            };
            const resolveMediaPath = (target: string): string => {
              let t = target.replace(/^\.\.\//, '').replace(/^\//, '');
              if (!t.startsWith('xl/')) t = 'xl/' + t;
              return t;
            };

            const relMap: Record<string, string> = {};
            const relNodes = relsDoc.getElementsByTagName('Relationship');
            for (let i = 0; i < relNodes.length; i++) {
              const node = relNodes[i];
              relMap[node.getAttribute('Id') || ''] = node.getAttribute('Target') || '';
            }

            const anchors = [
              ...getByLocalName(drawingDoc, 'twoCellAnchor'),
              ...getByLocalName(drawingDoc, 'oneCellAnchor'),
            ];

            for (const anchor of anchors) {
              const fromEl = getByLocalName(anchor, 'from')[0];
              const rowEl = fromEl ? getByLocalName(fromEl, 'row')[0] : null;
              if (!rowEl) continue;
              const fromRow = parseInt(rowEl.textContent || '0');
              const blip = getByLocalName(anchor, 'blip')[0];
              if (!blip) continue;
              const rId = getAttrLocal(blip, 'embed');
              if (!rId) continue;
              const target = relMap[rId];
              if (!target) continue;
              const mediaPath = resolveMediaPath(target);
              const mediaFile = zip.file(mediaPath);
              if (!mediaFile) continue;
              const blob = await mediaFile.async('blob');
              const ext = mediaPath.split('.').pop() || 'png';
              rowToImage[fromRow] = { blob, ext };
            }
          }
        } catch (imgErr) {
          console.warn('No embedded images found or failed to parse drawings:', imgErr);
        }

        const groupedProducts: Record<string, any> = {};

        data.forEach((row: any) => {
          const name = row['Product Name'];
          if (!name) return;

          const linkedImage = (imageHeaderKey && row[imageHeaderKey]) || null;
          const embeddedImage = rowToImage[row._rowIndex] || null;

          if (!groupedProducts[name]) {
            groupedProducts[name] = {
              name: row['Product Name'],
              description: row['Description'] || '',
              category_name: row['Category'] || '',
              sub_category_name: row['Sub Category'] || '',
              inner_category_name: row['Inner Category'] || '',
              thumbnail_url: linkedImage || null,
              _imageBlob: !linkedImage && embeddedImage ? embeddedImage.blob : null,
              _imageExt: !linkedImage && embeddedImage ? embeddedImage.ext : null,
              _previewUrl: linkedImage || (embeddedImage ? URL.createObjectURL(embeddedImage.blob) : null),
              is_active: row['Is Active']?.toString().toLowerCase() !== 'false',
              variants: []
            };
          } else if (!groupedProducts[name].thumbnail_url && !groupedProducts[name]._imageBlob) {
            if (linkedImage) {
              groupedProducts[name].thumbnail_url = linkedImage;
              groupedProducts[name]._previewUrl = linkedImage;
            } else if (embeddedImage) {
              groupedProducts[name]._imageBlob = embeddedImage.blob;
              groupedProducts[name]._imageExt = embeddedImage.ext;
              groupedProducts[name]._previewUrl = URL.createObjectURL(embeddedImage.blob);
            }
          }

          if (row['Variant Size'] || row['Variant MRP']) {
            groupedProducts[name].variants.push({
              size: row['Variant Size']?.toString() || '',
              mrp: parseFloat(row['Variant MRP']) || 0,
              stock: parseInt(row['Variant Stock']) || 0,
              unit: row['Variant Unit']?.toString().toLowerCase() || 'ml'
            });
          }
        });

        setParsedData(Object.values(groupedProducts));
      } catch (error) {
        console.error(error);
        setStatus({ type: 'error', message: 'Failed to parse Excel file. Please check the format.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processUpload = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      for (const product of parsedData) {
        const category_id = catMap[product.category_name.trim().toLowerCase()] || null;
        const sub_category_id = subMap[product.sub_category_name.trim().toLowerCase()] || null;
        const inner_category_id = innerMap[product.inner_category_name.trim().toLowerCase()] || null;

        let finalThumbnailUrl: string | null = product.thumbnail_url || null;

        if (!finalThumbnailUrl && product._imageBlob) {
          const safeName = product.name.replace(/[^a-zA-Z0-9]+/g, '-');
          const path = `products/${Date.now()}-${safeName}.${product._imageExt || 'png'}`;
          const { error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(path, product._imageBlob);
          if (uploadErr) throw uploadErr;
          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path);
          finalThumbnailUrl = publicUrlData.publicUrl;
        }

        const { data: pData, error: pError } = await supabase
          .from('products')
          .insert([{
            name: product.name,
            description: product.description,
            category_id,
            sub_category_id,
            inner_category_id,
            thumbnail_url: finalThumbnailUrl,
            gallery_urls: finalThumbnailUrl ? [finalThumbnailUrl] : [],
            is_active: product.is_active
          }])
          .select()
          .single();

        if (pError) throw pError;

        if (pData && product.variants.length > 0) {
          const variantsPayload = product.variants.map((v: any) => ({
            product_id: pData.id,
            size: v.size,
            mrp: v.mrp,
            stock: v.stock,
            unit: v.unit
          }));

          const { error: vError } = await supabase.from('product_variants').insert(variantsPayload);
          if (vError) throw vError;
        }
      }

      setStatus({ type: 'success', message: `Successfully uploaded ${parsedData.length} products with their variants.` });
      setParsedData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: `Upload failed: ${error.message}` });
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#F8FAFC] p-6 lg:p-10 min-h-screen">
      {/* HEADER */}
      <div className="mb-10 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase">Bulk Upload</h1>
          <p className="text-slate-400 font-bold mt-2 text-sm">Upload multiple products and variants via Excel.</p>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Sample Product Bulk Upload
          </span>
          <a 
            href="/samples.xlsx"
            download
            className="flex items-center gap-2 bg-slate-50 hover:bg-black hover:text-white text-slate-600 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-200 transition-all shrink-0"
          >
            <Download size={16} /> Download Sample
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* UPLOAD AREA */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <label className="border-2 border-dashed border-slate-300 hover:border-black rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 group">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
              />
              <FileSpreadsheet size={48} className="text-slate-300 group-hover:text-black transition-colors mb-4" />
              <span className="font-black uppercase text-sm tracking-wider">Select Excel File</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-2">.xlsx or .csv</span>
            </label>

            {parsedData.length > 0 && (
              <button 
                onClick={processUpload}
                disabled={loading}
                className="w-full mt-6 bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 transition-all"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Upload size={16} /> Start Upload</>}
              </button>
            )}

            {status.message && (
              <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 text-sm font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                <p>{status.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW AREA */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black uppercase tracking-wider text-sm text-slate-800">Data Preview</h3>
              <span className="text-[10px] font-black uppercase bg-black text-white px-3 py-1 rounded-full">
                {parsedData.length} Products Found
              </span>
            </div>
            
            <div className="p-6 overflow-x-auto">
              {parsedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                  <FileSpreadsheet size={48} className="mb-4 opacity-50" />
                  <p className="font-bold text-sm uppercase tracking-wider">No data loaded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parsedData.map((product, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          {product._previewUrl ? (
                            <img src={product._previewUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
                              <AlertCircle size={16} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-black text-lg uppercase leading-none text-black">{product.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                              {product.category_name} {product.sub_category_name && `> ${product.sub_category_name}`}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${product.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      {product.variants.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {product.variants.map((v: any, vIdx: number) => (
                            <div key={vIdx} className="bg-white border border-slate-100 p-3 rounded-xl flex justify-between items-center shadow-sm">
                              <span className="font-bold text-xs uppercase">{v.size} {v.unit}</span>
                              <div className="text-right">
                                <p className="font-black text-sm leading-none">₹{v.mrp}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Stock: {v.stock}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}