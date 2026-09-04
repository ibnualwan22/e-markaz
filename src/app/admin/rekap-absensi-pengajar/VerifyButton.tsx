"use client";

import { Alert, Toast } from "@/lib/swal";
import { setStatusValidasi } from "./actions";
import { FaCheck, FaTimes } from "react-icons/fa";

export default function VerifyButton({ id, statusValidasi, pengajarName }: { id: string, statusValidasi: string, pengajarName: string }) {
  const handleUpdate = async (status: string) => {
    const confirm = await Alert.fire({
      title: 'Validasi Absen',
      text: `Ubah status validasi absen ${pengajarName} menjadi ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: "Ya, Terapkan"
    });

    if (confirm.isConfirmed) {
      const res = await setStatusValidasi(id, status);
      if (res.success) {
        Toast.fire({ icon: 'success', title: 'Status diperbarui' });
      } else {
        Alert.fire('Error', res.error, 'error');
      }
    }
  };

  return (
    <div className="flex gap-2">
      {statusValidasi !== "VALID" && (
        <button onClick={() => handleUpdate("VALID")} className="flex items-center gap-1 p-2 bg-green-500/20 text-green-500 rounded text-xs font-semibold hover:bg-green-500/30">
          <FaCheck /> Valid
        </button>
      )}
      {statusValidasi !== "REJECTED" && (
        <button onClick={() => handleUpdate("REJECTED")} className="flex items-center gap-1 p-2 bg-red-500/20 text-red-500 rounded text-xs font-semibold hover:bg-red-500/30">
          <FaTimes /> Tolak
        </button>
      )}
    </div>
  );
}
