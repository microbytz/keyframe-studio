"use client"

import React from 'react';
import { ToolType, MoveMode } from '@/lib/types';
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
  ChevronDown,
  Type,
  Zap,
  Brush,
  SprayCan,
  Ghost,
  Move,
  FlipHorizontal,
  FlipVertical,
  Minus,
  Square,
  Circle as CircleIcon,
  Triangle,
  Settings2,
  Layers as LayersIcon,
  Wand2,
  Maximize,
  RotateCcw,
  StretchHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from '@/hooks/use-mobile';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
  moveMode: MoveMode;
  setMoveMode: (mode: MoveMode) => void;
  undo: () => void;
  redo: () => void;
  flip: (axis: 'horizontal' | 'vertical') => void;
  canUndo: boolean;
  canRedo: boolean;
  color: string;
  onOpenLayers?: () => void;
  isMultiDrawEnabled?: boolean;
  setIsMultiDrawEnabled?: (enabled: boolean) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
  moveMode,
  setMoveMode,
  undo,
  redo,
  flip,
  canUndo,
  canRedo,
  color,
  onOpenLayers,
  isMultiDrawEnabled,
  setIsMultiDrawEnabled
}) => {
  const isMobile = useIsMobile();
  
  const brushTools = [
    { id: 'pen', icon: Pencil, label: 'Standard Pen' },
    { id: 'pencil', icon: Pencil, label: 'Graphite Pencil' },
    { id: 'brush', icon: Paintbrush, label: 'Soft Brush' },
    { id: 'pixel', icon: Grid2X2, label: 'Pixel Art' },
    { id: 'calligraphy', icon: Feather, label: 'Calligraphy' },
    { id: 'airbrush', icon: Wind, label: 'Airbrush' },
    { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
    { id: 'marker', icon: PenLine, label: 'Felt Tip Marker' },
    { id: 'charcoal', icon: CloudRain, label: 'Charcoal' },
    { id: 'crayon', icon: Sparkles, label: 'Wax Crayon' },
    { id: 'watercolor', icon: Droplets, label: 'Watercolor' },
    { id: 'ink', icon: Zap, label: 'Ink Pen' },
    { id: 'spray', icon: SprayCan, label: 'Spray Paint' },
    { id: 'chalk', icon: Ghost, label: 'Dusty Chalk' },
    { id: 'technical', icon: Type, label: 'Technical Pen' },
    { id: 'custom', icon: Settings2, label: 'Custom Brush' },
  ];

  const shapeTools = [
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: CircleIcon, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
  ];

  const transformModes = [
    { id: 'translate', icon: Move, label: 'Move' },
    { id: 'scale', icon: Maximize, label: 'Scale' },
    { id: 'rotate', icon: RotateCcw, label: 'Rotate' },
    { id: 'skew', icon: StretchHorizontal, label: 'Skew' },
  ];

  const activeBrush = brushTools.find(t => t.id === currentTool) || brushTools[0];
  const isBrushActive = brushTools.some(t => t.id === currentTool);
  const isShapeActive = shapeTools.some(t => t.id === currentTool);
  const activeMoveIcon = transformModes.find(m => m.id === moveMode)?.icon || Move;

  return (
    <div className="flex flex-row md:flex-col gap-2 md:gap-4 p-2 sketch-card w-full md:w-14 items-center justify-start md:justify-center bg-white overflow-x-auto scrollbar-none touch-pan-x">
      <div className="flex flex-row md:flex-col gap-2 shrink-0">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0",
                isBrushActive ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
              )}
              title="Brushes"
            >
              <activeBrush.icon size={16} />
              <div className="absolute -bottom-0.5 -right-0.5 bg-foreground text-white rounded-full p-0.5 scale-50">
                <ChevronDown size={10} strokeWidth={4} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side={isMobile ? "bottom" : "right"} align="start" className="w-72 p-3 sketch-card z-[100]">
            <div className="mb-4 p-3 sketch-border bg-background/50 flex flex-col items-center justify-center min-h-[64px]">
              <span className="text-[10px] font-bold uppercase opacity-60 mb-2">{activeBrush.label}</span>
              <div className="w-full px-4">
                <div style={{ backgroundColor: color, height: '6px', width: '100%', borderRadius: '99px' }} />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {brushTools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as ToolType)}
                  className={cn(
                    "p-2 sketch-border transition-all hover:bg-accent flex items-center justify-center",
                    currentTool === t.id ? "bg-accent" : "bg-white"
                  )}
                >
                  <t.icon size={16} />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0",
                isShapeActive ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
              )}
              title="Shapes"
            >
              {isShapeActive ? shapeTools.find(t => t.id === currentTool)?.icon({ size: 16 }) : <Square size={16} />}
              <div className="absolute -bottom-0.5 -right-0.5 bg-foreground text-white rounded-full p-0.5 scale-50">
                <ChevronDown size={10} strokeWidth={4} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side={isMobile ? "bottom" : "right"} align="start" className="w-48 p-3 sketch-card z-[100]">
            <div className="grid grid-cols-2 gap-2">
              {shapeTools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as ToolType)}
                  className={cn(
                    "p-3 sketch-border transition-all hover:bg-accent flex flex-col items-center gap-1",
                    currentTool === t.id ? "bg-accent" : "bg-white"
                  )}
                >
                  <t.icon size={18} />
                  <span className="text-[8px] font-bold uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="hidden md:block w-full h-px bg-foreground opacity-5 my-1" />
        
        {/* Advanced Move Tool with Popover for Transforms */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={() => setTool('move')}
              className={cn(
                "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0",
                currentTool === 'move' ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
              )}
              title="Move & Transform"
            >
              <activeMoveIcon size={16} />
              <div className="absolute -bottom-0.5 -right-0.5 bg-foreground text-white rounded-full p-0.5 scale-50">
                <ChevronDown size={10} strokeWidth={4} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side={isMobile ? "bottom" : "right"} align="start" className="w-48 p-3 sketch-card z-[100]">
            <div className="grid grid-cols-2 gap-2">
              {transformModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setTool('move'); setMoveMode(m.id as MoveMode); }}
                  className={cn(
                    "p-3 sketch-border transition-all hover:bg-accent flex flex-col items-center gap-1",
                    (currentTool === 'move' && moveMode === m.id) ? "bg-accent" : "bg-white"
                  )}
                >
                  <m.icon size={18} />
                  <span className="text-[8px] font-bold uppercase">{m.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[8px] mt-2 opacity-40 uppercase font-bold text-center">Transform Selection</p>
          </PopoverContent>
        </Popover>

        <button
          onClick={() => setTool('eraser')}
          className={cn(
            "p-2 sketch-border transition-all hover:bg-accent shrink-0",
            currentTool === 'eraser' ? "bg-accent" : "bg-white"
          )}
        >
          <Eraser size={16} />
        </button>

        <button
          onClick={() => setTool('bucket')}
          className={cn(
            "p-2 sketch-border transition-all hover:bg-accent shrink-0",
            currentTool === 'bucket' ? "bg-accent" : "bg-white"
          )}
        >
          <PaintBucket size={16} />
        </button>

        <button
          onClick={() => setTool('lasso')}
          className={cn(
            "p-2 sketch-border transition-all hover:bg-accent shrink-0",
            currentTool === 'lasso' ? "bg-accent" : "bg-white"
          )}
        >
          <LassoIcon size={16} />
        </button>

        <div className="hidden md:block w-full h-px bg-foreground opacity-5 my-1" />

        <button 
          onClick={() => setIsMultiDrawEnabled?.(!isMultiDrawEnabled)}
          className={cn(
            "p-2 sketch-border transition-all hover:bg-accent shrink-0",
            isMultiDrawEnabled ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
          )}
          title="Magic Wand: Multi-Draw Sync"
        >
          <Wand2 size={16} />
        </button>

        <div className="hidden md:block w-full h-px bg-foreground opacity-5 my-1" />
        
        <button onClick={() => flip('horizontal')} className="p-2 sketch-border bg-white hover:bg-accent transition-all shrink-0">
          <FlipHorizontal size={16} />
        </button>
        <button onClick={() => flip('vertical')} className="p-2 sketch-border bg-white hover:bg-accent transition-all shrink-0">
          <FlipVertical size={16} />
        </button>

        <div className="hidden md:block w-full h-px bg-foreground opacity-5 my-1" />

        <button 
          onClick={onOpenLayers}
          className="p-2 sketch-border bg-white hover:bg-accent transition-all shrink-0"
          title="Manage Layers"
        >
          <LayersIcon size={16} />
        </button>
      </div>

      <div className="hidden md:block w-full h-px bg-foreground opacity-10" />

      <div className="flex flex-row md:flex-col gap-2 shrink-0">
        <button onClick={undo} disabled={!canUndo} className="p-2 sketch-border bg-white hover:bg-accent disabled:opacity-20 transition-all shrink-0">
          <Undo2 size={16} />
        </button>
        <button onClick={redo} disabled={!canRedo} className="p-2 sketch-border bg-white hover:bg-accent disabled:opacity-20 transition-all shrink-0">
          <Redo2 size={16} />
        </button>
      </div>
    </div>
  );
};
