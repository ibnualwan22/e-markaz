"use client";

import { useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import PdfReader from "@/components/PdfReader";

interface Materi {
  id: string;
  judul: string;
  deskripsi: string | null;
  fileUrl: string;
  createdAt: string;
}

interface UserContext {
  id: string;
  username: string;
  role: string | any;
}

export default function PdfViewer({ materiList, currentUser }: { materiList: Materi[], currentUser: UserContext }) {
  const [activeMateri, setActiveMateri] = useState<Materi | null>(null);

  // === Tampilan Reader Saat PDF Dibuka ===
  if (activeMateri) {
    return (
      <PdfReader 
        activeMateri={activeMateri} 
        currentUser={currentUser} 
        onClose={() => setActiveMateri(null)} 
      />
    );
  }

  // === Tampilan List (Default Grid) ===
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-white">Materi Pembelajaran</h1>
      <p className="text-gray-400 mb-8">Modul dan referensi PDF yang dipublish oleh pengajar Anda. Anda bisa memberi catatan per halaman.</p>

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
                   <FaFilePdf className="mr-2" /> Buka Materi interaktif
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
