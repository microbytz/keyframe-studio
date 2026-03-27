"use client"

import React, { useState, useRef } from 'react';
import { ToolType, MoveMode, SavedBrush, BrushPack } from '@/lib/types';
import { 
  Pencil, 
  Eraser, 
  PaintBucket, 
  Lasso as LassoIcon, 
  Undo2, 
  Redo2,
  Paintbrush,
  Grid2X2,
  Feather,
  Wind,
  Highlighter,
  PenLine,
  CloudRain,
  Sparkles,
  Droplets,
  Type,
  Zap,
  SprayCan,
  Ghost,
  Move,
  Minus,
  Square,
  Circle as CircleIcon,
  Triangle,
  Settings2,
  Wand2,
  Maximize,
  RotateCcw,
  StretchHorizontal,
  Trash2,
  Waves,
  Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ToolbarProps {
  currentTool: ToolType;
  lastBrushTool?: ToolType;
  lastShapeTool?: ToolType;
  setTool: (tool: ToolType) => void;
  moveMode: MoveMode;
  setMoveMode: (mode: MoveMode) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  color: string;
  savedBrushes?: SavedBrush[];
  customBrushData?: string | null;
  setCustomBrushData?: (data: string) => void;
  deleteSavedBrush?: (id: string) => void;
  isMultiDrawEnabled?: boolean;
  setIsMultiDrawEnabled?: (enabled: boolean) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  lastBrushTool = 'pen',
  lastShapeTool = 'rectangle',
  setTool,
  moveMode,
  setMoveMode,
  undo,
  redo,
  canUndo,
  canRedo,
  savedBrushes = [],
  customBrushData,
  setCustomBrushData,
  deleteSavedBrush,
  isMultiDrawEnabled,
  setIsMultiDrawEnabled
}) => {
  const brushTools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'pencil', icon: Pencil, label: 'Pencil' },
    { id: 'brush', icon: Paintbrush, label: 'Brush' },
    { id: 'pixel', icon: Grid2X2, label: 'Pixel' },
    { id: 'calligraphy', icon: Feather, label: 'Calligraphy' },
    { id: 'airbrush', icon: Wind, label: 'Air' },
    { id: 'highlighter', icon: Highlighter, label: 'High' },
    { id: 'marker', icon: PenLine, label: 'Mark' },
    { id: 'charcoal', icon: CloudRain, label: 'Char' },
    { id: 'crayon', icon: Sparkles, label: 'Cray' },
    { id: 'watercolor', icon: Droplets, label: 'Water' },
    { id: 'ink', icon: Zap, label: 'Ink' },
    { id: 'spray', icon: SprayCan, label: 'Spray' },
    { id: 'chalk', icon: Ghost, label: 'Chalk' },
    { id: 'technical', icon: Type, label: 'Tech' },
    { id: 'blur', icon: Cloud, label: 'Blur' },
    { id: 'blend', icon: Waves, label: 'Smudge' },
    { id: 'custom', icon: Settings2, label: 'Custom' },
  ];

  const shapeTools = [
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rectangle', icon: Square, label: 'Rect' },
    { id: 'circle', icon: CircleIcon, label: 'Circ' },
    { id: 'triangle', icon: Triangle, label: 'Tri' },
  ];

  const isBrushActive = brushTools.some(t => t.id === currentTool);
  const isShapeActive = shapeTools.some(t => t.id === currentTool);

  const activeBrush = brushTools.find(t => t.id === (isBrushActive ? currentTool : lastBrushTool)) || brushTools[0];
  const selectedShapeTool = shapeTools.find(t => t.id === (isShapeActive ? currentTool : lastShapeTool)) || shapeTools[1];
  const ShapeIcon = selectedShapeTool.icon;

  return (
    <div className="flex flex-col gap-1 p-1 bg-black border-r border-white/5 h-full w-full items-center overflow-y-auto scrollbar-none">
      <Popover>
        <PopoverTrigger asChild>
          <button
            onClick={() => { if (!isBrushActive) setTool(lastBrushTool); }}
            className={cn(
              "p-1.5 sketch-border transition-all hover:bg-white/5 relative",
              isBrushActive ? "bg-white/10 border-white/20" : "bg-transparent"
            )}
          >
            {React.createElement(activeBrush.icon, { size: 16 })}
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-64 p-0 studio-panel bg-black border-white/10 z-[100]">
          <ScrollArea className="h-64">
             <div className="p-3 space-y-4">
                <div>
                  <span className="text-[9px] font-bold uppercase opacity-30 mb-2 block tracking-widest">Brushes</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {brushTools.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTool(t.id as ToolType)}
                        className={cn(
                          "p-2.5 sketch-border transition-all hover:bg-white/5 flex items-center justify-center",
                          currentTool === t.id ? "bg-white/10 border-white/20" : "bg-transparent"
                        )}
                      >
                        {React.createElement(t.icon, { size: 16 })}
                      </button>
                    ))}
                  </div>
                </div>

                {savedBrushes.length > 0 && (
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[9px] font-bold uppercase opacity-30 mb-2 block tracking-widest">Saved Pens</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {savedBrushes.map(b => (
                        <button
                          key={b.id}
                          onClick={() => { setCustomBrushData?.(b.data); setTool('custom'); }}
                          className={cn(
                            "w-full p-1 sketch-border transition-all hover:bg-white/5 aspect-square bg-black overflow-hidden",
                            (currentTool === 'custom' && customBrushData === b.data) ? "border-white/40" : ""
                          )}
                        >
                          <img src={b.data} alt={b.name} className="max-w-full max-h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button
            onClick={() => { if (!isShapeActive) setTool(lastShapeTool); }}
            className={cn(
              "p-1.5 sketch-border transition-all hover:bg-white/5 relative",
              isShapeActive ? "bg-white/10 border-white/20" : "bg-transparent"
            )}
          >
            {React.createElement(ShapeIcon, { size: 16 })}
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-32 p-3 studio-panel bg-black border-white/10 z-[100]">
          <div className="grid grid-cols-2 gap-1.5">
            {shapeTools.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id as ToolType)}
                className={cn(
                  "p-3 sketch-border transition-all hover:bg-white/5 flex flex-col items-center gap-1",
                  currentTool === t.id ? "bg-white/10 border-white/20" : "bg-transparent"
                )}
              >
                {React.createElement(t.icon, { size: 16 })}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-full h-px bg-white/5 my-0.5" />

      <button onClick={() => setTool('eraser')} className={cn("p-1.5 studio-icon-btn", currentTool === 'eraser' && "text-white bg-white/10")} title="Eraser"><Eraser size={16} /></button>
      <button onClick={() => setTool('bucket')} className={cn("p-1.5 studio-icon-btn", currentTool === 'bucket' && "text-white bg-white/10")} title="Bucket"><PaintBucket size={16} /></button>
      <button onClick={() => setTool('lasso')} className={cn("p-1.5 studio-icon-btn", currentTool === 'lasso' && "text-white bg-white/10")} title="Lasso"><LassoIcon size={16} /></button>
      <button onClick={() => setTool('move')} className={cn("p-1.5 studio-icon-btn", currentTool === 'move' && "text-white bg-white/10")} title="Move"><Move size={16} /></button>

      <div className="w-full h-px bg-white/5 my-0.5" />

      <button onClick={undo} disabled={!canUndo} className="p-1.5 studio-icon-btn disabled:opacity-10" title="Undo"><Undo2 size={16} /></button>
      <button onClick={redo} disabled={!canRedo} className="p-1.5 studio-icon-btn disabled:opacity-10" title="Redo"><Redo2 size={16} /></button>
      
      <div className="flex-1" />
      
      <button 
        onClick={() => setIsMultiDrawEnabled?.(!isMultiDrawEnabled)} 
        className={cn("p-1.5 studio-icon-btn", isMultiDrawEnabled && "text-white bg-white/20")}
        title="Multi-Draw Sync"
      >
        <Wand2 size={16} />
      </button>
    </div>
  );
};