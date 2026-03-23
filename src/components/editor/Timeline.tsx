"use client"

import React from 'react';
import { Frame } from '@/lib/types';
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  frames: Frame[];
  currentFrameIndex: number;
  setCurrentFrameIndex: (index: number) => void;
  addFrame: () => void;
  deleteFrame: () => void;
  duplicateFrame: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  frames,
  currentFrameIndex,
  setCurrentFrameIndex,
  addFrame,
  deleteFrame,
  duplicateFrame,
}) => {
  return (
    <div className="w-full sketch-card bg-white h-32 flex flex-col gap-2 overflow-hidden">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase text-foreground/60">Frames</span>
          <span className="text-xs bg-accent px-2 py-0.5 rounded-full">{currentFrameIndex + 1} / {frames.length}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={duplicateFrame} className="p-1 hover:bg-accent/20 rounded transition-colors" title="Duplicate Frame">
            <Copy size={16} />
          </button>
          <button onClick={deleteFrame} className="p-1 hover:bg-accent/20 rounded transition-colors" title="Delete Frame">
            <Trash2 size={16} />
          </button>
          <button onClick={addFrame} className="p-1 hover:bg-accent/20 rounded transition-colors" title="Add Frame">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-2 overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-accent">
        {frames.map((frame, index) => (
          <div 
            key={frame.id}
            onClick={() => setCurrentFrameIndex(index)}
            className={cn(
              "min-w-[80px] h-[60px] sketch-border bg-white cursor-pointer relative transition-all overflow-hidden flex items-center justify-center group",
              currentFrameIndex === index ? "border-accent scale-105 z-10 shadow-md" : "hover:border-accent/50"
            )}
          >
            {frame.imageData ? (
              <img src={frame.imageData} alt={`Frame ${index + 1}`} className="max-w-full max-h-full object-contain pointer-events-none" />
            ) : (
              <span className="text-[10px] text-foreground/20 italic">Empty</span>
            )}
            <div className="absolute top-0 left-0 bg-foreground/10 text-[8px] px-1 font-bold">
              {index + 1}
            </div>
          </div>
        ))}
        <button 
          onClick={addFrame}
          className="min-w-[80px] h-[60px] border-2 border-dashed border-foreground/30 flex items-center justify-center hover:bg-accent/10 transition-colors"
        >
          <Plus size={20} className="text-foreground/30" />
        </button>
      </div>
    </div>
  );
};
