"use client"

import React from 'react';
import { ToolType } from '@/lib/types';
import { 
  Pencil, 
  Eraser, 
  PaintBucket, 
  Scissors, 
  Type, 
  Save, 
  FolderOpen, 
  Layers, 
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
  onSave: () => void;
  onLoad: () => void;
  onionSkinEnabled: boolean;
  toggleOnionSkin: () => void;
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
  onSave,
  onLoad,
  onionSkinEnabled,
  toggleOnionSkin,
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
    <div className="flex flex-col gap-4 p-4 sketch-card w-16 md:w-20 items-center">
      <div className="flex flex-col gap-2">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id as ToolType)}
            className={cn(
              "p-2 sketch-border transition-all hover:bg-accent group relative",
              currentTool === t.id ? "bg-accent shadow-[2px_2px_0px_0px_#454D52]" : "bg-white"
            )}
            title={t.label}
          >
            <t.icon size={20} />
            <span className="hidden group-hover:block absolute left-full ml-2 px-2 py-1 bg-primary text-white text-xs rounded whitespace-nowrap z-50">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <div className="w-full h-px bg-foreground opacity-20 my-2" />

      <div className="flex flex-col gap-2">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            "p-2 sketch-border bg-white hover:bg-accent transition-all disabled:opacity-30 disabled:hover:bg-white",
          )}
          title="Undo"
        >
          <Undo2 size={20} />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            "p-2 sketch-border bg-white hover:bg-accent transition-all disabled:opacity-30 disabled:hover:bg-white",
          )}
          title="Redo"
        >
          <Redo2 size={20} />
        </button>
      </div>

      <div className="w-full h-px bg-foreground opacity-20 my-2" />

      <div className="flex flex-col gap-2 items-center">
        <label className="text-[10px] font-bold uppercase text-center">Color</label>
        <div 
          className="w-8 h-8 sketch-border cursor-pointer overflow-hidden relative"
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

      <div className="flex flex-col gap-2 items-center">
        <label className="text-[10px] font-bold uppercase">Size</label>
        <input 
          type="range" 
          min="1" 
          max="50" 
          value={brushSize} 
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-12 h-1 accent-accent"
        />
        <span className="text-xs">{brushSize}px</span>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <button 
          onClick={toggleOnionSkin}
          className={cn(
            "p-2 sketch-border transition-all hover:bg-accent",
            onionSkinEnabled ? "bg-accent" : "bg-white"
          )}
          title="Onion Skinning"
        >
          <Layers size={20} />
        </button>
        <button 
          onClick={onSave}
          className="p-2 sketch-border bg-white hover:bg-accent transition-all"
          title="Save Project"
        >
          <Save size={20} />
        </button>
        <button 
          onClick={onLoad}
          className="p-2 sketch-border bg-white hover:bg-accent transition-all"
          title="Load Project"
        >
          <FolderOpen size={20} />
        </button>
      </div>
    </div>
  );
};
