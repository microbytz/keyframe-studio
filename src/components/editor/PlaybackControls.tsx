"use client"

import React from 'react';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  fps: number;
  setFps: (fps: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  togglePlayback,
  fps,
  setFps,
  onPrev,
  onNext
}) => {
  return (
    <div className="flex items-center gap-4 px-6 py-2 sketch-card bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <button onClick={onPrev} className="p-2 hover:bg-accent/20 rounded-full transition-colors">
          <Rewind size={20} />
        </button>
        <button 
          onClick={togglePlayback}
          className="w-10 h-10 flex items-center justify-center bg-accent sketch-border hover:scale-110 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
        <button onClick={onNext} className="p-2 hover:bg-accent/20 rounded-full transition-colors">
          <FastForward size={20} />
        </button>
      </div>

      <div className="h-8 w-px bg-foreground opacity-20" />

      <div className="flex items-center gap-3">
        <label className="text-xs font-bold uppercase">Speed</label>
        <input 
          type="range" 
          min="1" 
          max="30" 
          value={fps} 
          onChange={(e) => setFps(parseInt(e.target.value))}
          className="w-24 h-1 accent-accent"
        />
        <span className="text-xs font-mono w-12">{fps} FPS</span>
      </div>
    </div>
  );
};
