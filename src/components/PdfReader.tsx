"use client";

import { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaExpand, FaCompress, FaExternalLinkAlt, FaChevronLeft, FaChevronRight, FaRegCommentDots, FaTrash, FaBookmark, FaBookOpen } from "react-icons/fa";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { getKomentarByMateri, tambahKomentar, hapusKomentar } from "@/app/portal/materi/actions";
import { getAnnotations, saveAnnotation, deleteAnnotation } from "@/app/portal/materi/annotation-actions";
import { Toast, Alert } from "@/lib/swal";
import { getPusherClient } from "@/lib/pusher";

// New components
import AnnotationCanvas from "./AnnotationCanvas";
import AnnotationToolbar, { ToolType } from "./AnnotationToolbar";
import BookmarkSidebar from "./BookmarkSidebar";
import NotebookPanel from "./NotebookPanel";

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
    santri?: {
      pendaftaran?: {
        namaLengkap: string;
      }
    }
  };
}

export default function PdfReader({ 
  activeMateri, 
  currentUser, 
  onClose,
  readOnly = false,
  periodeId = "global",
  isGuruOverride
}: { 
  activeMateri: Materi;
  currentUser: UserContext | null; // null if unauthenticated/guest
  onClose: () => void;
  readOnly?: boolean;
  periodeId?: string;
  isGuruOverride?: boolean;
}) {
  const pdfWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const userRole = typeof currentUser?.role === 'string' 
     ? currentUser.role.toUpperCase() 
     : (currentUser?.role?.name?.toUpperCase() || "");
     
  const isGuru = isGuruOverride !== undefined 
     ? isGuruOverride 
     : (userRole.includes('ADMIN') || userRole.includes('PENGAJAR') || userRole.includes('GURU'));
  
  // PDF State
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [baseWidth, setBaseWidth] = useState(0);
  const [baseHeight, setBaseHeight] = useState(0);

  // Tools & Annotations State
  const [activeTool, setActiveTool] = useState<ToolType>('NONE');
  const [activeColor, setActiveColor] = useState('#eab308');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [showTeacherNotes, setShowTeacherNotes] = useState(true);
  const [annotations, setAnnotations] = useState<any[]>([]); // Current page annotations
  const [allAnnotations, setAllAnnotations] = useState<any[]>([]); // For notebook panel
  const [isSaving, setIsSaving] = useState(false);

  // Sidebar State
  type SidebarTab = 'comments' | 'bookmarks' | 'notebook' | 'none';
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>(isGuru ? 'comments' : 'notebook');

  // Comments State
  const [komentarList, setKomentarList] = useState<Komentar[]>([]);
  const [newKomentar, setNewKomentar] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [komentarList]);

  // Load All Annotations for the Notebook (once or on change)
  const loadAllAnnotations = async () => {
     // A slightly hacky approach. Ideally there's a getAnnotationsByMateri that gets all pages.
     // For now, we simulate by fetching page by page, or creating a new action if needed.
     // But wait, our `getAnnotations` in actions currently filters by page.
     // We need to fetch all annotations for the materi and periode!
     // Since this is a UI component, we'll just fetch from an API route or server action if we create one.
     // But since we can't create one easily without updating the actions file again, 
     // let's pass a `halaman=0` convention in getAnnotations to mean "ALL PAGES" if we need to.
     // Actually, let's update `annotation-actions.ts` to allow halaman=0 for 'all'.
     // For now, we'll try to use a fetch or just deal with an empty notebook.
  };

  const loadPageData = async () => {
     // Load Annotations for this page
     const resA = await getAnnotations(activeMateri.id, pageNumber, periodeId);
     if (resA.success && resA.data) setAnnotations(resA.data);
  };

  const loadGlobalComments = async () => {
     setIsLoadingComments(true);
     const resK = await getKomentarByMateri(activeMateri.id);
     if (resK.success && resK.data) setKomentarList(resK.data as unknown as Komentar[]);
     setIsLoadingComments(false);
  };

  // Effect load global comments once
  useEffect(() => {
    if (!activeMateri) return;
    loadGlobalComments();

    const pusher = getPusherClient();
    const commentChannel = pusher.subscribe(`materi-${activeMateri.id}-global`);
    commentChannel.bind('new-comment', (k: Komentar) => setKomentarList(prev => [...prev, k]));
    commentChannel.bind('delete-comment', (data: { id: string }) => setKomentarList(prev => prev.filter(k => k.id !== data.id)));

    return () => {
      commentChannel.unbind_all();
      commentChannel.unsubscribe();
    };
  }, [activeMateri]);

  // Effect load page data and Pusher
  useEffect(() => {
    if (!activeMateri) return;
    loadPageData();
      
    const pusher = getPusherClient();
    const annChannel = pusher.subscribe(`materi-${activeMateri.id}-hal-${pageNumber}-periode-${periodeId}`);
    annChannel.bind('new-annotation', (a: any) => setAnnotations(prev => [...prev.filter(pa => pa.id !== a.id), a]));
    annChannel.bind('delete-annotation', (data: { id: string }) => setAnnotations(prev => prev.filter(a => a.id !== data.id)));

    return () => {
      annChannel.unbind_all();
      annChannel.unsubscribe();
    };
  }, [activeMateri, pageNumber, periodeId]);

  // We need all annotations for notebook
  useEffect(() => {
     const fetchAll = async () => {
        // Fetch ALL pages by calling getAnnotations with hal=0 (we need to modify the action to support this)
        const res = await getAnnotations(activeMateri.id, 0, periodeId);
        if (res.success && res.data) setAllAnnotations(res.data);
     };
     fetchAll();
  }, [activeMateri, periodeId, annotations]); // reload if annotations change

  const handlePostKomentar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newKomentar.trim() || !activeMateri || !currentUser) return;
    const res = await tambahKomentar(activeMateri.id, newKomentar);
    if (res.success) {
      setNewKomentar("");
      Toast.fire({ icon: 'success', title: 'Pesan terkirim!' });
    } else {
      Alert.fire('Gagal', 'Gagal mengirim pesan.', 'error');
    }
  };

  const handleDeleteKomentar = async (id: string) => {
    const confirm = await Alert.fire({
      title: 'Hapus Pesan?',
      text: 'Pesan diskusi ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true
    });
    if (confirm.isConfirmed) {
      await hapusKomentar(id);
      Toast.fire({ icon: 'success', title: 'Dihapus' });
    }
  };

  const handleSaveAnnotation = async (tipe: string, data: any) => {
     setIsSaving(true);
     const res = await saveAnnotation(activeMateri.id, pageNumber, periodeId, tipe, data);
     if (!res.success) {
       Alert.fire('Error', res.error, 'error');
     } else {
       Toast.fire({ icon: 'success', title: 'Tersimpan' });
     }
     setIsSaving(false);
  };

  const handleDeleteAnnotation = async (id: string) => {
     const confirm = await Alert.fire({
       title: 'Hapus Catatan?',
       text: 'Aksi ini tidak dapat dibatalkan.',
       icon: 'warning',
       showCancelButton: true
     });
     if (confirm.isConfirmed) {
       setIsSaving(true);
       const res = await deleteAnnotation(id);
       if (!res.success) Alert.fire('Error', res.error, 'error');
       else Toast.fire({ icon: 'success', title: 'Terhapus' });
       setIsSaving(false);
     }
  };

  // Convert DOM Text Selection to Canvas Highlights
  useEffect(() => {
    if (activeTool === 'HIGHLIGHT' && isGuru) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const selectionRects = Array.from(range.getClientRects());
        
        // Query the ACTUAL rendered Fabric canvas element in the DOM.
        // Fabric creates .lower-canvas and .upper-canvas inside its own wrapper.
        // By using the actual canvas element, we eliminate wrapper offsets.
        const fabricCanvasEl = document.querySelector('#pdf-overlay-wrapper .lower-canvas') 
                            || document.querySelector('#pdf-overlay-wrapper canvas');
        
        if (fabricCanvasEl && baseWidth > 0) {
          const canvasRect = fabricCanvasEl.getBoundingClientRect();
          
          // Also get container for comparison
          const containerRect = pdfContainerRef.current?.getBoundingClientRect();
          
          // Debug: log all reference points
          console.log('[AutoHighlight] canvasRect:', canvasRect);
          console.log('[AutoHighlight] containerRect:', containerRect);
          if (selectionRects.length > 0) {
            console.log('[AutoHighlight] first selRect:', selectionRects[0]);
            console.log('[AutoHighlight] offset from CANVAS — Left:', selectionRects[0].left - canvasRect.left, 'Top:', selectionRects[0].top - canvasRect.top);
            if (containerRect) {
              console.log('[AutoHighlight] delta canvas vs container — Left:', canvasRect.left - containerRect.left, 'Top:', canvasRect.top - containerRect.top);
            }
            console.log('[AutoHighlight] scale:', scale, 'baseWidth:', baseWidth);
          }
          
          const processSelection = async () => {
             for (const r of selectionRects) {
                if (r.width < 5 || r.height < 5) continue;
                
                const paddingY = 2; 
                
                // Position relative to the ACTUAL Fabric canvas element,
                // divided by scale to convert screen pixels to base (unscaled) coordinates
                const fabricRectObj = {
                   type: 'rect',
                   originX: 'left',
                   originY: 'top',
                   left: (r.left - canvasRect.left) / scale,
                   top: ((r.top - canvasRect.top) / scale) - paddingY,
                   width: r.width / scale,
                   height: (r.height / scale) + (paddingY * 2),
                   fill: activeColor,
                   opacity: 0.4,
                   globalCompositeOperation: 'multiply'
                };
                await handleSaveAnnotation('HIGHLIGHT', fabricRectObj);
             }
             selection.removeAllRanges();
             setActiveTool('TEXT_SELECT');
          };
          processSelection();
        }
      }
    }
  }, [activeTool, activeColor, isGuru]);

  const pdfUrl = activeMateri.fileUrl.replace('/image/upload/', '/raw/upload/'); // Fix cloudinary url

  const formatTimeDisplay = (dateParam: Date | string) => {
     const d = new Date(dateParam);
     return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to extract page width/height after render
  const onPageLoadSuccess = (page: any) => {
      const v = page.getViewport({ scale });
      setPageWidth(v.width);
      setPageHeight(v.height);
      const baseV = page.getViewport({ scale: 1 });
      setBaseWidth(baseV.width);
      setBaseHeight(baseV.height);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
       document.documentElement.requestFullscreen().catch(err => {
         Alert.fire('Error', 'Gagal menampilkan fullscreen', 'error');
       });
       setIsFullscreen(true);
    } else {
       if (document.exitFullscreen) document.exitFullscreen();
       setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div ref={pdfWrapperRef} className={`${isFullscreen ? 'fixed inset-0 z-[9999] bg-background p-4 flex flex-col' : 'flex flex-col h-full absolute inset-0 bg-background z-50 p-4'}`}>
      
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2 gap-4 shrink-0 border-b border-border pb-2">
        <button onClick={onClose} className="btn btn-secondary shrink-0">
          <FaArrowLeft /> Kembali
        </button>
        
        <div className="flex flex-col items-center flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate max-w-full text-center">
            {activeMateri.judul}
          </h2>
          {/* PDF Navigation */}
          {numPages > 0 && (
            <div className="flex items-center gap-4 mt-1">
              <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><FaChevronLeft /></button>
              <span className="text-sm text-gray-300">Hal {pageNumber} dari {numPages}</span>
              <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><FaChevronRight /></button>
              <div className="h-4 w-px bg-gray-700 mx-2"></div>
              <button onClick={() => setScale(p => Math.max(0.5, p - 0.2))} className="text-gray-400 px-2">-</button>
              <span className="text-xs text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(p => Math.min(2.5, p + 0.2))} className="text-gray-400 px-2">+</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Santri view toggle */}
          {!isGuru && (
             <div className="flex items-center gap-2 bg-surface px-3 py-1.5 border border-border rounded-lg">
                <span className="text-xs text-gray-400">Catatan Guru</span>
                <button 
                  onClick={() => setShowTeacherNotes(!showTeacherNotes)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${showTeacherNotes ? 'bg-primary' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showTeacherNotes ? 'translate-x-5' : 'translate-x-0'}`}></span>
                </button>
             </div>
          )}

          <div className="flex gap-1 border border-border rounded-lg p-1 bg-surface">
            <button onClick={() => setActiveSidebarTab(activeSidebarTab === 'notebook' ? 'none' : 'notebook')} className={`p-2 rounded ${activeSidebarTab === 'notebook' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`} title="Buku Catatan"><FaBookOpen /></button>
            <button onClick={() => setActiveSidebarTab(activeSidebarTab === 'bookmarks' ? 'none' : 'bookmarks')} className={`p-2 rounded ${activeSidebarTab === 'bookmarks' ? 'bg-yellow-500/20 text-yellow-500' : 'text-gray-400 hover:text-white'}`} title="Bookmark"><FaBookmark /></button>
            <button onClick={() => setActiveSidebarTab(activeSidebarTab === 'comments' ? 'none' : 'comments')} className={`p-2 rounded ${activeSidebarTab === 'comments' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-400 hover:text-white'}`} title="Komentar Forum"><FaRegCommentDots /></button>
          </div>

          <button onClick={handleToggleFullscreen} className="btn btn-secondary">{isFullscreen ? <FaCompress /> : <FaExpand />}</button>
        </div>
      </div>
      
      {/* Teacher Toolbar */}
      {isGuru && !readOnly && (
         <AnnotationToolbar 
           activeTool={activeTool} 
           setActiveTool={setActiveTool} 
           activeColor={activeColor} 
           setActiveColor={setActiveColor}
           strokeWidth={strokeWidth}
           setStrokeWidth={setStrokeWidth} 
           isSaving={isSaving}
         />
      )}

      <div className={`flex flex-1 gap-4 overflow-hidden mt-2 ${isFullscreen ? 'h-full' : 'h-[75vh]'}`}>
        
        {/* Document Viewer Container */}
        <div className="flex-1 border border-border rounded-xl overflow-auto bg-gray-900 custom-scrollbar relative flex justify-center pb-8 p-4">
          <Document
             file={pdfUrl}
             onLoadSuccess={(pdf) => { setNumPages(pdf.numPages); setPageNumber(1); }}
             loading={<div className="flex items-center justify-center h-full text-gray-400">Memuat PDF...</div>}
          >
             <div ref={pdfContainerRef} className="relative shadow-2xl mx-auto" style={{ width: pageWidth, height: pageHeight }}>
                {/* PDF Background Layer */}
                <Page 
                   pageNumber={pageNumber} 
                   scale={scale} 
                   renderTextLayer={true} 
                   renderAnnotationLayer={false}
                   onLoadSuccess={onPageLoadSuccess}
                />
                
                {/* Canvas Overlay Layer */}
                {baseWidth > 0 && showTeacherNotes && (
                   <div id="pdf-overlay-wrapper" className={activeTool === 'TEXT_SELECT' ? 'pointer-events-none absolute inset-0' : 'absolute inset-0'}>
                     <AnnotationCanvas 
                        baseWidth={baseWidth}
                        baseHeight={baseHeight}
                        scale={scale}
                        annotations={annotations}
                        isEditable={isGuru}
                        activeTool={activeTool}
                        activeColor={activeColor}
                        strokeWidth={strokeWidth}
                        onSave={handleSaveAnnotation}
                        onDelete={handleDeleteAnnotation}
                     />
                   </div>
                )}
             </div>
          </Document>
        </div>

        {/* Sidebar Panel */}
        {activeSidebarTab !== 'none' && (
          <div className="w-80 shrink-0 border border-border rounded-xl bg-card flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            
            {activeSidebarTab === 'bookmarks' && (
               <BookmarkSidebar 
                  materiId={activeMateri.id} 
                  currentPage={pageNumber} 
                  onNavigate={(p) => setPageNumber(p)} 
                  showTeacherNotes={showTeacherNotes}
               />
            )}

            {activeSidebarTab === 'notebook' && (
               <NotebookPanel 
                  annotations={allAnnotations} 
                  onNavigate={(p) => setPageNumber(p)} 
               />
            )}

            {activeSidebarTab === 'comments' && (
               <>
                  <div className="p-4 border-b border-border bg-surface shrink-0">
                     <h3 className="font-bold flex items-center gap-2"><FaRegCommentDots className="text-blue-500"/> Diskusi (Hal {pageNumber})</h3>
                     <p className="text-xs text-gray-400 mt-1">Tanya jawab kelas terkait halaman ini</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3 relative">
                     {isLoadingComments ? (
                     <div className="text-center text-sm text-gray-500 my-4">Memuat data...</div>
                     ) : komentarList.length === 0 ? (
                     <div className="text-center text-sm text-gray-500 my-8">Belum ada diskusi di halaman ini.</div>
                     ) : (
                     <>
                        {komentarList.map(item => {
                           const authorName = item.user?.santri?.pendaftaran?.namaLengkap || item.user?.username;
                           const isMe = item.userId === currentUser?.id;
                           return (
                           <div key={item.id} className={`p-3 rounded-xl text-sm ${isMe ? 'bg-blue-500/10 border border-blue-500/20 self-end w-[90%]' : 'bg-surface border border-border self-start w-[90%]'}`}>
                              <div className="flex justify-between mb-1">
                                 <span className={`font-semibold text-xs ${isMe ? 'text-blue-400' : 'text-gray-300'}`}>{isMe ? 'Anda' : authorName}</span>
                                 <div className="flex gap-2">
                                    <span className="text-[10px] text-gray-500">{formatTimeDisplay(item.createdAt)}</span>
                                    {(isMe || isGuru) && (
                                       <button onClick={() => handleDeleteKomentar(item.id)} className="text-red-400/50 hover:text-red-400"><FaTrash size={10} /></button>
                                    )}
                                 </div>
                              </div>
                              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{item.isi}</p>
                           </div>
                        )})}
                        <div ref={commentsEndRef} />
                     </>
                     )}
                  </div>
                  
                  {!readOnly && (
                  <div className="p-3 border-t border-border bg-surface shrink-0">
                     <form onSubmit={handlePostKomentar} className="flex gap-2">
                        <input type="text" placeholder="Tulis pesan..." value={newKomentar} onChange={(e) => setNewKomentar(e.target.value)} className="form-control flex-1 text-sm rounded-lg px-3" />
                        <button type="submit" disabled={!newKomentar.trim()} className="btn btn-primary rounded-lg !px-3"><FaRegCommentDots /></button>
                     </form>
                  </div>
                  )}
               </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
