"use client";

import { FaPen, FaHighlighter, FaFont, FaRegCommentDots, FaEraser, FaPalette, FaMousePointer, FaTextHeight } from "react-icons/fa";

export type ToolType = 'NONE' | 'TEXT_SELECT' | 'HIGHLIGHT' | 'DRAWING' | 'TEXTBOX' | 'STICKY' | 'ERASER';

interface Props {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  isSaving?: boolean;
}

const COLORS = ['#eab308', '#22c55e', '#ef4444', '#3b82f6', '#000000'];

export default function AnnotationToolbar({ activeTool, setActiveTool, activeColor, setActiveColor, strokeWidth, setStrokeWidth, isSaving }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-surface border border-border p-2 rounded-xl shadow-lg mt-2 mx-auto w-fit">
      <div className="flex items-center gap-1 border-r border-border pr-2">
        <button 
          onClick={() => setActiveTool('NONE')}
          className={`p-2 rounded-lg transition-colors ${activeTool === 'NONE' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          title="Pilih Anotasi (Cursor)"
        >
          <FaMousePointer size={14} />
        </button>
        <button 
          onClick={() => setActiveTool('TEXT_SELECT')}
          className={`p-2 rounded-lg transition-colors ${activeTool === 'TEXT_SELECT' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          title="Blok Teks PDF (Untuk stabilo rapi)"
        >
          <FaTextHeight size={14} />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button 
          onClick={() => setActiveTool('DRAWING')}
          className={`p-2 rounded-lg transition-colors ${activeTool === 'DRAWING' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          title="Coretan Bebas (Pen)"
        >
          <FaPen size={14} />
        </button>
        <button 
          onClick={() => setActiveTool('HIGHLIGHT')}
          className={`p-2 rounded-lg transition-colors ${activeTool === 'HIGHLIGHT' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          title="Stabilo (Highlight)"
        >
          <FaHighlighter size={14} />
        </button>
        <button 
          onClick={() => setActiveTool('TEXTBOX')}
          className={`p-2 rounded-lg transition-colors ${activeTool === 'TEXTBOX' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          title="Teks (Text Box)"
        >
          <FaFont size={14} />
        </button>
        <button 
          onClick={() => setActiveTool('STICKY')}
          className={`p-2 rounded-lg transition-colors ${activeTool === 'STICKY' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          title="Komentar Tersemat (Sticky)"
        >
          <FaRegCommentDots size={14} />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button 
          onClick={() => setActiveTool('ERASER')}
          className={`p-2 rounded-lg transition-colors ${activeTool === 'ERASER' ? 'bg-red-500/20 text-red-500' : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'}`}
          title="Hapus Anotasi (Klik pada anotasi yang ingin dihapus)"
        >
          <FaEraser size={14} />
        </button>
      </div>

      <div className="flex items-center gap-1 pl-1 border-r border-border pr-3">
         <span className="text-gray-500 mr-1"><FaPalette size={14}/></span>
         {COLORS.map(color => (
            <button
               key={color}
               onClick={() => setActiveColor(color)}
               className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
               style={{ backgroundColor: color }}
               title={color}
            />
         ))}
      </div>

      <div className="flex items-center gap-2 pl-1 pr-2">
        <label className="text-xs text-gray-400 flex items-center gap-2">
           Ukuran:
           <input 
             type="range" 
             min="1" 
             max="20" 
             value={strokeWidth} 
             onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
             className="w-20 accent-primary"
             title={`Ketebalan: ${strokeWidth}px`}
           />
        </label>
      </div>

      {isSaving && (
        <div className="ml-2 text-xs text-primary animate-pulse flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Menyimpan...
        </div>
      )}
    </div>
  );
}
