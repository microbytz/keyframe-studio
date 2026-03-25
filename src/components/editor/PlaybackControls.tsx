"use client"

import React from 'react';
import { Play, Pause, FastForward, Rewind, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FrameGroup } from '@/lib/types';

interface PlaybackControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  fps: number;
  setFps: (fps: number) => void;
  onPrev: () => void;
  onNext: () => void;
  activeGroup?: FrameGroup;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  togglePlayback,
  fps,
  setFps,
  onPrev,
  onNext,
  activeGroup
}) => {
  return (
    <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 sketch-card bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-0.5 md:gap-1">
        <button onClick={onPrev} className="p-1 md:p-1.5 hover:bg-accent/20 rounded-full transition-colors">
          <Rewind size={14} className="md:w-4 md:h-4" />
        </button>
        <button 
          onClick={togglePlayback}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-accent sketch-border hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause size={14} className="md:w-4 md:h-4" /> : <Play size={14} className="md:w-4 md:h-4 ml-0.5" />}
        </button>
        <button onClick={onNext} className="p-1 md:p-1.5 hover:bg-accent/20 rounded-full transition-colors">
          <FastForward size={14} className="md:w-4 md:h-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-foreground opacity-10 mx-0.5 md:mx-1" />

      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="flex flex-col items-start min-w-0">
          <label className="text-[8px] font-bold uppercase tracking-tighter opacity-60">
            {activeGroup ? "Group FPS" : "Global FPS"}
          </label>
          <div className="flex items-center gap-2">
            <input 
              type="range" 
              min="1" 
              max="60" 
              value={fps} 
              onChange={(e) => setFps(parseInt(e.target.value))}
              className="w-12 md:w-16 h-1 accent-accent cursor-pointer"
            />
            <span className={cn(
              "text-[8px] md:text-[10px] font-mono w-6 md:w-8",
              activeGroup ? "text-accent font-bold" : ""
            )}>
              {fps}F
            </span>
            {activeGroup && <Zap size={10} className="text-accent animate-pulse" />}
          </div>
        </div>
      </div>
    </div>
  );
};
