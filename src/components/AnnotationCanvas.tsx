"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { ToolType } from "./AnnotationToolbar";

interface Props {
  baseWidth: number;
  baseHeight: number;
  scale: number;
  annotations: any[];
  isEditable: boolean;
  activeTool: ToolType;
  activeColor: string;
  strokeWidth: number;
  onSave: (tipe: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function AnnotationCanvas({
  baseWidth,
  baseHeight,
  scale,
  annotations,
  isEditable,
  activeTool,
  activeColor,
  strokeWidth,
  onSave,
  onDelete
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fbCanvas, setFbCanvas] = useState<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // In Fabric v6, initialization is async or straight forward depending on the build, we use the standard approach
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: baseWidth * scale,
      height: baseHeight * scale,
      selection: isEditable && activeTool === 'NONE',
      isDrawingMode: isEditable && activeTool === 'DRAWING',
    });
    
    // Zoom ensures all drawing coordinates inside fabric are relative to baseWidth
    canvas.setZoom(scale);

    setFbCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [baseWidth, baseHeight, scale]); // Only reinit if size changes

  // Update Drawing Mode
  useEffect(() => {
    if (!fbCanvas) return;
    
    fbCanvas.isDrawingMode = isEditable && activeTool === 'DRAWING';
    if (fbCanvas.isDrawingMode) {
      fbCanvas.freeDrawingBrush = new fabric.PencilBrush(fbCanvas);
      fbCanvas.freeDrawingBrush.color = activeColor;
      fbCanvas.freeDrawingBrush.width = strokeWidth;
    }
    
    fbCanvas.selection = isEditable && activeTool === 'NONE';
    
    // Set cursor based on tool
    if (activeTool === 'HIGHLIGHT') fbCanvas.defaultCursor = 'text';
    else if (activeTool === 'TEXTBOX') fbCanvas.defaultCursor = 'text';
    else if (activeTool === 'STICKY') fbCanvas.defaultCursor = 'crosshair';
    else if (activeTool === 'ERASER') fbCanvas.defaultCursor = 'url(/eraser.png), pointer'; // fallback crosshair
    else fbCanvas.defaultCursor = 'default';

  }, [fbCanvas, isEditable, activeTool, activeColor, strokeWidth]);

  // Handle Free Drawing finish
  useEffect(() => {
    if (!fbCanvas || !isEditable) return;

    const handlePathCreated = async (e: any) => {
      if (activeTool === 'DRAWING') {
        const path = e.path;
        if (!path) return;
        
        // Disable temporarily while saving
        path.set({ selectable: false, evented: false });
        
        // Save to DB
        await onSave('DRAWING', path.toObject());
      }
    };

    fbCanvas.on('path:created', handlePathCreated);
    return () => { fbCanvas.off('path:created', handlePathCreated); };
  }, [fbCanvas, isEditable, activeTool, onSave]);

  // Mouse Events for Highlight, Sticky, Textbox, and Eraser
  useEffect(() => {
    if (!fbCanvas || !isEditable) return;

    let rectParams = { x: 0, y: 0 };
    let tempObj: fabric.Object | null = null;

    const handleMouseDown = async (o: any) => {
      const pointer = o.scenePoint || (fbCanvas as any).getPointer?.(o.e) || {x:0, y:0};
      
      if (activeTool === 'ERASER') {
         // o.target contains the clicked object in fabric
         const target = o.target;
         if (target && target.data?.id) {
           await onDelete(target.data.id);
         }
         return;
      }

      if (activeTool === 'HIGHLIGHT') {
        isDrawing.current = true;
        rectParams = { x: pointer.x, y: pointer.y };
        
        const rect = new fabric.Rect({
          originX: 'left',
          originY: 'top',
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: activeColor,
          opacity: 0.4, // transparent for highlight
          globalCompositeOperation: 'multiply',
          selectable: false,
          evented: false,
        });
        
        tempObj = rect;
        fbCanvas.add(rect);
      }
      
      if (activeTool === 'STICKY') {
         // Create a simple Sticky note visualization (e.g. a colored square or circle)
         const stickyText = window.prompt("Masukkan komentar tersemat:");
         if (stickyText && stickyText.trim()) {
            const data = {
               left: pointer.x,
               top: pointer.y,
               text: stickyText,
               color: activeColor
            };
            await onSave('STICKY', data);
         }
      }
      
      if (activeTool === 'TEXTBOX') {
        const text = new fabric.IText('Ketik disini...', {
          originX: 'left',
          originY: 'top',
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'sans-serif',
          fontSize: 16 + (strokeWidth * 2), // Scale font somewhat with size slider
          fill: activeColor,
          editable: true,
        });
        fbCanvas.add(text);
        fbCanvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        
        // We only save text after editing is done
        text.on('editing:exited', async () => {
           if (text.text && text.text.trim()) {
             await onSave('TEXTBOX', text.toObject());
           } else {
             fbCanvas.remove(text);
           }
        });
      }
    };

    const handleMouseMove = (o: any) => {
      if (!isDrawing.current || activeTool !== 'HIGHLIGHT') return;
      
      const pointer = o.scenePoint || (fbCanvas as any).getPointer?.(o.e) || {x:0, y:0};
      if (tempObj && tempObj instanceof fabric.Rect) {
        if (pointer.x > rectParams.x) {
           tempObj.set({ width: pointer.x - rectParams.x });
        } else {
           tempObj.set({ left: pointer.x, width: rectParams.x - pointer.x });
        }
        
        if (pointer.y > rectParams.y) {
           tempObj.set({ height: pointer.y - rectParams.y });
        } else {
           tempObj.set({ top: pointer.y, height: rectParams.y - pointer.y });
        }
        fbCanvas.renderAll();
      }
    };

    const handleMouseUp = async (o: any) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      
      if (activeTool === 'HIGHLIGHT' && tempObj) {
         const obj = tempObj.toObject();
         // Basic validation to avoid zero-width/height highlights
         if (obj.width && obj.height && obj.width > 5 && obj.height > 5) {
            await onSave('HIGHLIGHT', obj);
         } else {
            fbCanvas.remove(tempObj);
         }
         tempObj = null;
      }
    };

    fbCanvas.on('mouse:down', handleMouseDown);
    fbCanvas.on('mouse:move', handleMouseMove);
    fbCanvas.on('mouse:up', handleMouseUp);

    return () => {
      fbCanvas.off('mouse:down', handleMouseDown);
      fbCanvas.off('mouse:move', handleMouseMove);
      fbCanvas.off('mouse:up', handleMouseUp);
    };
  }, [fbCanvas, isEditable, activeTool, activeColor, onSave, onDelete]);

  // Load Annotations from DB
  useEffect(() => {
    if (!fbCanvas) return;
    
    // Clear existing objects first to prevent duplicates
    fbCanvas.clear();
    
    // Function to process and add objects
    const loadData = async () => {
       for (const ann of annotations) {
          try {
             if (ann.tipe === 'DRAWING' || ann.tipe === 'HIGHLIGHT' || ann.tipe === 'TEXTBOX') {
                const jsonObj = ann.data;
                // Add id properties to track for deletion
                const enlivenObj = await fabric.util.enlivenObjects([jsonObj]);
                const obj = enlivenObj[0] as any;
                if (obj) {
                   obj.set({
                      selectable: false,
                      evented: isEditable,
                      data: { id: ann.id }  // Store ID in obj.data for eraser tool
                   });
                   fbCanvas.add(obj);
                }
             } else if (ann.tipe === 'STICKY') {
                // Manually draw sticky icon representing the comment
                const { left, top, color, text } = ann.data;
                
                const group: any = new fabric.Group([
                   new fabric.Circle({ radius: 10, fill: color, top: 0, left: 0 }),
                   new fabric.Text('i', { fontSize: 14, fill: '#fff', top: 3, left: 8, fontFamily: 'sans-serif' })
                ], {
                   left, top, selectable: false, evented: true, hoverCursor: 'pointer'
                });
                
                group.data = { id: ann.id, text };
                
                // Show tooltip on hover
                group.on('mouseover', () => {
                   // This is a simple implementation. A better UX would use a DOM tooltip overlapping the canvas
                   // based on the left/top coordinates
                   console.log("Sticky comment text:", text);
                });
                
                fbCanvas.add(group);
             }
          } catch(e) {
             console.error("Error loading annotation", e);
          }
       }
       fbCanvas.renderAll();
    };
    
    loadData();

  }, [fbCanvas, annotations, isEditable]);

  return (
    <div className={`absolute inset-0 z-10 ${activeTool === 'TEXT_SELECT' ? 'pointer-events-none' : 'pointer-events-auto'}`} style={{ width: baseWidth * scale, height: baseHeight * scale }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
