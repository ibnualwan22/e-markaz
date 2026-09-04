"use client";

import { useState, useEffect } from "react";
import { Alert, Toast } from "@/lib/swal";
import { getPeriodes, savePeriode, deletePeriode, toggleStatus } from "./actions";
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes } from "react-icons/fa";

export default function ManajemenPeriode() {
  const [data, setData] = useState<any[]>([]);
  const [formData, setFormData] = useState({ id: "", nama: "", tanggalBuka: "", tanggalTutup: "", statusAktif: false });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    const res = await getPeriodes();
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
        tanggalBuka: new Date(item.tanggalBuka).toISOString().split('T')[0],
        tanggalTutup: new Date(item.tanggalTutup).toISOString().split('T')[0],
        statusAktif: item.statusAktif
      });
    } else {
      setFormData({ id: "", nama: "", tanggalBuka: "", tanggalTutup: "", statusAktif: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await savePeriode(formData.id ? formData.id : null, formData);
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
      const res = await deletePeriode(id);
      if (res.success) {
        Toast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
        loadData();
      } else {
        Alert.fire('Gagal', res.error, 'error');
      }
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleStatus(id, !currentStatus);
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
        <h1 className="text-2xl font-bold text-white">Manajemen Periode</h1>
        <button onClick={() => openModal()} className="btn btn-primary">
          <FaPlus /> Tambah Periode
        </button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Periode</th>
              <th>Tanggal Buka</th>
              <th>Tanggal Tutup</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="text-center">Belum ada data</td></tr>
            ) : data.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.nama}</td>
                <td>{new Date(item.tanggalBuka).toLocaleDateString('id-ID')}</td>
                <td>{new Date(item.tanggalTutup).toLocaleDateString('id-ID')}</td>
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
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit' : 'Tambah'} Periode</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nama Periode</label>
                <input type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required className="form-control" placeholder="Contoh: Gelombang 1 2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Tanggal Buka</label>
                  <input type="date" value={formData.tanggalBuka} onChange={e => setFormData({...formData, tanggalBuka: e.target.value})} required className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Tutup</label>
                  <input type="date" value={formData.tanggalTutup} onChange={e => setFormData({...formData, tanggalTutup: e.target.value})} required className="form-control" />
                </div>
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
