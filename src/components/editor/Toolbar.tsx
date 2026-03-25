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
  Highlighter,
  Wind,
  ChevronDown
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
  const brushTools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'brush', icon: Paintbrush, label: 'Soft Brush' },
    { id: 'pixel', icon: Grid2X2, label: 'Pixel Brush' },
    { id: 'calligraphy', icon: Highlighter, label: 'Calligraphy' },
    { id: 'airbrush', icon: Wind, label: 'Airbrush' },
  ];

  const utilityTools = [
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'bucket', icon: PaintBucket, label: 'Fill' },
    { id: 'lasso', icon: Scissors, label: 'Lasso' },
  ];

  const activeBrush = brushTools.find(t => t.id === currentTool) || brushTools[0];
  const isBrushActive = brushTools.some(t => t.id === currentTool);

  return (
    <div className="flex flex-row md:flex-col gap-2 md:gap-4 p-2 sketch-card w-full md:w-14 items-center justify-center bg-white overflow-x-auto scrollbar-none">
      <div className="flex flex-row md:flex-col gap-2">
        {/* Brush Group Selector */}
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
            className="w-auto p-2 sketch-card ml-2 flex flex-row md:flex-col gap-2 animate-in fade-in zoom-in-95 duration-100"
          >
            {brushTools.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id as ToolType)}
                className={cn(
                  "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0",
                  currentTool === t.id ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
                )}
                title={t.label}
              >
                <t.icon size={16} />
                <span className="hidden md:group-hover:block absolute left-full ml-3 px-2 py-1 bg-primary text-white text-[10px] rounded whitespace-nowrap z-50">
                  {t.label}
                </span>
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Separator for utility tools */}
        <div className="hidden md:block w-full h-px bg-foreground opacity-5 my-1" />

        {/* Utility Tools */}
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
            <span className="hidden md:group-hover:block absolute left-full ml-2 px-2 py-1 bg-primary text-white text-[10px] rounded whitespace-nowrap z-50">
              {t.label}
            </span>
          </button>
        ))}
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
