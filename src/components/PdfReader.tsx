"use client";

import { useState, useEffect } from "react";
import { FaArrowLeft, FaExpand, FaCompress, FaExternalLinkAlt, FaChevronLeft, FaChevronRight, FaRegCommentDots, FaTrash } from "react-icons/fa";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { getKomentarByMateri, tambahKomentar, hapusKomentar } from "@/app/portal/materi/actions";
import { Toast, Alert } from "@/lib/swal";

// Configure worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Materi {
  id: string;
  judul: string;
  deskripsi: string | null;
  fileUrl: string;
  createdAt: string;
}

interface UserContext {
  id: string;
  username: string;
  role: string | any;
}

interface Komentar {
  id: string;
  halaman: number;
  isi: string;
  userId: string;
  createdAt: Date;
  user: {
    username: string;
    role: { name: string };
  };
}

export default function PdfReader({ 
  activeMateri, 
  currentUser, 
  onClose,
  readOnly = false // true for situations where we don't want comments interaction
}: { 
  activeMateri: Materi;
  currentUser: UserContext | null; // null if unauthenticated/guest
  onClose: () => void;
  readOnly?: boolean;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // PDF State
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  // Komentar State
  const [showComments, setShowComments] = useState(true);
  const [komentarList, setKomentarList] = useState<Komentar[]>([]);
  const [newKomentar, setNewKomentar] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Perbaiki URL cloudinary proxy untuk fallback tab baru
  const fixPdfUrl = (url: string) => {
    let fixed = url;
    if (fixed.endsWith('.pdf') && fixed.includes('/image/upload/')) {
      fixed = fixed.replace('/image/upload/', '/raw/upload/');
    }
    return fixed; // raw cloudinary url
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setScale(1.0); // reset scale
  };

  const loadKomentar = async (materiId: string, page: number) => {
    setIsLoadingComments(true);
    const res = await getKomentarByMateri(materiId, page);
    if (res.success && res.data) {
      setKomentarList(res.data as unknown as Komentar[]);
    }
    setIsLoadingComments(false);
  };

  useEffect(() => {
    if (activeMateri && !readOnly) {
      loadKomentar(activeMateri.id, pageNumber);
    }
  }, [activeMateri, pageNumber, readOnly]);

  const handlePostKomentar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKomentar.trim() || !activeMateri || !currentUser) return;

    const res = await tambahKomentar(activeMateri.id, pageNumber, newKomentar);
    if (res.success) {
      setNewKomentar("");
      loadKomentar(activeMateri.id, pageNumber);
    } else {
      Alert.fire('Gagal', res.error, 'error');
    }
  };

  const handleDeleteKomentar = async (id: string) => {
    const res = await hapusKomentar(id);
    if (res.success) {
      Toast.fire({ icon: 'success', title: 'Komentar dihapus' });
      if (activeMateri) {
        loadKomentar(activeMateri.id, pageNumber);
      }
    } else {
      Alert.fire('Error', res.error, 'error');
    }
  };

  const pdfUrl = fixPdfUrl(activeMateri.fileUrl);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[100] bg-background p-4 flex flex-col' : 'flex flex-col h-full absolute inset-0 bg-background z-50 p-4'}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 gap-4 shrink-0">
        <button 
          onClick={onClose}
          className="btn btn-secondary shrink-0"
        >
          <FaArrowLeft /> Kembali
        </button>
        
        <div className="flex flex-col items-center flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate max-w-full text-center">
            {activeMateri.judul}
          </h2>
          {/* PDF Controls */}
          {numPages > 0 && (
            <div className="flex items-center gap-4 mt-2">
              <button 
                disabled={pageNumber <= 1} 
                onClick={() => setPageNumber(prev => prev - 1)}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <FaChevronLeft />
              </button>
              <span className="text-sm text-gray-300">
                Halaman {pageNumber} dari {numPages}
              </span>
              <button 
                disabled={pageNumber >= numPages} 
                onClick={() => setPageNumber(prev => prev + 1)}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <FaChevronRight />
              </button>
              <div className="h-4 w-px bg-gray-700 mx-2"></div>
              <button onClick={() => setScale(prev => Math.max(0.5, prev - 0.2))} className="text-gray-400 font-bold px-2 hover:text-white">-</button>
              <span className="text-xs text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(prev => Math.min(2.5, prev + 0.2))} className="text-gray-400 font-bold px-2 hover:text-white">+</button>
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {!readOnly && (
            <button
              onClick={() => setShowComments(!showComments)}
              className={`btn ${showComments ? 'btn-primary' : 'btn-secondary'} hidden md:flex`}
              title="Toggle Komentar"
            >
              <FaRegCommentDots />
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-secondary"
            title={isFullscreen ? 'Kecilkan' : 'Perbesar'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" title="Unduh / Buka di Tab Baru">
            <FaExternalLinkAlt />
          </a>
        </div>
      </div>
      
      <div className={`flex flex-1 gap-4 overflow-hidden ${isFullscreen ? 'h-full' : 'h-[75vh]'}`}>
        {/* Document Viewer Container */}
        <div className="flex-1 border border-border rounded-xl overflow-auto bg-gray-900 custom-scrollbar relative flex justify-center pb-8 p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="flex items-center justify-center h-full text-gray-400">Memuat PDF...</div>}
            error={<div className="flex items-center justify-center h-full text-red-400">Gagal memuat PDF. Cobalah dari tab baru.</div>}
          >
            <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-2xl mx-auto"
            />
          </Document>
        </div>

        {/* Comments Panel Sidebar */}
        {showComments && !readOnly && currentUser && (
          <div className="w-80 shrink-0 border border-border rounded-xl bg-card flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-bold flex items-center gap-2"><FaRegCommentDots className="text-primary"/> Catatan (Hal {pageNumber})</h3>
              <p className="text-xs text-gray-400 mt-1">Diskusikan materi di halaman ini</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3 relative">
              {isLoadingComments ? (
                <div className="text-center text-sm text-gray-500 my-4">Memuat data...</div>
              ) : komentarList.length === 0 ? (
                <div className="text-center text-sm text-gray-500 my-8">Belum ada catatan di halaman ini. Mulai diskusi!</div>
              ) : (
                komentarList.map(item => (
                  <div key={item.id} className={`p-3 rounded-xl text-sm ${item.userId === currentUser.id ? 'bg-primary/10 border border-primary/20 self-end w-[90%]' : 'bg-surface border border-border self-start w-[90%]'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-xs ${item.userId === currentUser.id ? 'text-primary' : 'text-blue-400'}`}>
                          {item.userId === currentUser.id ? 'Anda' : item.user.username}
                      </span>
                      <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">{new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          {(item.userId === currentUser.id || currentUser.role === 'SUPERADMIN' || currentUser.role === 'ADMIN') && (
                            <button onClick={() => handleDeleteKomentar(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors">
                                <FaTrash size={10} />
                            </button>
                          )}
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{item.isi}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t border-border bg-surface shrink-0">
              <form onSubmit={handlePostKomentar} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Tulis catatan..." 
                  className="form-control flex-1 text-sm rounded-full bg-background border-none px-4 py-2"
                  value={newKomentar}
                  onChange={(e) => setNewKomentar(e.target.value)}
                />
                <button type="submit" disabled={!newKomentar.trim()} className="btn btn-primary rounded-full px-4 shrink-0 transition-opacity disabled:opacity-50">
                  Kirim
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
