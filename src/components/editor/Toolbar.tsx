"use client"

import React from 'react';
import { ToolType } from '@/lib/types';
import { 
  Pencil, 
  Eraser, 
  PaintBucket, 
  Scissors, 
  Type, 
  Undo2, 
  Redo2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  undo,
  redo,
  canUndo,
  canRedo
}) => {
  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'bucket', icon: PaintBucket, label: 'Fill' },
    { id: 'lasso', icon: Scissors, label: 'Lasso' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  return (
    <div className="flex flex-col gap-3 p-3 sketch-card w-14 md:w-16 items-center">
      <div className="flex flex-col gap-1.5">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id as ToolType)}
            className={cn(
              "p-1.5 sketch-border transition-all hover:bg-accent group relative",
              currentTool === t.id ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
            )}
            title={t.label}
          >
            <t.icon size={18} />
            <span className="hidden group-hover:block absolute left-full ml-2 px-2 py-1 bg-primary text-white text-[10px] rounded whitespace-nowrap z-50">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <div className="w-full h-px bg-foreground opacity-20 my-1" />

      <div className="flex flex-col gap-1.5">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            "p-1.5 sketch-border bg-white hover:bg-accent transition-all disabled:opacity-30 disabled:hover:bg-white",
          )}
          title="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            "p-1.5 sketch-border bg-white hover:bg-accent transition-all disabled:opacity-30 disabled:hover:bg-white",
          )}
          title="Redo"
        >
          <Redo2 size={18} />
        </button>
      </div>

      <div className="w-full h-px bg-foreground opacity-20 my-1" />

      <div className="flex flex-col gap-1 items-center">
        <label className="text-[8px] font-bold uppercase text-center">Color</label>
        <div 
          className="w-7 h-7 sketch-border cursor-pointer overflow-hidden relative"
          style={{ backgroundColor: color }}
        >
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 items-center">
        <label className="text-[8px] font-bold uppercase">Size</label>
        <input 
          type="range" 
          min="1" 
          max="50" 
          value={brushSize} 
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-10 h-1 accent-accent"
        />
        <span className="text-[10px]">{brushSize}px</span>
      </div>
    </div>
  );
};
