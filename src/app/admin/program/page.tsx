"use client";

import { useState, useEffect } from "react";
import { Alert, Toast } from "@/lib/swal";
import { getPrograms, saveProgram, deleteProgram, toggleProgramStatus } from "./actions";
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes } from "react-icons/fa";

export default function ManajemenProgram() {
  const [data, setData] = useState<any[]>([]);
  const [formData, setFormData] = useState({ id: "", nama: "", harga: 0, deskripsi: "", statusAktif: false });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    const res = await getPrograms();
    setData(res);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (item?: any) => {
    if (item) {
      setFormData({
        id: item.id,
        nama: item.nama,
        harga: item.harga,
        deskripsi: item.deskripsi || "",
        statusAktif: item.statusAktif
      });
    } else {
      setFormData({ id: "", nama: "", harga: 0, deskripsi: "", statusAktif: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...dataToSave } = formData;
    const payload = { ...dataToSave, harga: Number(formData.harga) };
    const res = await saveProgram(id ? id : null, payload);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Data berhasil disimpan' });
      setIsModalOpen(false);
      loadData();
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Alert.fire({
      title: 'Hapus data?',
      text: "Data yang dihapus tidak bisa dikembalikan",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!'
    });
    
    if (confirm.isConfirmed) {
      const res = await deleteProgram(id);
      if (res.success) {
        Toast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
        loadData();
      } else {
        Alert.fire('Gagal', res.error, 'error');
      }
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleProgramStatus(id, !currentStatus);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Status diperbarui' });
      loadData();
    } else {
      Toast.fire({ icon: 'error', title: 'Gagal update status' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manajemen Program</h1>
        <button onClick={() => openModal()} className="btn btn-primary">
          <FaPlus /> Tambah Program
        </button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Program</th>
              <th>Harga (Rp)</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={5} className="text-center">Belum ada data</td></tr>
            ) : data.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <div className="font-semibold">{item.nama}</div>
                  <div className="text-xs text-gray-500 mt-1 max-w-sm truncate">{item.deskripsi}</div>
                </td>
                <td>{item.harga.toLocaleString('id-ID')}</td>
                <td>
                  <button onClick={() => handleToggle(item.id, item.statusAktif)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${item.statusAktif ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                    {item.statusAktif ? <><FaCheck /> Aktif</> : <><FaTimes /> Nonaktif</>}
                  </button>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit' : 'Tambah'} Program</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nama Program</label>
                <input type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required className="form-control" placeholder="Contoh: Bahasa Arab Dasar" />
              </div>
              <div className="form-group">
                <label className="form-label">Harga (Rp)</label>
                <input type="number" min="0" value={formData.harga} onChange={e => setFormData({...formData, harga: Number(e.target.value)})} required className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi Singkat</label>
                <textarea value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="form-control" placeholder="Deskripsi program..."></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
