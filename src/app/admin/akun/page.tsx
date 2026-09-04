"use client";

import { useState, useEffect } from "react";
import { Alert, Toast } from "@/lib/swal";
import { getAccounts, getRoles, saveAccount, deleteAccount } from "./actions";
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes } from "react-icons/fa";
import { useSession } from "next-auth/react";

export default function ManajemenAkun() {
  const { data: session } = useSession();
  const [data, setData] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", username: "", password: "", roleId: "" });

  const loadData = async () => {
    const res = await getAccounts();
    const rolesRes = await getRoles();
    setData(res);
    setRoles(rolesRes);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (item?: any) => {
    if (item) {
      setFormData({
        id: item.id,
        username: item.username,
        password: "", // blank password means no change
        roleId: item.roleId
      });
    } else {
      setFormData({ id: "", username: "", password: "", roleId: roles[0]?.id || "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleId) return Alert.fire('Validasi', 'Role harus dipilih', 'warning');

    const { id, ...dataToSave } = formData;
    const res = await saveAccount(id ? id : null, dataToSave as any);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Akun berhasil disimpan' });
      setIsModalOpen(false);
      loadData();
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (session?.user?.id === id) {
      return Alert.fire('Akses Ditolak', 'Anda tidak bisa menghapus akun Anda sendiri!', 'error');
    }

    const confirm = await Alert.fire({
      title: 'Hapus Akun?',
      text: `Menghapus akun ${username} tidak dapat dikembalikan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!'
    });
    
    if (confirm.isConfirmed) {
      const res = await deleteAccount(id);
      if (res.success) {
        Toast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
        loadData();
      } else {
        Alert.fire('Gagal', res.error, 'error');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manajemen Akun (Staff & Pengajar)</h1>
        <button onClick={() => openModal()} className="btn btn-primary">
          <FaPlus /> Tambah Akun
        </button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Username</th>
              <th>Role</th>
              <th>Dibuat Pada</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td className="font-semibold text-white">{item.username}</td>
                <td>
                  <span className={`badge ${item.role?.name === 'Admin' ? 'badge-success' : 'badge-warning'}`}>
                    {item.role?.name}
                  </span>
                </td>
                <td className="text-sm text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString('id-ID')}
                </td>
                <td>
                  {item.username === 'admin' ? (
                    <span className="text-xs text-gray-500 italic bg-gray-800 px-2 py-1 rounded">Sistem Mengunci Akun Ini</span>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => openModal(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.username)} className="p-2 text-red-400 hover:bg-red-400/10 rounded">
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit' : 'Tambah'} Akun</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required className="form-control" readOnly={formData.username === 'admin'} disabled={formData.username === 'admin'} />
              </div>
              <div className="form-group">
                <label className="form-label">Password {formData.id && <span className="text-xs text-gray-500 font-normal">(Kosongkan jika tidak ingin diubah)</span>}</label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!formData.id} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Role Akses</label>
                <select value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})} className="form-control" required disabled={formData.username === 'admin'}>
                  <option value="">-- Pilih Role --</option>
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Akun</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
