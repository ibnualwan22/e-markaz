"use client";

import { useState, useEffect } from "react";
import { Toast, Alert } from "@/lib/swal";
import { FaCheck, FaTrash, FaPlus, FaVideo, FaPlayCircle } from "react-icons/fa";
import { saveZoomUrl, addRekamanSesi, deleteRekamanSesi, getProgramDetailForZoom } from "./actions";

export default function ZoomRekamanAdmin() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [programData, setProgramData] = useState<any>(null);

  // States for Zoom
  const [zoomUrl, setZoomUrl] = useState<string>("");
  
  // States for adding Rekaman
  const [activeSesiId, setActiveSesiId] = useState<string>("");
  const [newRekamanUrl, setNewRekamanUrl] = useState<string>("");
  const [newRekamanJudul, setNewRekamanJudul] = useState<string>("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/pendaftaran/program");
      const progData = await res.json();
      setPrograms(progData);
    } catch (e) {}
  };

  const fetchProgramDetail = async (progId: string) => {
    try {
      const res = await getProgramDetailForZoom(progId);
      if (res.success && res.data) {
        setProgramData(res.data);
        setZoomUrl(res.data.zoomUrl || "");
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProgramId) {
      fetchProgramDetail(selectedProgramId);
    } else {
      setProgramData(null);
    }
  }, [selectedProgramId]);

  const handleSaveZoom = async () => {
    if (!selectedProgramId) return;
    const res = await saveZoomUrl(selectedProgramId, zoomUrl);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'URL Zoom kelas berhasil disimpan!' });
    } else {
      Alert.fire('Error', res.error, 'error');
    }
  };

  const handleAddRekaman = async (sesiId: string) => {
    if (!newRekamanUrl || !newRekamanJudul) {
      return Alert.fire('Validasi', 'Judul dan URL rekaman tidak boleh kosong!', 'warning');
    }
    const res = await addRekamanSesi(sesiId, newRekamanJudul, newRekamanUrl);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Rekaman sesi berhasil ditambahkan!' });
      setNewRekamanUrl("");
      setNewRekamanJudul("");
      setActiveSesiId("");
      fetchProgramDetail(selectedProgramId); // refresh
    } else {
      Alert.fire('Error', res.error, 'error');
    }
  };

  const handleDeleteRekaman = async (rekamanId: string) => {
    const confirm = await Alert.fire({
      title: 'Hapus Rekaman?',
      text: 'Aksi ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus'
    });
    if (confirm.isConfirmed) {
      const res = await deleteRekamanSesi(rekamanId);
      if (res.success) {
        Toast.fire({ icon: 'success', title: 'Rekaman dihapus.' });
        fetchProgramDetail(selectedProgramId); // refresh
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Manajemen Zoom & Rekaman</h1>
          <p className="text-gray-400">Atur Link Zoom kelas dan daftar Rekaman pertemuan di setiap sesi.</p>
        </div>
      </div>

      <div className="card mb-8 max-w-xl">
        <div className="form-group mb-0">
          <label className="form-label">Pilih Program Terlebih Dahulu</label>
          <select 
            className="form-control" 
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
          >
            <option value="">-- Pilih Program --</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {programData && (
        <div className="space-y-8">
          <div className="card bg-blue-900/10 border-blue-500/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaVideo className="text-blue-400" /> Link Zoom Kelas ({programData.nama})
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="url" 
                className="form-control flex-1" 
                placeholder="https://zoom.us/j/123456789" 
                value={zoomUrl}
                onChange={(e) => setZoomUrl(e.target.value)}
              />
              <button onClick={handleSaveZoom} className="btn btn-primary shrink-0">
                <FaCheck /> Simpan Zoom
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">* Link Zoom ini hanya perlu disetting 1 kali per program. Akan selalu muncul otomatis di portal santri.</p>
          </div>

          <div>
             <h2 className="text-xl font-bold text-white mb-4">Rekaman per Sesi Pertemuan</h2>
             {programData.sesiAbsensis?.length === 0 ? (
               <div className="text-center p-8 bg-surface border border-dashed border-gray-700 rounded-lg text-gray-500">
                 Belum ada sesi di program ini. Sesi dibuat otomatis via menu Manajemen Absensi.
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {programData.sesiAbsensis?.map((sesi: any) => (
                   <div key={sesi.id} className="card bg-surface/50 p-5">
                      <div className="mb-4 pb-3 border-b border-border">
                        <div className="font-bold text-white text-lg">Sesi {sesi.nomorSesi}: {sesi.judul}</div>
                        <div className="text-sm text-gray-400">{new Date(sesi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>

                      {sesi.rekamanSesis?.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {sesi.rekamanSesis.map((rek: any) => (
                             <div key={rek.id} className="flex items-center justify-between p-2 bg-black/20 rounded border border-border">
                               <a href={rek.url} target="_blank" className="flex items-center gap-2 text-primary hover:underline text-sm font-semibold flex-1 truncate pr-4">
                                 <FaPlayCircle /> {rek.judul}
                               </a>
                               <button onClick={() => handleDeleteRekaman(rek.id)} className="text-red-400 p-1.5 hover:text-red-500 hover:bg-red-500/10 rounded">
                                 <FaTrash size={12} />
                               </button>
                             </div>
                          ))}
                        </div>
                      )}

                      {activeSesiId === sesi.id ? (
                        <div className="bg-black/30 p-3 rounded-lg border border-border space-y-3">
                          <input type="text" className="form-control text-sm" placeholder="Judul (Misal: Sesi 1 Part 1)" value={newRekamanJudul} onChange={e => setNewRekamanJudul(e.target.value)} />
                          <input type="url" className="form-control text-sm" placeholder="URL Rekaman (Google Drive, dll)" value={newRekamanUrl} onChange={e => setNewRekamanUrl(e.target.value)} />
                          <div className="flex gap-2">
                             <button onClick={() => setActiveSesiId("")} className="btn bg-gray-600 hover:bg-gray-500 text-white text-xs w-1/2">Batal</button>
                             <button onClick={() => handleAddRekaman(sesi.id)} className="btn btn-primary text-xs w-1/2">Simpan</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setActiveSesiId(sesi.id); setNewRekamanUrl(""); setNewRekamanJudul(""); }} className="w-full btn bg-surface hover:bg-surface-hover text-primary border border-primary/20 hover:border-primary/50 text-sm">
                          <FaPlus /> Tambah Rekaman Sesi
                        </button>
                      )}
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
