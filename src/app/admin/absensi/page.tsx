"use client";

import { useState, useEffect } from "react";
import { Alert, Toast } from "@/lib/swal";
import { getSesiByProgram, getSantriByProgram, createSesi, saveAbsenSantri } from "./actions";
import { FaPlus, FaCheck, FaTimes } from "react-icons/fa";
import { useSession } from "next-auth/react";

export default function ManajemenAbsensi() {
  const { data: userSession } = useSession();
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  
  const [sesiList, setSesiList] = useState<any[]>([]);
  const [santriList, setSantriList] = useState<any[]>([]);
  

  
  const [absensiMap, setAbsensiMap] = useState<Record<string, Record<string, string>>>({}); // sesiId -> santriId -> status

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

  const handleBuatSesi = async () => {
    if (!selectedProgram) return Alert.fire('Error', 'Pilih program dulu', 'error');
    
    const res = await createSesi({
      programId: selectedProgram
    });
    
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Sesi berhasil dibuat!' });
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

    // Menyimpan absen santri otomatis mencatat pengajar yang login hadir di sesi ini.
    const res = await saveAbsenSantri(sesiId, listToSave, userSession?.user?.id);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Absensi berhasil disimpan! Kehadiran pengajar tercatat.' });
      loadSesiAndSantri(selectedProgram); // re-sync
    } else {
      Alert.fire('Gagal menyimpan', res.error, 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manajemen Absensi</h1>
        {selectedProgram && (
          <button onClick={handleBuatSesi} className="btn btn-primary">
            <FaPlus /> Tambah Absen
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
                   <button onClick={() => handleSaveAbsensi(sesi.id)} className="btn btn-primary">
                     <FaCheck /> Simpan Absensi Santri
                   </button>
                 </div>
               </div>
               
               <div className="mb-4">
                  {sesi.absensiPengajars.length > 0 ? (
                    <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg flex items-center gap-4 text-sm text-green-400 mb-4">
                      <FaCheck /> Pengajar sudah absen: {sesi.absensiPengajars.map((a: any) => a.pengajar.username).join(", ")}
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg text-sm text-yellow-500 mb-4">
                      ⚠ Pengajar belum absen di sesi ini. Simpan absensi santri untuk mencatat kehadiran pengajar.
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
                         const currentStatus = absensiMap[sesi.id]?.[santri.id] || "";
                         return (
                           <tr key={santri.id}>
                             <td>{idx + 1}</td>
                             <td className="font-medium text-white">{santri.pendaftaran.namaLengkap}</td>
                             <td>
                               <div className="flex flex-wrap gap-2">
                                 <button 
                                   onClick={() => updateAbsensiLocal(sesi.id, santri.id, "HADIR")}
                                   className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-transparent ${currentStatus === "HADIR" ? "bg-green-500 text-white shadow-lg shadow-green-500/30" : "bg-surface hover:bg-surface-hover text-gray-400 border-border"}`}
                                 >HADIR</button>
                                 <button 
                                   onClick={() => updateAbsensiLocal(sesi.id, santri.id, "IZIN")}
                                   className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-transparent ${currentStatus === "IZIN" ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30" : "bg-surface hover:bg-surface-hover text-gray-400 border-border"}`}
                                 >IZIN</button>
                                 <button 
                                   onClick={() => updateAbsensiLocal(sesi.id, santri.id, "SAKIT")}
                                   className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-transparent ${currentStatus === "SAKIT" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-surface hover:bg-surface-hover text-gray-400 border-border"}`}
                                 >SAKIT</button>
                                 <button 
                                   onClick={() => updateAbsensiLocal(sesi.id, santri.id, "ALPA")}
                                   className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-transparent ${currentStatus === "ALPA" ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-surface hover:bg-surface-hover text-gray-400 border-border"}`}
                                 >ALPA</button>
                               </div>
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

      {/* Modal is removed since addition is completely dynamic and one-click */}
    </div>
  );
}
