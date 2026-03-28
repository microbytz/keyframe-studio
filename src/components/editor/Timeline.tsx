
"use client"

import React, { useState } from 'react';
import { Frame, FrameGroup } from '@/lib/types';
import { Plus, Trash2, Copy, ZoomIn, ZoomOut, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface TimelineProps {
  frames: Frame[];
  groups?: FrameGroup[];
  currentFrameIndex: number;
  selectedFrameIndices: number[];
  onSelectFrame: (index: number, multi?: boolean, range?: boolean) => void;
  addFrame: () => void;
  deleteFrame: () => void;
  duplicateFrame: () => void;
  reorderFrames: (startIndex: number, endIndex: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  frames,
  groups = [],
  currentFrameIndex,
  selectedFrameIndices,
  onSelectFrame,
  addFrame,
  deleteFrame,
  duplicateFrame,
  reorderFrames,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderFrames(draggedIndex, index);
    }
    setDraggedIndex(null);
  };

  // Base dimensions for scaling - reduced height to maintain professional look in smaller dock
  const baseWidth = 200;
  const baseHeight = 120;

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Timeline</span>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <ZoomOut size={12} className="text-white/30" />
            <Slider 
              value={[zoom]} 
              min={0.5} 
              max={1.5} 
              step={0.1} 
              onValueChange={([v]) => setZoom(v)} 
              className="w-32 h-4"
            />
            <ZoomIn size={12} className="text-white/30" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
           <button onClick={duplicateFrame} className="studio-icon-btn p-1.5" title="Duplicate Selected"><Copy size={12} /></button>
           <button onClick={deleteFrame} className="studio-icon-btn p-1.5 hover:text-red-400" title="Delete Selected"><Trash2 size={12} /></button>
           <button onClick={addFrame} className="studio-icon-btn p-1.5 text-white/90 bg-white/10 border border-white/20" title="New Frame"><Plus size={12} /></button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-none items-center">
        {frames.map((frame, index) => {
          const previewLayer = [...frame.layers].find(l => l.imageData && l.visible);
          const isSelected = selectedFrameIndices.includes(index);
          const isActive = currentFrameIndex === index;
          
          return (
            <div 
              key={frame.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => setDraggedIndex(null)}
              onClick={(e) => onSelectFrame(index, e.ctrlKey || e.metaKey, e.shiftKey)}
              style={{ 
                minWidth: `${baseWidth * zoom}px`, 
                height: `${baseHeight * zoom}px`
              }}
              className={cn(
                "sketch-border bg-white cursor-pointer relative transition-all overflow-hidden flex items-center justify-center shrink-0 rounded-sm",
                isActive ? "border-white/90 ring-2 ring-white/30 scale-105 z-10 shadow-xl" : "opacity-60 hover:opacity-100",
                isSelected && !isActive ? "border-white/50" : "",
                draggedIndex === index && "opacity-20 border-dashed"
              )}
            >
              <div className="absolute inset-0 pattern-checkered opacity-5" />
              {previewLayer ? (
                <img src={previewLayer.imageData} alt={`F${index + 1}`} className="max-w-full max-h-full object-contain pointer-events-none relative z-10" />
              ) : (
                <span className="text-[10px] text-black/20 font-bold uppercase relative z-10">Empty</span>
              )}
              <div className="absolute bottom-0 right-0 text-[8px] px-1.5 py-0.5 font-bold bg-black/80 text-white rounded-tl-sm z-20">{index + 1}</div>
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/80 z-30" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
