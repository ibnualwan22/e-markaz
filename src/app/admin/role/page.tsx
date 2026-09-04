"use client";

import { useState, useEffect } from "react";
import { Alert, Toast } from "@/lib/swal";
import { getRolesAndPermissions, saveRole, deleteRole } from "./actions";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

export default function ManajemenRole() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "" });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const loadData = async () => {
    const res = await getRolesAndPermissions();
    if (res.roles) setRoles(res.roles);
    if (res.permissions) setPermissions(res.permissions);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (item?: any) => {
    if (item) {
      setFormData({ id: item.id, name: item.name });
      setSelectedPermissions(item.permissions.map((p: any) => p.permissionId));
    } else {
      setFormData({ id: "", name: "" });
      setSelectedPermissions([]);
    }
    setIsModalOpen(true);
  };

  const handeTogglePermission = (id: string) => {
    setSelectedPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const res = await saveRole(formData.id ? formData.id : null, formData.name, selectedPermissions);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Role disimpan' });
      setIsModalOpen(false);
      loadData();
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Alert.fire({
      title: 'Hapus Role?',
      text: "Role yang dihapus tidak dapat dibatalkan",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!'
    });
    
    if (confirm.isConfirmed) {
      const res = await deleteRole(id);
      if (res.success) {
        Toast.fire({ icon: 'success', title: 'Data berhasil dihapus' });
        loadData();
      } else {
        Alert.fire('Gagal', res.error || "Gagal menghapus role, pastikan tidak ada user dengan role ini.", 'error');
      }
    }
  };

  // Group permissions by module to ease the UI
  const groupedPerms = permissions.reduce((acc: any, p: any) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manajemen Role (RBAC)</h1>
        <button onClick={() => openModal()} className="btn btn-primary">
          <FaPlus /> Tambah Role
        </button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Role</th>
              <th>Total Hak Akses</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td className="font-semibold text-white">{item.name}</td>
                <td><span className="badge badge-warning">{item.permissions.length} Akses</span></td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded">
                      <FaEdit />
                    </button>
                    {item.name !== 'Admin' && item.name !== 'Santri' && (
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded">
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-2xl animate-[fadeIn_0.2s_ease-out] max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit' : 'Tambah'} Role & Permissions</h3>
            
            <div className="form-group">
              <label className="form-label">Nama Role</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="form-control" readOnly={formData.name === 'Admin' || formData.name === 'Santri'} disabled={formData.name === 'Admin' || formData.name === 'Santri'} />
            </div>

            <div className="overflow-y-auto flex-1 pr-2 mb-4 space-y-4">
              <label className="form-label mb-2">Hak Akses per Module: {formData.name === 'Admin' ? "(Admin memiliki akses absolut, checklist disini hanya untuk logging)" : ""}</label>
              {Object.keys(groupedPerms).map(moduleName => (
                <div key={moduleName} className="bg-surface-hover p-4 rounded-lg border border-border">
                  <h4 className="font-bold text-white mb-3 tracking-wider text-sm">{moduleName}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {groupedPerms[moduleName].map((p: any) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={selectedPermissions.includes(p.id)} onChange={() => handeTogglePermission(p.id)} className="w-4 h-4 rounded appearance-none border border-gray-600 checked:bg-primary checked:border-primary relative
                          after:content-['✓'] after:absolute after:text-white after:opacity-0 checked:after:opacity-100 after:text-xs after:-top-0.5 after:left-[2px]" />
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors uppercase">{p.action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-auto">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Batal</button>
              <button type="button" onClick={handleSubmit} className="btn btn-primary">Simpan Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
