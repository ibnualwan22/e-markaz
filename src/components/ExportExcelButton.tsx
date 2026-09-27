"use client";

import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { Toast } from "@/lib/swal";

interface ExportExcelButtonProps {
  data: any[];
  filename: string;
  sheetName?: string;
  className?: string;
}

export default function ExportExcelButton({ data, filename, sheetName = "Sheet1", className = "btn bg-green-600 hover:bg-green-700 text-white" }: ExportExcelButtonProps) {
  const handleExport = () => {
    if (data.length === 0) {
      Toast.fire({ icon: 'warning', title: 'Data kosong, tidak ada yang di-export.' });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <button onClick={handleExport} className={className}>
      <FaFileExcel /> Export Excel
    </button>
  );
}
