"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Toast } from "@/lib/swal";
import { tandaiHadir, hapusAbsenPengajar } from "./actions";
import { FaCheck, FaTimes, FaPlus } from "react-icons/fa";

type PengajarOpt = { id: string; username: string };
type HadirRow = { id: string; pengajarId: string; username: string };

export default function EditKehadiran({ sesiId, pengajars, hadir }: { sesiId: string; pengajars: PengajarOpt[]; hadir: HadirRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);

  const tersedia = pengajars.filter(p => !hadir.some(h => h.pengajarId === p.id));

  const handleTandai = async () => {
    if (!selected) return Toast.fire({ icon: 'warning', title: 'Pilih pengajar dulu' });
    setBusy(true);
    const res = await tandaiHadir(sesiId, selected);
    setBusy(false);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Pengajar ditandai hadir' });
      setSelected("");
      router.refresh();
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  const handleHapus = async (row: HadirRow) => {
    const confirm = await Alert.fire({
      title: 'Hapus Kehadiran',
      text: `Hapus catatan hadir ${row.username} di sesi ini?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus"
    });
    if (!confirm.isConfirmed) return;
    setBusy(true);
    const res = await hapusAbsenPengajar(row.id);
    setBusy(false);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Catatan kehadiran dihapus' });
      router.refresh();
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  return (
    <div>
      {hadir.length === 0 ? (
        <p className="text-sm text-yellow-500 mb-3">⚠ Belum ada pengajar yang tercatat hadir di sesi ini.</p>
      ) : (
        <ul className="space-y-2 mb-3">
          {hadir.map(h => (
            <li key={h.id} className="flex items-center justify-between gap-2 bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-lg text-sm">
              <span className="flex items-center gap-2 text-green-400 font-semibold">
                <FaCheck /> {h.username}
              </span>
              <button onClick={() => handleHapus(h)} disabled={busy}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-500 rounded text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50">
                <FaTimes /> Hapus
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={selected} onChange={e => setSelected(e.target.value)} disabled={busy || tersedia.length === 0}
          className="form-control max-w-xs">
          <option value="">— Tandai pengajar hadir —</option>
          {tersedia.map(p => (
            <option key={p.id} value={p.id}>{p.username}</option>
          ))}
        </select>
        <button onClick={handleTandai} disabled={busy || !selected} className="btn btn-primary">
          <FaPlus /> Tandai Hadir
        </button>
      </div>
    </div>
  );
}
