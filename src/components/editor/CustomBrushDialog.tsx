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
import { Upload, Edit3, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomBrushDialogProps {
  onSave: (dataUrl: string) => void;
  currentBrush: string | null;
}

export const CustomBrushDialog: React.FC<CustomBrushDialogProps> = ({ onSave, currentBrush }) => {
  const [mode, setMode] = useState<'import' | 'draw' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 128, 128);
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
    const x = (('touches' in e) ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (('touches' in e) ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 128, 128);
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

  const saveDrawing = () => {
    if (canvasRef.current) {
      // We want to save a version where black pixels are the "brush"
      // and white pixels are transparent.
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 128;
      tempCanvas.height = 128;
      const tempCtx = tempCanvas.getContext('2d')!;
      
      const sourceCtx = canvasRef.current.getContext('2d')!;
      const imgData = sourceCtx.getImageData(0, 0, 128, 128);
      
      // Convert white pixels to transparent
      for (let i = 0; i < imgData.data.length; i += 4) {
        const r = imgData.data[i];
        const g = imgData.data[i+1];
        const b = imgData.data[i+2];
        if (r > 200 && g > 200 && b > 200) {
          imgData.data[i+3] = 0;
        }
      }
      
      tempCtx.putImageData(imgData, 0, 0);
      onSave(tempCanvas.toDataURL());
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && setMode(null)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full text-xs sketch-border justify-start gap-2 h-8 px-2">
          <Edit3 size={14} />
          Custom Brush
        </Button>
      </DialogTrigger>
      <DialogContent className="sketch-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-widest">Brush Engine Customization</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setMode('import')}
              className={cn(
                "sketch-border p-4 flex flex-col items-center gap-3 cursor-pointer transition-colors hover:bg-accent/10",
                mode === 'import' && "bg-accent/20 border-accent"
              )}
            >
              <Upload size={32} className="opacity-50" />
              <div className="text-center">
                <p className="font-bold text-xs">Import Image</p>
                <p className="text-[10px] opacity-60">Use a PNG/JPG as a brush</p>
              </div>
            </div>

            <div 
              onClick={() => setMode('draw')}
              className={cn(
                "sketch-border p-4 flex flex-col items-center gap-3 cursor-pointer transition-colors hover:bg-accent/10",
                mode === 'draw' && "bg-accent/20 border-accent"
              )}
            >
              <Edit3 size={32} className="opacity-50" />
              <div className="text-center">
                <p className="font-bold text-xs">Draw Brush</p>
                <p className="text-[10px] opacity-60">Design your own tip</p>
              </div>
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
              <p className="text-[9px] mt-2 opacity-50 italic">Tip: Use an image with a transparent background for best results.</p>
            </div>
          )}

          {mode === 'draw' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col items-center gap-4">
              <div className="relative sketch-border bg-white shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={128}
                  height={128}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair touch-none"
                />
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="sm" onClick={clearCanvas} className="flex-1 gap-2">
                  <Trash2 size={14} /> Clear
                </Button>
                <Button size="sm" onClick={saveDrawing} disabled={!hasDrawing} className="flex-1 bg-accent hover:bg-accent/90 gap-2">
                  <Check size={14} /> Use Drawing
                </Button>
              </div>
            </div>
          )}

          {currentBrush && (
            <div className="pt-4 border-t">
              <p className="text-[10px] font-bold uppercase opacity-50 mb-2">Current Active Tip</p>
              <div className="flex items-center gap-3 bg-background p-2 sketch-border">
                <div className="w-12 h-12 sketch-border bg-white flex items-center justify-center p-1">
                  <img src={currentBrush} alt="Brush Tip" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold">Custom Tip Active</p>
                  <p className="text-[9px] opacity-60">This tip will be used when "Custom Brush" is selected in the sidebar.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
