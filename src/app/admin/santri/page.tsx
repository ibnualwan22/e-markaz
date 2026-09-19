"use client";

import { useState, useEffect } from "react";
import { getSantriGlobal, resetUserPassword, getPrograms, getPeriodes, downloadTemplate, importSantriData, updateSantriName, deleteSantri } from "./actions";
import { Alert } from "@/lib/swal";
import { FaEye, FaArrowRight, FaKey, FaFileExcel, FaDownload, FaUpload, FaEdit, FaTrash } from "react-icons/fa";

export default function DataSantri() {
  const [data, setData] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<any[]>([]);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [selProgramId, setSelProgramId] = useState("");
  const [selPeriodeId, setSelPeriodeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    const res = await getSantriGlobal();
    setData(res);
    setPrograms(await getPrograms());
    setPeriodes(await getPeriodes());
  };

  useEffect(() => {
    loadData();
  }, []);
  
  const showDetail = (item: any) => {
    const tgl = item.pendaftaran.tanggalLahir ? new Date(item.pendaftaran.tanggalLahir).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-';
    Alert.fire({
      title: 'Profil Lengkap Santri',
      html: `
        <div class="text-left space-y-2 mt-4 text-sm max-h-96 overflow-y-auto pr-2">
          <p><strong class="w-1/3 inline-block text-gray-400">Username Login:</strong> <span class="text-white">${item.user?.username || '-'}</span></p>
          <p><strong class="w-1/3 inline-block text-gray-400">Terdaftar Sejak:</strong> <span class="text-blue-400">${new Date(item.createdAt).toLocaleDateString('id-ID')}</span></p>
          <hr class="border-gray-700 my-2" />
          <p><strong class="w-1/3 inline-block text-gray-400">Nama Lengkap:</strong> ${item.pendaftaran.namaLengkap}</p>
          <p><strong class="w-1/3 inline-block text-gray-400">Jenis Kelamin:</strong> ${item.pendaftaran.jenisKelamin}</p>
          <p><strong class="w-1/3 inline-block text-gray-400">Tempat Lahir:</strong> ${item.pendaftaran.tempatLahir}</p>
          <p><strong class="w-1/3 inline-block text-gray-400">Tanggal Lahir:</strong> ${tgl}</p>
          <p><strong class="w-1/3 inline-block text-gray-400">No WA:</strong> ${item.pendaftaran.noWa}</p>
          <p><strong class="w-1/3 inline-block text-gray-400">Email:</strong> ${item.pendaftaran.email || '-'}</p>
          <hr class="border-gray-700 my-2" />
          <p><strong class="block text-gray-400 mb-1">Alamat Lengkap:</strong> ${item.pendaftaran.detailAlamat}</p>
          <hr class="border-gray-700 my-2" />
          <p><strong class="w-1/3 inline-block text-gray-400">Program:</strong> <span class="text-blue-400">${item.pendaftaran.program?.nama}</span></p>
          <p><strong class="w-1/3 inline-block text-gray-400">Periode:</strong> <span class="text-gray-300">${item.pendaftaran.periode?.nama}</span></p>
        </div>
      `,
      confirmButtonText: 'Tutup'
    });
  };

  const handleEditName = async (item: any) => {
    const confirm = await Alert.fire({
      title: 'Ubah Nama Santri',
      input: 'text',
      inputValue: item.pendaftaran.namaLengkap,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      inputValidator: (val) => !val ? 'Nama tidak boleh kosong' : null
    });

    if (confirm.isConfirmed) {
      const res = await updateSantriName(item.pendaftaran.id, confirm.value);
      if (res.success) {
        Alert.fire('Berhasil', 'Nama berhasil diperbarui.', 'success');
        loadData();
      } else {
        Alert.fire('Gagal', res.error, 'error');
      }
    }
  };

  const handleDeleteSantri = async (item: any) => {
    const confirm = await Alert.fire({
      title: 'Hapus Santri Permanen?',
      html: `Ini akan menghapus seluruh rekaman kehadiran, pendaftaran, dan login untuk santri ini. <br/><br/>Ketik ulang nama <b>${item.pendaftaran.namaLengkap}</b> untuk melanjutkan:`,
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Hapus Permanen',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#d33',
      inputValidator: (val) => val !== item.pendaftaran.namaLengkap ? 'Nama yang diketik tidak cocok' : null
    });

    if (confirm.isConfirmed) {
      const res = await deleteSantri(item.id);
      if (res.success) {
         Alert.fire('Terhapus', 'Data santri berhasil dihapus selamanya.', 'success');
         loadData();
      } else {
         Alert.fire('Gagal', res.error, 'error');
      }
    }
  };

  const handleLanjutPeriode = (id: string) => {
    Alert.fire({
      title: 'Lanjut Periode?',
      text: "Fitur ini akan segera hadir: Santri dapat melanjutkan pendaftaran program di periode berikutnya menggunakan akun yang sama.",
      icon: 'info',
      confirmButtonText: 'Oke'
    });
  };

  const handleResetPassword = async (userId: string, nama: string) => {
    const confirm = await Alert.fire({
      title: 'Reset Password?',
      text: `Apakah Anda yakin ingin mereset password untuk ${nama}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Reset'
    });

    if (confirm.isConfirmed) {
      const res = await resetUserPassword(userId);
      if (res.success) {
        Alert.fire({
          title: 'Berhasil Reset',
          html: `<div class="text-left mt-4">
                   <p>Password baru untuk <b>${nama}</b> adalah:</p>
                   <div class="bg-gray-800 p-3 rounded mt-2 text-center text-xl font-mono tracking-widest text-green-400">
                      ${res.plainPassword}
                   </div>
                   <p class="text-xs text-gray-500 mt-2 text-center">Harap salin atau informasikan ke santri.</p>
                 </div>`,
          icon: 'success'
        });
      } else {
        Alert.fire('Gagal', res.error, 'error');
      }
    }
  };

  const onDownloadTemplate = async () => {
    try {
      const b64 = await downloadTemplate();
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${b64}`;
      link.download = "Template_Import_Santri.xlsx";
      link.click();
    } catch(e) {
      Alert.fire("Error", "Gagal mengunduh template.", "error");
    }
  };

  const onSubmitImport = async (e: any) => {
    e.preventDefault();
    if (!selProgramId || !selPeriodeId || !file) {
      return Alert.fire("Peringatan", "Harap pilih Program, Periode, dan unggah file Excel.", "warning");
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = (ev.target?.result as string).split(",")[1];
      const res = await importSantriData(base64Data, selProgramId, selPeriodeId);
      setIsLoading(false);
      setShowImportModal(false);

      if (res.success) {
        const rowsHtml = (res.results || []).map((r: any) => `
          <tr><td class="border border-gray-600 px-2 py-1">${r.namaLengkap}</td><td class="border border-gray-600 px-2 py-1">${r.username}</td><td class="border border-gray-600 px-2 py-1 text-green-400 tracking-widest">${r.password}</td></tr>
        `).join("");

        Alert.fire({
          title: 'Import Berhasil!',
          html: `
            <div class="text-left max-h-96 overflow-y-auto">
              <p class="mb-2">Berhasil mengimpor <b>${res.count}</b> santri.</p>
              <table class="w-full text-xs text-left border-collapse border border-gray-600 mb-4">
                <thead><tr class="bg-gray-800"><th class="border border-gray-600 px-2 py-1">Nama</th><th class="border border-gray-600 px-2 py-1">Username</th><th class="border border-gray-600 px-2 py-1">Password</th></tr></thead>
                <tbody>${rowsHtml}</tbody>
              </table>
              <p class="text-[10px] text-yellow-500">Peringatan: Berikan rincian akun di atas ke masing-masing santri, atau klik Reset Password nantinya.</p>
            </div>
          `,
          icon: 'success',
          customClass: { popup: 'swal2-lg' }
        });
        loadData();
      } else {
        Alert.fire("Gagal Import", res.error, "error");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Santri Global</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={onDownloadTemplate} className="btn bg-gray-700 hover:bg-gray-600 flex items-center gap-2">
            <FaDownload /> Template Excel
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
            <FaFileExcel /> Import Santri
          </button>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface border border-border p-6 rounded-lg shadow-xl w-full max-w-md animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-white mb-4">Import Data Santri (Excel)</h2>
            <form onSubmit={onSubmitImport} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pilih Program</label>
                <select className="form-control" value={selProgramId} onChange={e => setSelProgramId(e.target.value)} required>
                  <option value="">-- Pilih Program --</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pilih Periode</label>
                <select className="form-control" value={selPeriodeId} onChange={e => setSelPeriodeId(e.target.value)} required>
                  <option value="">-- Pilih Periode --</option>
                  {periodes.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">File Excel (.xlsx)</label>
                <input type="file" accept=".xlsx, .xls" className="form-control file:bg-primary file:border-none file:px-4 file:py-1.5 file:rounded file:text-white file:cursor-pointer file:mr-4 file:text-sm cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} required />
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-border mt-4">
                <button type="button" onClick={() => setShowImportModal(false)} className="btn bg-gray-700 hover:bg-gray-600">Batal</button>
                <button type="submit" disabled={isLoading} className="btn bg-green-600 hover:bg-green-700 flex items-center gap-2">
                  {isLoading ? 'Memproses...' : <><FaUpload /> Upload & Import</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <button onClick={() => handleEditName(item)} className="p-2 text-blue-300 hover:bg-blue-300/10 rounded" title="Ubah Nama">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteSantri(item)} className="p-2 text-red-500 hover:bg-red-500/10 rounded" title="Hapus Data">
                      <FaTrash />
                    </button>
                    {item.user?.id && (
                      <button onClick={() => handleResetPassword(item.user.id, item.pendaftaran.namaLengkap)} className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded" title="Reset Password">
                        <FaKey />
                      </button>
                    )}
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
