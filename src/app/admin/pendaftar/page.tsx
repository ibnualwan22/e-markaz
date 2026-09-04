"use client";

import { useState, useEffect } from "react";
import { Alert, Toast } from "@/lib/swal";
import { getPendaftaran, accPendaftaran, rejectPendaftaran } from "./actions";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";
import Swal from "sweetalert2";

export default function DataPendaftar() {
  const [data, setData] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("SEMUA");

  const loadData = async () => {
    const res = await getPendaftaran();
    setData(res);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcc = async (id: string, nama: string) => {
    const confirm = await Alert.fire({
      title: 'Validasi Pembayaran?',
      text: `Anda yakin akan menerima pendaftaran ${nama}? Sistem akan membuat akun untuk santri.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Terima'
    });
    
    if (confirm.isConfirmed) {
      const res = await accPendaftaran(id);
      if (res.success && res.credentials) {
        Swal.fire({
          title: 'Akun Berhasil Dibuat!',
          html: `
            <div class="text-left bg-gray-800 p-4 rounded-lg mt-4 border border-gray-600">
              <p class="text-gray-300 text-sm mb-2">Salin kredensial berikut untuk dikirim ke santri:</p>
              <div class="mb-2"><span class="text-gray-400 w-24 inline-block">Username:</span> <b class="text-white text-lg">${res.credentials.username}</b></div>
              <div><span class="text-gray-400 w-24 inline-block">Password:</span> <b class="text-green-400 text-lg">${res.credentials.password}</b></div>
            </div>
            <p class="text-xs text-gray-500 mt-4">*Kedepannya ini akan dikirim via WA ke nomor santri</p>
          `,
          icon: 'success',
          confirmButtonText: 'Tutup',
          background: '#1a1a1a',
          color: '#e5e7eb'
        });
        loadData();
      } else {
        Alert.fire('Gagal', res.error, 'error');
      }
    }
  };

  const handleReject = async (id: string) => {
    const confirm = await Alert.fire({
      title: 'Tolak Pendaftaran?',
      text: "Data akan ditandai sebagai DITOLAK.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tolak',
      confirmButtonColor: '#ef4444'
    });
    
    if (confirm.isConfirmed) {
      const res = await rejectPendaftaran(id);
      if (res.success) {
        Toast.fire({ icon: 'success', title: 'Pendaftaran ditolak' });
        loadData();
      } else {
        Alert.fire('Gagal', res.error, 'error');
      }
    }
  };
  
  const showDetail = (item: any) => {
    Alert.fire({
      title: 'Detail Pendaftaran',
      html: `
        <div class="text-left space-y-2 text-sm mt-4">
          <p><span class="text-gray-400 font-semibold w-1/3 inline-block">Kode Unik:</span> ${item.kodeUnik}</p>
          <p><span class="text-gray-400 font-semibold w-1/3 inline-block">Total Transfer:</span> Rp ${item.totalBiaya.toLocaleString('id-ID')}</p>
          <hr class="border-gray-700 my-2" />
          <p><span class="text-gray-400 font-semibold w-1/3 inline-block">No WA:</span> ${item.noWa}</p>
          <p><span class="text-gray-400 font-semibold w-1/3 inline-block">Email:</span> ${item.email || '-'}</p>
          <p><span class="text-gray-400 font-semibold w-1/3 inline-block">Kelamin:</span> ${item.jenisKelamin}</p>
          <p><span class="text-gray-400 font-semibold w-1/3 inline-block">TTL:</span> ${item.tempatLahir}, ${new Date(item.tanggalLahir).toLocaleDateString('id-ID')}</p>
          <p><span class="text-gray-400 font-semibold w-1/3 inline-block align-top">Alamat:</span> <span class="inline-block w-2/3">${item.detailAlamat}</span></p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Tutup'
    });
  }

  const filteredData = data.filter(item => filterStatus === "SEMUA" ? true : item.status === filterStatus);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Data Pendaftar</h1>
        <select 
          className="form-control w-auto" 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="SEMUA">Semua Status</option>
          <option value="MENUNGGU">Menunggu</option>
          <option value="DITERIMA">Diterima</option>
          <option value="DITOLAK">Ditolak</option>
        </select>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama / Program</th>
              <th>Periode</th>
              <th>Kode Unik / Total</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={6} className="text-center">Belum ada data pendaftar</td></tr>
            ) : filteredData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <div className="font-semibold">{item.namaLengkap}</div>
                  <div className="text-xs text-blue-400 mt-1">{item.program?.nama}</div>
                </td>
                <td className="text-sm">{item.periode?.nama}</td>
                <td>
                  <div className="text-yellow-500 font-bold">+{item.kodeUnik}</div>
                  <div className="text-xs text-gray-400">Rp {item.totalBiaya.toLocaleString('id-ID')}</div>
                </td>
                <td>
                  <span className={`badge ${
                    item.status === 'MENUNGGU' ? 'badge-warning' : 
                    item.status === 'DITERIMA' ? 'badge-success' : 'badge-danger'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => showDetail(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded" title="Lihat Detail">
                      <FaEye />
                    </button>
                    {item.status === "MENUNGGU" && (
                      <>
                        <button onClick={() => handleAcc(item.id, item.namaLengkap)} className="p-2 text-green-400 hover:bg-green-400/10 rounded" title="Terima & Buat Akun">
                          <FaCheck />
                        </button>
                        <button onClick={() => handleReject(item.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded" title="Tolak">
                          <FaTimes />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
