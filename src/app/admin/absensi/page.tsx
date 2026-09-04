"use client";

import { useState, useEffect, useRef } from "react";
import { Alert, Toast } from "@/lib/swal";
import { getSesiByProgram, getSantriByProgram, createSesi, saveAbsenSantri, saveAbsenPengajar } from "./actions";
import { FaPlus, FaCheck, FaTimes, FaCamera } from "react-icons/fa";
import { useSession } from "next-auth/react";

export default function ManajemenAbsensi() {
  const { data: userSession } = useSession();
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  
  const [sesiList, setSesiList] = useState<any[]>([]);
  const [santriList, setSantriList] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ judul: "", tanggal: "", nomorSesi: 1 });
  
  const [absensiMap, setAbsensiMap] = useState<Record<string, Record<string, string>>>({}); // sesiId -> santriId -> status
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSesiForUpload, setActiveSesiForUpload] = useState<string>("");

  useEffect(() => {
    fetch("/api/pendaftaran/program").then(r => r.json()).then(setPrograms);
  }, []);

  const loadSesiAndSantri = async (programId: string) => {
    if (!programId) return;
    const [sesiRes, santriRes] = await Promise.all([
      getSesiByProgram(programId),
      getSantriByProgram(programId)
    ]);
    
    setSesiList(sesiRes);
    setSantriList(santriRes);
    
    // Build initial state for absensi
    const map: Record<string, Record<string, string>> = {};
    sesiRes.forEach((s: any) => {
      map[s.id] = {};
      s.absensiSantris.forEach((a: any) => {
        map[s.id][a.santriId] = a.status;
      });
    });
    setAbsensiMap(map);
  };

  useEffect(() => {
    loadSesiAndSantri(selectedProgram);
  }, [selectedProgram]);

  const handleBuatSesi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return Alert.fire('Error', 'Pilih program dulu', 'error');
    
    const res = await createSesi({
      ...formData,
      programId: selectedProgram,
      nomorSesi: Number(formData.nomorSesi)
    });
    
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Sesi berhasil dibuat!' });
      setIsModalOpen(false);
      loadSesiAndSantri(selectedProgram);
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  const updateAbsensiLocal = (sesiId: string, santriId: string, status: string) => {
    setAbsensiMap(prev => ({
      ...prev,
      [sesiId]: {
        ...(prev[sesiId] || {}),
        [santriId]: status
      }
    }));
  };

  const handleSaveAbsensi = async (sesiId: string) => {
    const listToSave = Object.keys(absensiMap[sesiId] || {}).map(santriId => ({
      santriId,
      status: absensiMap[sesiId][santriId]
    }));
    
    if (listToSave.length === 0) return Toast.fire({ icon: 'warning', title: 'Belum ada opsi absensi yang dipilih' });
    
    const res = await saveAbsenSantri(sesiId, listToSave);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Absensi berhasil disimpan!' });
      loadSesiAndSantri(selectedProgram); // re-sync
    } else {
      Alert.fire('Gagal menyimpan', res.error, 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSesiForUpload || !userSession?.user?.id) return;
    
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        const dbRes = await saveAbsenPengajar(activeSesiForUpload, userSession.user.id, data.url);
        if (dbRes.success) {
          Toast.fire({ icon: 'success', title: 'Bukti SS berhasil diupload!' });
          loadSesiAndSantri(selectedProgram);
        } else {
          Alert.fire('Gagal', dbRes.error, 'error');
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      Alert.fire('Error upload', error.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsUploading(false);
      setActiveSesiForUpload("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manajemen Absensi</h1>
        {selectedProgram && (
          <button onClick={() => {
            setFormData({ judul: "", tanggal: "", nomorSesi: sesiList.length + 1 });
            setIsModalOpen(true);
          }} className="btn btn-primary">
            <FaPlus /> Tambah Sesi
          </button>
        )}
      </div>

      <div className="card mb-8">
        <div className="form-group mb-0">
          <label className="form-label">Pilih Program Terlebih Dahulu</label>
          <select 
            className="form-control max-w-md" 
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
          >
            <option value="">-- Pilih Program --</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedProgram && sesiList.length === 0 && (
        <div className="text-center p-8 border border-dashed border-gray-700 rounded-lg text-gray-500">
          Belum ada sesi di program ini. Klik "Tambah Sesi" untuk memulai absensi.
        </div>
      )}

      {selectedProgram && sesiList.length > 0 && (
        <div className="space-y-8">
           {sesiList.map(sesi => (
             <div key={sesi.id} className="card bg-surface/50">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-border">
                 <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">Sesi {sesi.nomorSesi}</span>
                     {sesi.judul}
                   </h2>
                   <p className="text-gray-400 mt-1">{new Date(sesi.tanggal).toLocaleDateString('id-ID')}</p>
                 </div>
                 
                 <div className="mt-4 md:mt-0 flex gap-2">
                   <button onClick={() => {
                     setActiveSesiForUpload(sesi.id);
                     fileInputRef.current?.click();
                   }} disabled={isUploading} className="btn bg-gray-800 text-gray-300 hover:text-white">
                     <FaCamera /> {isUploading && activeSesiForUpload === sesi.id ? "Mengupload..." : "Upload SS Pengajar"}
                   </button>
                   <button onClick={() => handleSaveAbsensi(sesi.id)} className="btn btn-primary">
                     <FaCheck /> Simpan Absensi Santri
                   </button>
                 </div>
               </div>
               
               <div className="mb-4">
                  {sesi.absensiPengajars.length > 0 ? (
                    <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg flex items-center gap-4 text-sm text-green-400 mb-4">
                      <FaCheck /> Pengajar sudah upload Screenshot. (<a href={sesi.absensiPengajars[0].screenshotUrl} target="_blank" className="underline hover:text-white">Lihat SS</a>) (Validasi: {sesi.absensiPengajars[0].statusValidasi})
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg text-sm text-yellow-500 mb-4">
                      ⚠ Pengajar belum mengupload screenhot sesi ini.
                    </div>
                  )}
               </div>

               <div className="table-wrapper">
                 <table>
                   <thead>
                     <tr>
                       <th>No</th>
                       <th>Nama Santri</th>
                       <th>Status Absensi</th>
                     </tr>
                   </thead>
                   <tbody>
                     {santriList.length === 0 ? (
                       <tr><td colSpan={3} className="text-center">Tidak ada santri di program ini</td></tr>
                     ) : (
                       santriList.map((santri, idx) => {
                         const currentStatus = absensiMap[sesi.id]?.[santri.id] || "ALPA";
                         return (
                           <tr key={santri.id}>
                             <td>{idx + 1}</td>
                             <td className="font-medium text-white">{santri.pendaftaran.namaLengkap}</td>
                             <td>
                               <select 
                                 className={`p-2 rounded text-sm font-semibold border border-transparent outline-none ${
                                   currentStatus === "HADIR" ? "bg-green-500/20 text-green-500" : 
                                   currentStatus === "ALPA" ? "bg-red-500/20 text-red-500" : 
                                   "bg-yellow-500/20 text-yellow-500"
                                 }`}
                                 value={currentStatus}
                                 onChange={(e) => updateAbsensiLocal(sesi.id, santri.id, e.target.value)}
                               >
                                 <option value="HADIR" className="bg-surface text-white">HADIR</option>
                                 <option value="ALPA" className="bg-surface text-white">ALPA (TIDAK MASUK)</option>
                                 <option value="IZIN" className="bg-surface text-white">IZIN</option>
                                 <option value="SAKIT" className="bg-surface text-white">SAKIT</option>
                               </select>
                             </td>
                           </tr>
                         )
                       })
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
           ))}
        </div>
      )}

      {/* Hidden file input target */}
      <input 
        type="file" 
        accept="image/*,application/pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold mb-4">Buat Sesi Baru</h3>
            <form onSubmit={handleBuatSesi} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nomor Sesi (Otomatis)</label>
                <input type="number" readOnly value={formData.nomorSesi} className="form-control bg-gray-800" />
              </div>
              <div className="form-group">
                <label className="form-label">Judul / Materi Pertemuan</label>
                <input type="text" placeholder="Contoh: Pengenalan Huruf" required value={formData.judul} onChange={(e) => setFormData({...formData, judul: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Pelaksanaan</label>
                <input type="date" required value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} className="form-control" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Sesi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
