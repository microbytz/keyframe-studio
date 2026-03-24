
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
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
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
    <div className="flex flex-col gap-4 p-2 sketch-card w-14 items-center bg-white">
      <div className="flex flex-col gap-2">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id as ToolType)}
            className={cn(
              "p-2 sketch-border transition-all hover:bg-accent group relative",
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

      <div className="w-full h-px bg-foreground opacity-10" />

      <div className="flex flex-col gap-2">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            "p-2 sketch-border bg-white hover:bg-accent transition-all disabled:opacity-20 disabled:hover:bg-white",
          )}
          title="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            "p-2 sketch-border bg-white hover:bg-accent transition-all disabled:opacity-20 disabled:hover:bg-white",
          )}
          title="Redo"
        >
          <Redo2 size={18} />
        </button>
      </div>
    </div>
  );
};
