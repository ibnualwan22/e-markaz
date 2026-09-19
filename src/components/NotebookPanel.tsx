"use client";

import { FaBookOpen, FaHighlighter, FaPen, FaFont, FaRegCommentDots } from "react-icons/fa";

interface Props {
  annotations: any[]; // All annotations provided by PdfReader (requires PdfReader to load ALL pages annotations!)
  onNavigate: (page: number) => void;
}

export default function NotebookPanel({ annotations, onNavigate }: Props) {
  // Group annotations by page
  const grouped = annotations.reduce((acc: any, ann: any) => {
    if (!acc[ann.halaman]) acc[ann.halaman] = [];
    acc[ann.halaman].push(ann);
    return acc;
  }, {});

  const pages = Object.keys(grouped).sort((a: any, b: any) => a - b);

  const getIcon = (tipe: string, color: string) => {
     switch (tipe) {
        case 'HIGHLIGHT': return <FaHighlighter style={{ color: color || 'yellow' }} />;
        case 'DRAWING': return <FaPen style={{ color: color || '#fff' }} />;
        case 'TEXTBOX': return <FaFont style={{ color: color || '#fff' }} />;
        case 'STICKY': return <FaRegCommentDots style={{ color: color || '#3b82f6' }} />;
        default: return <FaPen />;
     }
  };

  const getPreview = (ann: any) => {
     const data = typeof ann.data === 'string' ? JSON.parse(ann.data) : ann.data;
     if (ann.tipe === 'STICKY') return data.text;
     if (ann.tipe === 'TEXTBOX') return data.text;
     if (ann.tipe === 'HIGHLIGHT') return "Area di-highlight";
     if (ann.tipe === 'DRAWING') return "Coretan/Gambar";
     return "Anotasi";
  };

  const getColor = (ann: any) => {
     const data = typeof ann.data === 'string' ? JSON.parse(ann.data) : ann.data;
     if (ann.tipe === 'HIGHLIGHT') return data.fill;
     if (ann.tipe === 'DRAWING' && data.objects && data.objects.length > 0) return data.objects[0].stroke; // Fabric.js path structure
     if (ann.tipe === 'TEXTBOX') return data.fill;
     if (ann.tipe === 'STICKY') return data.color;
     return '#fff';
  }

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl">
      <div className="p-4 border-b border-border bg-surface shrink-0">
        <h3 className="font-bold flex items-center gap-2"><FaBookOpen className="text-green-500" /> Buku Catatan</h3>
        <p className="text-xs text-gray-400 mt-1">Rangkuman semua anotasi guru</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        {pages.length === 0 ? (
          <div className="text-center text-sm text-gray-500 my-8 flex flex-col items-center gap-3">
             <FaBookOpen className="text-3xl text-gray-700" />
             Belum ada catatan dari guru di buku ini.
          </div>
        ) : (
          pages.map((page: string) => (
             <div key={page} className="mb-2">
                <div 
                   className="text-xs font-bold text-gray-400 mb-2 border-b border-border pb-1 hover:text-white cursor-pointer transition-colors"
                   onClick={() => onNavigate(parseInt(page))}
                >
                   Halaman {page}
                </div>
                <div className="flex flex-col gap-2">
                   {grouped[page].map((ann: any) => (
                      <div 
                         key={ann.id} 
                         onClick={() => onNavigate(parseInt(page))}
                         className="flex items-start gap-3 bg-surface border border-border p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group"
                      >
                         <div className="mt-1 opacity-80 group-hover:opacity-100">
                            {getIcon(ann.tipe, getColor(ann))}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 break-words whitespace-pre-wrap">{getPreview(ann)}</p>
                            <p className="text-[10px] text-gray-500 mt-1">
                               Oleh {ann.user?.username || 'Guru'} • {new Date(ann.createdAt).toLocaleDateString('id-ID')}
                            </p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          ))
        )}
      </div>
    </div>
  );
}
