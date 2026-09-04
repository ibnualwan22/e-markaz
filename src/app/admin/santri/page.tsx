"use client";

import { useState, useEffect } from "react";
import { getSantriGlobal } from "./actions";
import { Alert } from "@/lib/swal";
import { FaEye, FaArrowRight } from "react-icons/fa";

export default function DataSantri() {
  const [data, setData] = useState<any[]>([]);

  const loadData = async () => {
    const res = await getSantriGlobal();
    setData(res);
  };

  useEffect(() => {
    loadData();
  }, []);
  
  const showDetail = (item: any) => {
    Alert.fire({
      title: 'Profil Santri',
      html: `
        <div class="text-left space-y-2 mt-4 text-sm">
          <p><strong class="w-1/3 inline-block text-gray-400">Username Login:</strong> <span class="text-white">${item.user?.username || '-'}</span></p>
          <hr class="border-gray-700 my-2" />
          <p><strong class="w-1/3 inline-block text-gray-400">Nama Lengkap:</strong> ${item.pendaftaran.namaLengkap}</p>
          <p><strong class="w-1/3 inline-block text-gray-400">Program Saat Ini:</strong> <span class="text-blue-400">${item.pendaftaran.program?.nama}</span></p>
          <p><strong class="w-1/3 inline-block text-gray-400">No WA:</strong> ${item.pendaftaran.noWa}</p>
          <p><strong class="w-1/3 inline-block text-gray-400">Email:</strong> ${item.pendaftaran.email || '-'}</p>
        </div>
      `,
      confirmButtonText: 'Tutup'
    });
  };

  const handleLanjutPeriode = (id: string) => {
    Alert.fire({
      title: 'Lanjut Periode?',
      text: "Fitur ini akan segera hadir: Santri dapat melanjutkan pendaftaran program di periode berikutnya menggunakan akun yang sama.",
      icon: 'info',
      confirmButtonText: 'Oke'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Data Santri Global</h1>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama / Gender</th>
              <th>Program Terakhir</th>
              <th>Username</th>
              <th>Waktu Bergabung</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="text-center">Belum ada data santri</td></tr>
            ) : data.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <div className="font-semibold text-white">{item.pendaftaran?.namaLengkap}</div>
                  <div className="text-xs text-gray-400 mt-1">{item.pendaftaran?.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</div>
                </td>
                <td>
                  <div className="text-blue-400">{item.pendaftaran?.program?.nama}</div>
                  <div className="text-xs text-gray-500">{item.pendaftaran?.periode?.nama}</div>
                </td>
                <td>
                  <span className="badge badge-success lowercase">{item.user?.username}</span>
                </td>
                <td className="text-sm">
                  {new Date(item.createdAt).toLocaleDateString('id-ID')}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => showDetail(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded" title="Lihat Detail Profil">
                      <FaEye />
                    </button>
                    <button onClick={() => handleLanjutPeriode(item.id)} className="p-2 text-purple-400 hover:bg-purple-400/10 rounded flex items-center gap-2 text-xs" title="Lanjut Periode">
                      <FaArrowRight /> Lanjut
                    </button>
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
