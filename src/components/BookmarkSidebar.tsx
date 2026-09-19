"use client";

import { useState, useEffect } from "react";
import { FaBookmark, FaTrash, FaPlus } from "react-icons/fa";
import { getBookmarks, createBookmark, deleteBookmark } from "@/app/portal/materi/bookmark-actions";
import { Toast, Alert } from "@/lib/swal";

interface Props {
  materiId: string;
  currentPage: number;
  onNavigate: (page: number) => void;
}

export default function BookmarkSidebar({ materiId, currentPage, onNavigate }: Props) {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [judul, setJudul] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getBookmarks(materiId);
    if (res.success && res.data) {
      setBookmarks(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [materiId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) return;
    
    // Check if bookmark already exists for this page to prevent spam
    if (bookmarks.some(b => b.halaman === currentPage)) {
       Alert.fire('Oops', 'Halaman ini sudah ditandai', 'warning');
       return;
    }

    const res = await createBookmark(materiId, currentPage, judul);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Bookmark ditambahkan' });
      setJudul("");
      loadData();
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await deleteBookmark(id);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Bookmark dihapus' });
      loadData();
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl">
      <div className="p-4 border-b border-border bg-surface shrink-0">
        <h3 className="font-bold flex items-center gap-2"><FaBookmark className="text-yellow-500" /> Bookmark Ku</h3>
        <p className="text-xs text-gray-400 mt-1">Tandai halaman penting</p>
      </div>

      <div className="p-3 border-b border-border bg-surface shrink-0">
         <form onSubmit={handleAdd} className="flex gap-2">
            <input 
               type="text" 
               placeholder={`Beri label hal ${currentPage}...`} 
               value={judul}
               onChange={(e) => setJudul(e.target.value)}
               className="form-control text-sm px-3 py-1 flex-1"
               maxLength={50}
            />
            <button type="submit" disabled={!judul.trim()} className="btn btn-primary text-xs !px-2" title="Tandai Halaman Ini">
               <FaPlus />
            </button>
         </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-2">
        {isLoading ? (
          <div className="text-center text-sm text-gray-500 my-4">Memuat data...</div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center text-sm text-gray-500 my-8 flex flex-col items-center gap-3">
             <FaBookmark className="text-3xl text-gray-700" />
             Belum ada halaman yang Anda tandai.
          </div>
        ) : (
          bookmarks.map(b => (
            <div 
              key={b.id} 
              onClick={() => onNavigate(b.halaman)}
              className="flex justify-between items-center bg-surface hover:bg-white/5 border border-border p-3 rounded-xl cursor-pointer transition-colors group"
            >
              <div>
                 <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{b.judul}</p>
                 <p className="text-xs text-gray-500">Hal {b.halaman}</p>
              </div>
              <button 
                onClick={(e) => handleDelete(b.id, e)} 
                className="text-gray-600 hover:text-red-400 p-2 rounded-lg"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
