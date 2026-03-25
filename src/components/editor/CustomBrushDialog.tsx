"use client"

import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Edit3, Trash2, Check, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Layer } from '@/lib/types';

interface CustomBrushDialogProps {
  onSave: (dataUrl: string) => void;
  currentBrush: string | null;
  layers: Layer[];
  width: number;
  height: number;
}

export const CustomBrushDialog: React.FC<CustomBrushDialogProps> = ({ 
  onSave, 
  currentBrush, 
  layers,
  width,
  height
}) => {
  const [mode, setMode] = useState<'import' | 'draw' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  const BRUSH_SIZE = 256;

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, BRUSH_SIZE, BRUSH_SIZE);
        // We use transparency for the draw tip mode
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, BRUSH_SIZE, BRUSH_SIZE);
      }
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = (('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;

    const scaleX = BRUSH_SIZE / rect.width;
    const scaleY = BRUSH_SIZE / rect.height;

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x * scaleX, y * scaleY, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, BRUSH_SIZE, BRUSH_SIZE);
      setHasDrawing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onSave(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureFromFrame = async () => {
    if (!layers || layers.length === 0) return;
    
    // Create a temporary canvas to flatten all visible layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext('2d')!;
    
    // Draw all visible layers from bottom to top
    const visibleLayers = [...layers].reverse().filter(l => l.visible && l.imageData);
    
    for (const layer of visibleLayers) {
      await new Promise((resolve) => {
        const img = new Image();
        img.src = layer.imageData;
        img.onload = () => {
          tCtx.drawImage(img, 0, 0);
          resolve(null);
        };
        img.onerror = () => resolve(null);
      });
    }

    // Now crop and scale the center to BRUSH_SIZE
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = BRUSH_SIZE;
    cropCanvas.height = BRUSH_SIZE;
    const cCtx = cropCanvas.getContext('2d')!;
    
    const minDim = Math.min(width, height);
    const sx = (width - minDim) / 2;
    const sy = (height - minDim) / 2;
    
    cCtx.drawImage(tempCanvas, sx, sy, minDim, minDim, 0, 0, BRUSH_SIZE, BRUSH_SIZE);
    onSave(cropCanvas.toDataURL());
  };

  const saveDrawing = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && setMode(null)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full text-xs sketch-border justify-start gap-2 h-8 px-2">
          <Edit3 size={14} />
          Create Custom Tip
        </Button>
      </DialogTrigger>
      <DialogContent className="sketch-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-widest">Brush Designer</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-2">
            <div 
              onClick={() => setMode('import')}
              className={cn(
                "sketch-border p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors hover:bg-accent/10",
                mode === 'import' && "bg-accent/20 border-accent"
              )}
            >
              <Upload size={24} className="opacity-50" />
              <p className="font-bold text-[10px] text-center">Import Image</p>
            </div>

            <div 
              onClick={() => setMode('draw')}
              className={cn(
                "sketch-border p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors hover:bg-accent/10",
                mode === 'draw' && "bg-accent/20 border-accent"
              )}
            >
              <Edit3 size={24} className="opacity-50" />
              <p className="font-bold text-[10px] text-center">Draw Tip</p>
            </div>

            <div 
              onClick={handleCaptureFromFrame}
              className="sketch-border p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors hover:bg-accent/10"
            >
              <Scissors size={24} className="opacity-50" />
              <p className="font-bold text-[10px] text-center">Capture Canvas</p>
            </div>
          </div>

          {mode === 'import' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="w-full text-xs sketch-border p-2 bg-background"
              />
              <p className="text-[9px] mt-2 opacity-50 italic">Upload images with transparency for best results.</p>
            </div>
          )}

          {mode === 'draw' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col items-center gap-4">
              <div className="relative sketch-border bg-slate-50 shadow-inner w-full aspect-square max-w-[256px] pattern-checkered">
                <canvas
                  ref={canvasRef}
                  width={BRUSH_SIZE}
                  height={BRUSH_SIZE}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair touch-none w-full h-full"
                />
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="sm" onClick={clearCanvas} className="flex-1 gap-2">
                  <Trash2 size={14} /> Clear
                </Button>
                <Button size="sm" onClick={saveDrawing} disabled={!hasDrawing} className="flex-1 bg-accent hover:bg-accent/90 gap-2">
                  <Check size={14} /> Use Tip
                </Button>
              </div>
            </div>
          )}

          {currentBrush && (
            <div className="pt-4 border-t">
              <p className="text-[10px] font-bold uppercase opacity-50 mb-2">Active Tip Preview</p>
              <div className="flex items-center gap-3 bg-background p-2 sketch-border">
                <div className="w-16 h-16 sketch-border bg-white flex items-center justify-center p-1 pattern-checkered">
                  <img src={currentBrush} alt="Brush Tip" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold">Custom Tip Registered</p>
                  <p className="text-[9px] opacity-60">This tip will be used when the "Custom Brush" tool is selected.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
