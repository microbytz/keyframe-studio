"use client"

import React from 'react';
import { ToolType } from '@/lib/types';
import { 
  Pencil, 
  Eraser, 
  PaintBucket, 
  Scissors, 
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
  Triangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
  undo: () => void;
  redo: () => void;
  flip: (axis: 'horizontal' | 'vertical') => void;
  canUndo: boolean;
  canRedo: boolean;
  color: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
  undo,
  redo,
  flip,
  canUndo,
  canRedo,
  color
}) => {
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
  ];

  const shapeTools = [
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: CircleIcon, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
  ];

  const utilityTools = [
    { id: 'move', icon: Move, label: 'Move / Transform' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'bucket', icon: PaintBucket, label: 'Fill' },
    { id: 'lasso', icon: Scissors, label: 'Lasso' },
  ];

  const activeBrush = brushTools.find(t => t.id === currentTool) || brushTools[0];
  const isBrushActive = brushTools.some(t => t.id === currentTool);
  
  const activeShape = shapeTools.find(t => t.id === currentTool);
  const isShapeActive = !!activeShape;

  const getBrushPreviewStyle = (toolId: string) => {
    const base: React.CSSProperties = {
      backgroundColor: color,
      height: '6px',
      width: '100%',
      borderRadius: '99px',
    };

    switch (toolId) {
      case 'pencil':
        return { ...base, opacity: 0.4, height: '3px', filter: 'contrast(120%)' };
      case 'brush':
        return { ...base, boxShadow: `0 0 8px ${color}`, filter: 'blur(1px)' };
      case 'pixel':
        return { ...base, borderRadius: '0', height: '8px', backgroundImage: `linear-gradient(90deg, ${color} 50%, transparent 50%)`, backgroundSize: '10px 100%' };
      case 'calligraphy':
        return { ...base, transform: 'skewX(-45deg)', height: '10px' };
      case 'airbrush':
      case 'spray':
        return { ...base, backgroundColor: 'transparent', backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`, backgroundSize: '4px 4px' };
      case 'highlighter':
        return { ...base, opacity: 0.5, height: '12px', borderRadius: '2px' };
      case 'watercolor':
        return { ...base, opacity: 0.2, height: '15px', filter: 'blur(3px)' };
      case 'charcoal':
      case 'chalk':
        return { ...base, opacity: 0.7, filter: 'contrast(150%) brightness(80%) drop-shadow(1px 1px 1px rgba(0,0,0,0.2))' };
      case 'crayon':
        return { ...base, border: `1px dashed ${color}aa`, opacity: 0.9 };
      case 'technical':
        return { ...base, height: '1px' };
      case 'ink':
        return { ...base, height: '4px', filter: 'drop-shadow(0px 1px 0px rgba(0,0,0,0.1))' };
      default:
        return base;
    }
  };

  return (
    <div className="flex flex-row md:flex-col gap-2 md:gap-4 p-2 sketch-card w-full md:w-14 items-center justify-center bg-white overflow-x-auto scrollbar-none">
      <div className="flex flex-row md:flex-col gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0",
                isBrushActive ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
              )}
              title="Brushes"
            >
              <activeBrush.icon size={16} className="md:w-[18px] md:h-[18px]" />
              <div className="absolute -bottom-0.5 -right-0.5 bg-foreground text-white rounded-full p-0.5 scale-50">
                <ChevronDown size={10} strokeWidth={4} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            side="right" 
            align="start" 
            className="w-72 p-3 sketch-card ml-2 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="mb-4 p-3 sketch-border bg-background/50 flex flex-col items-center justify-center min-h-[64px] overflow-hidden">
              <span className="text-[10px] font-bold uppercase opacity-60 mb-2 tracking-widest">{activeBrush.label}</span>
              <div className="w-full px-4">
                <div style={getBrushPreviewStyle(activeBrush.id)} className="transition-all duration-200" />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {brushTools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as ToolType)}
                  className={cn(
                    "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0 flex items-center justify-center",
                    currentTool === t.id ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
                  )}
                  title={t.label}
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
              {isShapeActive ? <activeShape.icon size={16} className="md:w-[18px] md:h-[18px]" /> : <Square size={16} className="md:w-[18px] md:h-[18px]" />}
              <div className="absolute -bottom-0.5 -right-0.5 bg-foreground text-white rounded-full p-0.5 scale-50">
                <ChevronDown size={10} strokeWidth={4} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            side="right" 
            align="start" 
            className="w-48 p-3 sketch-card ml-2 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="grid grid-cols-2 gap-2">
              {shapeTools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as ToolType)}
                  className={cn(
                    "p-3 sketch-border transition-all hover:bg-accent group relative shrink-0 flex flex-col items-center justify-center gap-1",
                    currentTool === t.id ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
                  )}
                  title={t.label}
                >
                  <t.icon size={18} />
                  <span className="text-[8px] font-bold uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="hidden md:block w-full h-px bg-foreground opacity-5 my-1" />

        {utilityTools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id as ToolType)}
            className={cn(
              "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0",
              currentTool === t.id ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
            )}
            title={t.label}
          >
            <t.icon size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        ))}

        <div className="hidden md:block w-full h-px bg-foreground opacity-5 my-1" />
        
        <button
          onClick={() => flip('horizontal')}
          className="p-2 sketch-border bg-white hover:bg-accent transition-all shrink-0"
          title="Flip Horizontal"
        >
          <FlipHorizontal size={16} />
        </button>
        <button
          onClick={() => flip('vertical')}
          className="p-2 sketch-border bg-white hover:bg-accent transition-all shrink-0"
          title="Flip Vertical"
        >
          <FlipVertical size={16} />
        </button>
      </div>

      <div className="hidden md:block w-full h-px bg-foreground opacity-10" />
      <div className="block md:hidden w-px h-8 bg-foreground opacity-10 mx-1 shrink-0" />

      <div className="flex flex-row md:flex-col gap-2">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            "p-2 sketch-border bg-white hover:bg-accent transition-all disabled:opacity-20 disabled:hover:bg-white shrink-0",
          )}
          title="Undo"
        >
          <Undo2 size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            "p-2 sketch-border bg-white hover:bg-accent transition-all disabled:opacity-20 disabled:hover:bg-white shrink-0",
          )}
          title="Redo"
        >
          <Redo2 size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
      </div>
    </div>
  );
};
