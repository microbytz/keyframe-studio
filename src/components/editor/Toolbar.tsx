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
  ChevronDown,
  Type,
  Zap,
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
  StretchHorizontal,
  Bookmark,
  Trash2,
  Waves,
  Cloud,
  Share2,
  Download,
  Upload,
  Plus,
  Package,
  FolderPlus,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ToolbarProps {
  currentTool: ToolType;
  lastBrushTool?: ToolType;
  lastShapeTool?: ToolType;
  setTool: (tool: ToolType) => void;
  moveMode: MoveMode;
  setMoveMode: (mode: MoveMode) => void;
  undo: () => void;
  redo: () => void;
  flip: (axis: 'horizontal' | 'vertical') => void;
  canUndo: boolean;
  canRedo: boolean;
  color: string;
  savedBrushes?: SavedBrush[];
  brushPacks?: BrushPack[];
  customBrushData?: string | null;
  setCustomBrushData?: (data: string) => void;
  deleteSavedBrush?: (id: string) => void;
  createBrushPack?: (name: string) => void;
  addBrushToPack?: (packId: string, brush: SavedBrush) => void;
  removeBrushFromPack?: (packId: string, brushId: string) => void;
  deleteBrushPack?: (packId: string, keepBrushes: boolean) => void;
  exportBrush?: (brush: SavedBrush) => void;
  exportBrushPack?: (pack: BrushPack) => void;
  importBrushPack?: (file: File) => void;
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
  flip,
  canUndo,
  canRedo,
  color,
  savedBrushes = [],
  brushPacks = [],
  customBrushData,
  setCustomBrushData,
  deleteSavedBrush,
  createBrushPack,
  addBrushToPack,
  removeBrushFromPack,
  deleteBrushPack,
  exportBrush,
  exportBrushPack,
  importBrushPack
}) => {
  const isMobile = useIsMobile();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [newPackName, setNewPackName] = useState('');
  
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
    { id: 'blur', icon: Cloud, label: 'Blur Softener' },
    { id: 'blend', icon: Waves, label: 'Smudge Blender' },
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

  const isBrushActive = brushTools.some(t => t.id === currentTool);
  const isShapeActive = shapeTools.some(t => t.id === currentTool);

  const activeBrush = brushTools.find(t => t.id === (isBrushActive ? currentTool : lastBrushTool)) || brushTools[0];
  const selectedShapeTool = shapeTools.find(t => t.id === (isShapeActive ? currentTool : lastShapeTool)) || shapeTools[1];
  const ShapeIcon = selectedShapeTool.icon;

  const handleCreatePack = () => {
    if (newPackName.trim() && createBrushPack) {
      createBrushPack(newPackName.trim());
      setNewPackName('');
    }
  };

  const renderBrushItem = (brush: SavedBrush, packId: string | null = null) => (
    <div key={brush.id} className="relative group/item flex flex-col gap-1">
      <div className="relative">
        <button
          onClick={() => {
            setCustomBrushData?.(brush.data);
            setTool('custom');
          }}
          className={cn(
            "w-full p-1 sketch-border transition-all hover:bg-white/10 flex items-center justify-center aspect-square pattern-checkered bg-black overflow-hidden",
            (currentTool === 'custom' && customBrushData === brush.data) ? "border-white/50" : ""
          )}
          title={brush.name}
        >
          <img src={brush.data} alt={brush.name} className="max-w-full max-h-full object-contain group-hover/item:scale-110 transition-transform" />
        </button>
        
        <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); deleteSavedBrush?.(brush.id); }}
            className="bg-red-500 text-white rounded-full p-1 shadow-sm hover:scale-110"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
      <span className="text-[8px] font-bold truncate text-center opacity-40 px-1">{brush.name}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5 p-1.5 bg-black border-r border-white/10 h-full w-full items-center overflow-y-auto scrollbar-none">
      <Popover>
        <PopoverTrigger asChild>
          <button
            onClick={() => { if (!isBrushActive) setTool(lastBrushTool); }}
            className={cn(
              "p-2 sketch-border transition-all hover:bg-white/10 relative",
              isBrushActive ? "bg-white/10 border-white/50" : "bg-transparent"
            )}
          >
            {React.createElement(activeBrush.icon, { size: 18 })}
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-80 p-0 sketch-card z-[100] overflow-hidden">
          <ScrollArea className="h-[400px]">
             <div className="p-4 space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase opacity-40 mb-3 block tracking-widest">Brushes</span>
                  <div className="grid grid-cols-4 gap-2">
                    {brushTools.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTool(t.id as ToolType)}
                        className={cn(
                          "p-3 sketch-border transition-all hover:bg-white/10 flex items-center justify-center",
                          currentTool === t.id ? "bg-white/20 border-white/50" : "bg-transparent"
                        )}
                        title={t.label}
                      >
                        {React.createElement(t.icon, { size: 18 })}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <span className="text-[10px] font-bold uppercase opacity-40 mb-3 block tracking-widest">My Pens</span>
                  <div className="grid grid-cols-4 gap-2">
                    {savedBrushes.map(b => renderBrushItem(b, null))}
                  </div>
                </div>
             </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button
            onClick={() => { if (!isShapeActive) setTool(lastShapeTool); }}
            className={cn(
              "p-2 sketch-border transition-all hover:bg-white/10 relative",
              isShapeActive ? "bg-white/10 border-white/50" : "bg-transparent"
            )}
          >
            {React.createElement(ShapeIcon, { size: 18 })}
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-48 p-4 sketch-card z-[100]">
          <div className="grid grid-cols-2 gap-2">
            {shapeTools.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id as ToolType)}
                className={cn(
                  "p-4 sketch-border transition-all hover:bg-white/10 flex flex-col items-center gap-2",
                  currentTool === t.id ? "bg-white/20 border-white/50" : "bg-transparent"
                )}
              >
                {React.createElement(t.icon, { size: 20 })}
                <span className="text-[8px] font-bold uppercase opacity-60">{t.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-full h-px bg-white/5 my-1" />

      <button onClick={() => setTool('eraser')} className={cn("p-2 studio-icon-btn", currentTool === 'eraser' && "text-white bg-white/10")}><Eraser size={18} /></button>
      <button onClick={() => setTool('bucket')} className={cn("p-2 studio-icon-btn", currentTool === 'bucket' && "text-white bg-white/10")}><PaintBucket size={18} /></button>
      <button onClick={() => setTool('lasso')} className={cn("p-2 studio-icon-btn", currentTool === 'lasso' && "text-white bg-white/10")}><LassoIcon size={18} /></button>
      <button onClick={() => setTool('move')} className={cn("p-2 studio-icon-btn", currentTool === 'move' && "text-white bg-white/10")}><Move size={18} /></button>

      <div className="w-full h-px bg-white/5 my-1" />

      <button onClick={undo} disabled={!canUndo} className="p-2 studio-icon-btn disabled:opacity-20"><Undo2 size={18} /></button>
      <button onClick={redo} disabled={!canRedo} className="p-2 studio-icon-btn disabled:opacity-20"><Redo2 size={18} /></button>
      
      <div className="flex-1" />
      
      <button onClick={() => setIsMultiDrawEnabled?.(!isMultiDrawEnabled)} className={cn("p-2 studio-icon-btn", isMultiDrawEnabled && "text-white bg-white/10")}><Wand2 size={18} /></button>
    </div>
  );
};