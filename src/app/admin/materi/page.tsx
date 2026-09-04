"use client";

import { useState, useEffect, useRef } from "react";
import { Alert, Toast } from "@/lib/swal";
import { getMateri, saveMateri, deleteMateri } from "./actions";
import { FaTrash, FaPlus, FaCheck, FaTimes, FaFilePdf, FaUpload, FaEye } from "react-icons/fa";
import { useSession } from "next-auth/react";
import PdfReader from "@/components/PdfReader";

export default function ManajemenMateri() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [data, setData] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ id: "", judul: "", deskripsi: "", fileUrl: "", isPublished: true });
  const [activeViewingMateri, setActiveViewingMateri] = useState<any>(null);
  
  const { data: session } = useSession();
  const currentUser = session?.user ? {
    id: session.user.id || "",
    username: session.user.name || "Admin",
    role: session.user.role || "ADMIN"
  } : null;

  useEffect(() => {
    fetch("/api/pendaftaran/program").then(r => r.json()).then(setPrograms);
  }, []);

  const loadMateri = async (programId: string) => {
    if (!programId) return;
    const res = await getMateri(programId);
    setData(res);
  };

  useEffect(() => {
    loadMateri(selectedProgram);
  }, [selectedProgram]);

  const openModal = (item?: any) => {
    if (item) {
      setFormData({
        id: item.id,
        judul: item.judul,
        deskripsi: item.deskripsi || "",
        fileUrl: item.fileUrl,
        isPublished: item.isPublished
      });
    } else {
      setFormData({ id: "", judul: "", deskripsi: "", fileUrl: "", isPublished: true });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const up = await res.json();
      if (up.url) {
        setFormData(prev => ({ ...prev, fileUrl: up.url }));
        Toast.fire({ icon: 'success', title: 'File siap disimpan!' });
      } else {
        throw new Error(up.error);
      }
    } catch (error: any) {
      Alert.fire('Error upload', error.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileUrl) return Alert.fire('Validasi', 'Anda harus mengupload file PDF materi', 'warning');
    if (!selectedProgram) return;

    const { id, ...dataToSave } = formData;
    const res = await saveMateri(id ? id : null, { ...dataToSave, programId: selectedProgram });
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Materi berhasil disimpan' });
      setIsModalOpen(false);
      loadMateri(selectedProgram);
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Alert.fire({
      title: 'Hapus Materi?',
      text: "Modul/materi yang dihapus tidak bisa dikembalikan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!'
    });
    
    if (confirm.isConfirmed) {
      const res = await deleteMateri(id);
      if (res.success) {
        Toast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
        loadMateri(selectedProgram);
      } else {
        Alert.fire('Gagal', res.error, 'error');
      }
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const item = data.find(m => m.id === id);
    if (!item) return;
    const res = await saveMateri(id, {
       judul: item.judul, 
       deskripsi: item.deskripsi, 
       fileUrl: item.fileUrl, 
       programId: item.programId, 
       isPublished: !currentStatus 
    });
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Status diperbarui' });
      loadMateri(selectedProgram);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manajemen Materi (PDF)</h1>
        {selectedProgram && (
           <button onClick={() => openModal()} className="btn btn-primary">
             <FaPlus /> Tambah Materi
           </button>
        )}
      </div>

      <div className="card mb-8">
        <div className="form-group mb-0">
          <label className="form-label">Pilih Program</label>
          <select 
            className="form-control max-w-md" 
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
          >
            <option value="">-- Pilih Program --</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
        </div>
      </div>

      {selectedProgram && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.length === 0 ? (
            <div className="col-span-full text-center p-8 border border-dashed border-gray-700 rounded-lg text-gray-500">
               Belum ada materi untuk program ini.
            </div>
          ) : data.map(item => (
            <div key={item.id} className="card flex flex-col justify-between">
               <div>
                  <div className="flex items-start justify-between mb-4">
                     <div className="p-3 bg-red-500/20 text-red-500 rounded-lg text-2xl">
                        <FaFilePdf />
                     </div>
                     <button onClick={() => handleToggle(item.id, item.isPublished)} className={`text-xs px-2 py-1 rounded-full border ${item.isPublished ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}`}>
                        {item.isPublished ? 'Published' : 'Draft'}
                     </button>
                  </div>
                  <h3 className="font-bold text-lg text-white line-clamp-2" title={item.judul}>{item.judul}</h3>
                  <p className="text-sm text-gray-400 mt-2 line-clamp-3" title={item.deskripsi}>{item.deskripsi || "Tidak ada deskripsi."}</p>
               </div>
               
               <div className="mt-6 flex justify-between border-t border-border pt-4">
                  <button onClick={() => setActiveViewingMateri({
                      id: item.id,
                      judul: item.judul,
                      deskripsi: item.deskripsi,
                      fileUrl: item.fileUrl,
                      createdAt: item.createdAt
                    })} 
                    className="btn bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 py-2">
                     <FaEye /> Lihat modul
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="btn bg-red-500/10 text-red-500 hover:bg-red-500/20 py-2 !px-3">
                     <FaTrash />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit' : 'Tambah'} Materi PDF</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Judul Materi / Topik</label>
                <input type="text" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} required className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi Singkat</label>
                <textarea value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="form-control"></textarea>
              </div>
              
              <div className="form-group">
                <label className="form-label">File PDF</label>
                {!formData.fileUrl ? (
                  <div className="border-2 border-dashed border-gray-700 p-4text-center rounded-lg relative overflow-hidden">
                     <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
                     <div className="p-6 text-center">
                        <FaUpload className="mx-auto text-2xl text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500">{isUploading ? 'Mengunggah ke Cloudinary...' : 'Klik atau seret file PDF ke sini'}</p>
                     </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-green-500/10 border border-green-500/30 p-3 rounded text-sm text-green-400">
                     <span><FaCheck className="inline mr-2" /> File siap</span>
                     <button type="button" onClick={() => setFormData({...formData, fileUrl: ""})} className="text-red-400 hover:underline">Hapus / Ganti</button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                 <input type="checkbox" id="isPublished" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="w-4 h-4 rounded bg-gray-800 border-gray-700" />
                 <label htmlFor="isPublished" className="text-sm text-gray-300">Tampilkan / Publish ke Santri saat ini juga</label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" disabled={isUploading} className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeViewingMateri && (
        <PdfReader
          activeMateri={activeViewingMateri}
          currentUser={currentUser}
          onClose={() => setActiveViewingMateri(null)}
          readOnly={false}
        />
      )}
    </div>
  );
}
