
"use client"

import React, { useState } from 'react';
import { Frame } from '@/lib/types';
import { Plus, Trash2, Copy, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  frames: Frame[];
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
  currentFrameIndex,
  selectedFrameIndices,
  onSelectFrame,
  addFrame,
  deleteFrame,
  duplicateFrame,
  reorderFrames,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  const handleClick = (e: React.MouseEvent, index: number) => {
    const multi = e.ctrlKey || e.metaKey;
    const range = e.shiftKey;
    onSelectFrame(index, multi, range);
  };

  return (
    <div className="w-full sketch-card bg-white p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase text-foreground/60 tracking-wider">Timeline</span>
          <span className="text-[10px] bg-accent/30 border border-accent/50 px-2 py-0.5 rounded-full font-bold">
            {selectedFrameIndices.length > 1 
              ? `${selectedFrameIndices.length} Frames Selected` 
              : `Frame ${currentFrameIndex + 1} of ${frames.length}`}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={duplicateFrame} 
            className="p-1.5 hover:bg-accent/20 rounded transition-colors" 
            title={selectedFrameIndices.length > 1 ? "Duplicate Selected Frames" : "Duplicate Frame"}
          >
            <Copy size={14} />
          </button>
          <button 
            onClick={deleteFrame} 
            className="p-1.5 hover:bg-accent/20 rounded transition-colors" 
            title={selectedFrameIndices.length > 1 ? "Delete Selected Frames" : "Delete Frame"}
          >
            <Trash2 size={14} />
          </button>
          <button 
            onClick={addFrame} 
            className="p-1.5 bg-accent/20 hover:bg-accent transition-colors rounded sketch-border border-accent" 
            title="Add Frame"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-accent">
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
              onClick={(e) => handleClick(e, index)}
              className={cn(
                "min-w-[70px] h-[50px] sketch-border bg-white cursor-pointer relative transition-all overflow-hidden flex items-center justify-center group",
                isActive ? "border-accent scale-105 z-10 shadow-md ring-2 ring-accent/20" : "hover:border-accent/50 opacity-70 hover:opacity-100",
                isSelected && !isActive ? "border-accent/60 bg-accent/5" : "",
                draggedIndex === index && "opacity-30 border-dashed"
              )}
            >
              <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={10} className="text-foreground/30" />
              </div>
              
              {previewLayer ? (
                <img src={previewLayer.imageData} alt={`Frame ${index + 1}`} className="max-w-full max-h-full object-contain pointer-events-none" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                  <span className="text-[8px] text-foreground/20 italic">Empty</span>
                </div>
              )}
              <div className={cn(
                "absolute bottom-0 right-0 text-[8px] px-1 font-bold",
                isSelected ? "bg-accent text-white" : "bg-foreground/10"
              )}>
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
