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
  onOpenLayers?: () => void;
  isMultiDrawEnabled?: boolean;
  setIsMultiDrawEnabled?: (enabled: boolean) => void;
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
  onOpenLayers,
  isMultiDrawEnabled,
  setIsMultiDrawEnabled,
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

  const renderBrushPreview = () => {
    const previewStyles: React.CSSProperties = {
      backgroundColor: color,
      width: '100%',
      height: '8px',
      borderRadius: '99px',
    };

    if (activeBrush.id === 'highlighter') {
      previewStyles.opacity = 0.5;
      previewStyles.borderRadius = '2px';
      previewStyles.height = '12px';
    } else if (activeBrush.id === 'pixel') {
      previewStyles.borderRadius = '0px';
      previewStyles.backgroundImage = `linear-gradient(90deg, transparent 50%, ${color} 50%)`;
      previewStyles.backgroundSize = '8px 8px';
    } else if (['airbrush', 'spray', 'charcoal', 'chalk', 'blur', 'blend'].includes(activeBrush.id as any)) {
      previewStyles.backgroundColor = 'transparent';
      previewStyles.backgroundImage = `radial-gradient(${color} 15%, transparent 20%)`;
      previewStyles.backgroundSize = '4px 4px';
      previewStyles.height = '16px';
    } else if (['brush', 'watercolor'].includes(activeBrush.id as any)) {
      previewStyles.filter = 'blur(2px)';
      previewStyles.opacity = 0.8;
    } else if (activeBrush.id === 'pencil') {
      previewStyles.opacity = 0.7;
      previewStyles.height = '4px';
    }

    return (
      <div className="w-full px-8 flex items-center justify-center min-h-[32px]">
        <div style={previewStyles} className="transition-all duration-200" />
      </div>
    );
  };

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
            "w-full p-1 sketch-border transition-all hover:bg-accent flex items-center justify-center aspect-square pattern-checkered bg-white overflow-hidden",
            (currentTool === 'custom' && customBrushData === brush.data) ? "border-accent ring-2 ring-accent/30" : ""
          )}
          title={brush.name}
        >
          <img src={brush.data} alt={brush.name} className="max-w-full max-h-full object-contain group-hover/item:scale-110 transition-transform" />
        </button>
        
        <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity z-10">
          {exportBrush && (
            <button 
              onClick={(e) => { e.stopPropagation(); exportBrush(brush); }}
              className="bg-accent text-white rounded-full p-1 shadow-sm hover:scale-110"
              title="Share Brush"
            >
              <Share2 size={10} />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); deleteSavedBrush?.(brush.id); }}
            className="bg-red-500 text-white rounded-full p-1 shadow-sm hover:scale-110"
            title="Delete Brush"
          >
            <Trash2 size={10} />
          </button>
        </div>

        <div className="absolute -bottom-1 -right-1 opacity-0 group-hover/item:opacity-100 transition-opacity z-10">
          <Popover>
            <PopoverTrigger asChild>
              <button 
                onClick={(e) => e.stopPropagation()}
                className="bg-white sketch-border text-foreground rounded-full p-1 shadow-sm hover:scale-110"
                title="Move to Pack"
              >
                <ArrowRightLeft size={10} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2 sketch-card" side="right">
               <p className="text-[8px] font-bold uppercase opacity-40 mb-2 px-1">Move to...</p>
               <ScrollArea className="max-h-32">
                 <div className="space-y-1">
                   {packId !== null && (
                     <button 
                       onClick={() => removeBrushFromPack?.(packId, brush.id)}
                       className="w-full text-left text-[9px] font-bold uppercase p-1.5 hover:bg-accent/10 rounded flex items-center gap-2"
                     >
                       <Bookmark size={10} /> Loose Pens
                     </button>
                   )}
                   {brushPacks?.filter(p => p.id !== packId).map(p => (
                     <button 
                       key={p.id}
                       onClick={() => addBrushToPack?.(p.id, brush)}
                       className="w-full text-left text-[9px] font-bold uppercase p-1.5 hover:bg-accent/10 rounded flex items-center gap-2"
                     >
                       <Package size={10} /> {p.name}
                     </button>
                   ))}
                 </div>
               </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <span className="text-[8px] font-bold truncate text-center opacity-60 px-1">{brush.name}</span>
    </div>
  );

  return (
    <div className="flex flex-row md:flex-col gap-2 md:gap-4 p-2 sketch-card w-full md:w-14 items-center justify-start md:justify-center bg-white overflow-x-auto scrollbar-none touch-pan-x">
      <div className="flex flex-row md:flex-col gap-2 shrink-0">
        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={() => { if (!isBrushActive) setTool(lastBrushTool); }}
              className={cn(
                "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0",
                isBrushActive ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
              )}
              title="Brushes"
            >
              {React.createElement(activeBrush.icon, { size: 16 })}
              <div className="absolute -bottom-0.5 -right-0.5 bg-foreground text-white rounded-full p-0.5 scale-50">
                <ChevronDown size={10} strokeWidth={4} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side={isMobile ? "bottom" : "right"} align="start" className="w-80 p-0 sketch-card z-[100] overflow-hidden">
            <div className="p-3 border-b-2 border-foreground/5 bg-accent/5">
              <div className="mb-2 p-3 sketch-border bg-white flex flex-col items-center justify-center min-h-[60px]">
                <span className="text-[9px] font-bold uppercase opacity-60 mb-2">{activeBrush.label} Preview</span>
                {renderBrushPreview()}
              </div>
            </div>
            
            <ScrollArea className="h-[400px]">
               <div className="p-3 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase opacity-40 mb-2 block tracking-widest">Standard Tools</span>
                    <div className="grid grid-cols-4 gap-2">
                      {brushTools.map((t) => {
                        const ToolIcon = t.icon;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setTool(t.id as ToolType)}
                            className={cn(
                              "p-2.5 sketch-border transition-all hover:bg-accent flex items-center justify-center",
                              currentTool === t.id ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
                            )}
                            title={t.label}
                          >
                            <ToolIcon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase opacity-40 tracking-widest">My Pens & Packs</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => importInputRef.current?.click()}
                          className="p-1 hover:bg-accent/10 rounded" 
                          title="Import Brush/Pack"
                        >
                          <Upload size={12} />
                        </button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 hover:bg-accent/10 rounded" title="Create New Pack">
                              <FolderPlus size={12} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 sketch-card space-y-2">
                            <Input 
                              placeholder="Pack Name..." 
                              value={newPackName} 
                              onChange={(e) => setNewPackName(e.target.value)}
                              className="h-8 text-[10px] sketch-border"
                            />
                            <Button onClick={handleCreatePack} size="sm" className="w-full h-8 text-[10px] font-bold uppercase bg-accent">
                              Create Pack
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <Accordion type="multiple" className="space-y-2">
                      <AccordionItem value="loose" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-2 bg-slate-50 px-2 sketch-border text-[10px] font-bold uppercase">
                          <div className="flex items-center gap-2">
                            <Bookmark size={12} className="text-accent" />
                            Loose Pens ({savedBrushes.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-3">
                          {savedBrushes.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                              {savedBrushes.map(b => renderBrushItem(b, null))}
                            </div>
                          ) : (
                            <p className="text-[9px] italic opacity-40 text-center py-2">No individual brushes.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      {brushPacks?.map(pack => (
                        <AccordionItem key={pack.id} value={pack.id} className="border-none">
                          <AccordionTrigger className="hover:no-underline py-2 bg-slate-50 px-2 sketch-border text-[10px] font-bold uppercase">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-2">
                                <Package size={12} className="text-accent" />
                                {pack.name} ({pack.brushes.length})
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-3 space-y-3">
                            <div className="flex items-center justify-end gap-2 px-1">
                               <button 
                                 onClick={() => exportBrushPack?.(pack)}
                                 className="flex items-center gap-1 text-[9px] font-bold uppercase bg-accent/10 px-2 py-1 rounded hover:bg-accent transition-colors"
                               >
                                 <Download size={10} /> Share Pack
                               </button>
                               <button 
                                 onClick={() => deleteBrushPack?.(pack.id, true)}
                                 className="flex items-center gap-1 text-[9px] font-bold uppercase bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                               >
                                 <Trash2 size={10} /> Ungroup
                               </button>
                            </div>
                            {pack.brushes.length > 0 ? (
                              <div className="grid grid-cols-4 gap-2">
                                {pack.brushes.map(b => renderBrushItem(b, pack.id))}
                              </div>
                            ) : (
                              <p className="text-[9px] italic opacity-40 text-center py-2">This pack is empty.</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
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
                "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0",
                isShapeActive ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
              )}
              title="Shapes"
            >
              {React.createElement(ShapeIcon, { size: 16 })}
              <div className="absolute -bottom-0.5 -right-0.5 bg-foreground text-white rounded-full p-0.5 scale-50">
                <ChevronDown size={10} strokeWidth={4} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side={isMobile ? "bottom" : "right"} align="start" className="w-48 p-3 sketch-card z-[100]">
            <div className="grid grid-cols-2 gap-2">
              {shapeTools.map((t) => {
                const ToolIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id as ToolType)}
                    className={cn(
                      "p-3 sketch-border transition-all hover:bg-accent flex flex-col items-center gap-1",
                      currentTool === t.id ? "bg-accent" : "bg-white"
                    )}
                  >
                    <ToolIcon size={18} />
                    <span className="text-[8px] font-bold uppercase">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <div className="hidden md:block w-full h-px bg-foreground opacity-5 my-1" />
        
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "p-2 sketch-border transition-all hover:bg-accent group relative shrink-0",
                currentTool === 'move' ? "bg-accent shadow-[1px_1px_0px_0px_#454D52]" : "bg-white"
              )}
              title="Move & Transform"
              onClick={() => setTool('move')}
            >
              <Move size={16} />
              <div className="absolute -bottom-0.5 -right-0.5 bg-foreground text-white rounded-full p-0.5 scale-50">
                <ChevronDown size={10} strokeWidth={4} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side={isMobile ? "bottom" : "right"} align="start" className="w-48 p-3 sketch-card z-[100]">
            <div className="grid grid-cols-2 gap-2">
              {transformModes.map((m) => {
                const ModeIcon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setTool('move'); setMoveMode(m.id as MoveMode); }}
                    className={cn(
                      "p-3 sketch-border transition-all hover:bg-accent flex flex-col items-center gap-1",
                      (currentTool === 'move' && moveMode === m.id) ? "bg-accent" : "bg-white"
                    )}
                  >
                    <ModeIcon size={18} />
                    <span className="text-[8px] font-bold uppercase">{m.label}</span>
                  </button>
                );
              })}
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

      <input 
        type="file" 
        ref={importInputRef} 
        onChange={(e) => { const f = e.target.files?.[0]; if (f && importBrushPack) importBrushPack(f); }} 
        accept=".brush,.brushpack,.json" 
        className="hidden" 
      />
    </div>
  );
};