"use client"

import React from 'react';
import { Frame } from '@/lib/types';
import { Plus, Trash2, Copy } from 'lucide-react';
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
    <div className="w-full sketch-card bg-white p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase text-foreground/60 tracking-wider">Timeline</span>
          <span className="text-[10px] bg-accent/30 border border-accent/50 px-2 py-0.5 rounded-full font-bold">
            Frame {currentFrameIndex + 1} of {frames.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={duplicateFrame} className="p-1.5 hover:bg-accent/20 rounded transition-colors" title="Duplicate Frame">
            <Copy size={14} />
          </button>
          <button onClick={deleteFrame} className="p-1.5 hover:bg-accent/20 rounded transition-colors" title="Delete Frame">
            <Trash2 size={14} />
          </button>
          <button onClick={addFrame} className="p-1.5 bg-accent/20 hover:bg-accent transition-colors rounded sketch-border border-accent" title="Add Frame">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-accent">
        {frames.map((frame, index) => {
          // Find the first visible layer with data to show in preview
          const previewLayer = [...frame.layers].find(l => l.imageData && l.visible);
          
          return (
            <div 
              key={frame.id}
              onClick={() => setCurrentFrameIndex(index)}
              className={cn(
                "min-w-[70px] h-[50px] sketch-border bg-white cursor-pointer relative transition-all overflow-hidden flex items-center justify-center group",
                currentFrameIndex === index ? "border-accent scale-105 z-10 shadow-md ring-2 ring-accent/20" : "hover:border-accent/50 opacity-70 hover:opacity-100"
              )}
            >
              {previewLayer ? (
                <img src={previewLayer.imageData} alt={`Frame ${index + 1}`} className="max-w-full max-h-full object-contain pointer-events-none" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                  <span className="text-[8px] text-foreground/20 italic">Empty</span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-foreground/10 text-[8px] px-1 font-bold">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
