"use client";

import { useState } from "react";
import { FaFilePdf, FaArrowLeft, FaExpand, FaCompress, FaExternalLinkAlt } from "react-icons/fa";

interface Materi {
  id: string;
  judul: string;
  deskripsi: string | null;
  fileUrl: string;
  createdAt: string;
}

export default function PdfViewer({ materiList }: { materiList: Materi[] }) {
  const [activeMateri, setActiveMateri] = useState<Materi | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Perbaiki URL cloudinary & proxy agar PDF tampil inline (tidak auto-download)
  const fixPdfUrl = (url: string) => {
    let fixed = url;
    // Fix resource type path jika salah
    if (fixed.endsWith('.pdf') && fixed.includes('/image/upload/')) {
      fixed = fixed.replace('/image/upload/', '/raw/upload/');
    }
    // Proxy melalui API agar Content-Disposition: inline
    return `/api/pdf-proxy?url=${encodeURIComponent(fixed)}`;
  };

  // === Tampilan Reader Saat PDF Dibuka ===
  if (activeMateri) {
    const pdfUrl = fixPdfUrl(activeMateri.fileUrl);

    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <button 
            onClick={() => { setActiveMateri(null); setIsFullscreen(false); }}
            className="btn btn-secondary shrink-0"
          >
            <FaArrowLeft /> Kembali
          </button>
          <h2 className="text-lg font-bold text-white truncate flex-1 text-center">
            {activeMateri.judul}
          </h2>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn btn-secondary"
              title={isFullscreen ? 'Kecilkan' : 'Perbesar'}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" title="Buka di Tab Baru">
              <FaExternalLinkAlt />
            </a>
          </div>
        </div>
        
        {/* Embedded PDF */}
        <div className={`border border-border rounded-xl overflow-hidden bg-white ${isFullscreen ? 'h-[calc(100vh-100px)]' : 'h-[75vh]'}`}>
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full"
            title={activeMateri.judul}
          />
        </div>
      </div>
    );
  }

  // === Tampilan List (Default Grid) ===
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-white">Materi Pembelajaran</h1>
      <p className="text-gray-400 mb-8">Modul dan referensi PDF yang dipublish oleh pengajar Anda.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materiList.length === 0 ? (
          <div className="col-span-full text-center p-12 border border-dashed border-gray-700 rounded-xl text-gray-500">
             <FaFilePdf className="text-4xl mx-auto mb-4 text-gray-600" />
             <p className="text-lg">Belum ada materi yang tersedia saat ini.</p>
          </div>
        ) : materiList.map((item) => (
          <div key={item.id} className="card flex flex-col justify-between bg-surface/80 hover:border-primary transition-all duration-300 group cursor-pointer" onClick={() => setActiveMateri(item)}>
             <div>
                <div className="flex items-start justify-between mb-4">
                   <div className="p-3 bg-red-500/20 text-red-500 rounded-lg text-2xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <FaFilePdf />
                   </div>
                   <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <h3 className="font-bold text-lg text-white line-clamp-2" title={item.judul}>{item.judul}</h3>
                <p className="text-sm text-gray-400 mt-2 line-clamp-3" title={item.deskripsi || ""}>{item.deskripsi || "Materi pendukung sesi."}</p>
             </div>
             
             <div className="mt-6 border-t border-border pt-4">
                <button className="btn btn-primary w-full justify-center">
                   <FaFilePdf /> Baca Materi
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
