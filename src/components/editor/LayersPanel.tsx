"use client"

import React, { useState } from 'react';
import { Layer, BlendMode } from '@/lib/types';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Layers as LayersIcon, 
  X,
  GripVertical,
  Image as ImageIcon,
  Copy,
  ClipboardPaste,
  Lock,
  LockOpen,
  Blend
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSetActive: (id: string) => void;
  onAdd: () => void;
  onCopy: (id: string) => void;
  onPaste: () => void;
  hasCopiedLayer: boolean;
  onDelete: (id: string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onBlendModeChange: (id: string, blendMode: BlendMode) => void;
  onClose: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSetActive,
  onAdd,
  onCopy,
  onPaste,
  hasCopiedLayer,
  onDelete,
  onReorder,
  onToggleVisibility,
  onToggleLock,
  onOpacityChange,
  onBlendModeChange,
  onClose
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
  };

  const blendModes: { value: BlendMode; label: string }[] = [
    { value: 'source-over', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'screen', label: 'Screen' },
    { value: 'darken', label: 'Darken' },
    { value: 'lighten', label: 'Lighten' },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[100] border-l-2 border-foreground/10 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b-2 border-foreground/5 flex items-center justify-between bg-accent/5">
        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
          <LayersIcon size={18} className="text-accent" />
          Layers
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-accent/20 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {layers.map((layer, index) => (
          <div 
            key={layer.id}
            draggable={!layer.locked}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={() => setDraggedIndex(null)}
            onClick={() => onSetActive(layer.id)}
            className={cn(
              "p-3 sketch-border flex flex-col gap-2 cursor-pointer transition-all group relative",
              activeLayerId === layer.id ? "bg-accent/10 border-accent shadow-[2px_2px_0px_0px_rgba(130,201,201,0.3)]" : "bg-white hover:bg-accent/5",
              draggedIndex === index && "opacity-30 border-dashed",
              layer.locked && "opacity-80"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-2 items-center">
                {!layer.locked ? (
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical size={12} className="opacity-40 group-hover:opacity-80" />
                  </div>
                ) : (
                  <div className="w-3" />
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  className="p-1 hover:bg-foreground/5 rounded transition-colors"
                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                >
                  {layer.visible ? <Eye size={14} className="text-foreground" /> : <EyeOff size={14} className="text-foreground/30" />}
                </button>
              </div>
              
              <div className="w-14 h-12 sketch-border bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]" />
                {layer.imageData ? (
                  <img 
                    src={layer.imageData} 
                    alt={layer.name} 
                    className={cn(
                      "max-w-full max-h-full object-contain pointer-events-none transition-opacity",
                      (!layer.visible || layer.locked) && "opacity-30"
                    )} 
                    style={{ opacity: (layer.opacity ?? 100) / 100 }}
                  />
                ) : (
                  <ImageIcon size={14} className="opacity-10" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-bold truncate uppercase leading-tight flex items-center gap-1.5",
                  !layer.visible && "opacity-40"
                )}>
                  {layer.name}
                  {layer.locked && <Lock size={12} className="text-accent" />}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] bg-slate-100 px-1 rounded uppercase font-bold opacity-60">
                    {blendModes.find(b => b.value === (layer.blendMode || 'source-over'))?.label}
                  </span>
                  {activeLayerId === layer.id && (
                    <span className="text-[8px] text-accent font-bold uppercase">Active</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                  }}
                  className="p-1.5 hover:bg-accent/10 rounded transition-all"
                  title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                >
                  {layer.locked ? <Lock size={14} className="text-accent" /> : <LockOpen size={14} />}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(layer.id);
                  }}
                  className="p-1.5 hover:bg-accent/10 rounded transition-all"
                  title="Copy Layer"
                >
                  <Copy size={14} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(layer.id);
                  }}
                  className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  disabled={layers.length <= 1}
                  title="Delete Layer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="px-1 pb-1 space-y-3 mt-1 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase opacity-50">Opacity</span>
                  <span className="text-[9px] font-mono opacity-50">{layer.opacity ?? 100}%</span>
                </div>
                <Slider 
                  value={[layer.opacity ?? 100]} 
                  min={0} 
                  max={100} 
                  step={1} 
                  onValueChange={([val]) => onOpacityChange(layer.id, val)}
                  className="h-2"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase opacity-50 block">Blend Mode</span>
                <Select 
                  value={layer.blendMode || 'source-over'} 
                  onValueChange={(val) => onBlendModeChange(layer.id, val as BlendMode)}
                >
                  <SelectTrigger className="h-7 text-[10px] sketch-border bg-white font-bold uppercase">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent className="sketch-card">
                    {blendModes.map(mode => (
                      <SelectItem key={mode.value} value={mode.value} className="text-[10px] font-bold uppercase">
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {activeLayerId === layer.id && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-accent rounded-full" />
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t-2 border-foreground/5 bg-slate-50/50 space-y-2">
        <button 
          onClick={onAdd}
          className="w-full py-2.5 bg-accent text-white font-bold sketch-border flex items-center justify-center gap-2 hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] transition-all text-xs uppercase"
        >
          <Plus size={14} />
          New Layer
        </button>
        <button 
          onClick={onPaste}
          disabled={!hasCopiedLayer}
          className="w-full py-2.5 bg-white text-foreground font-bold sketch-border flex items-center justify-center gap-2 hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs uppercase"
        >
          <ClipboardPaste size={14} />
          Paste Layer
        </button>
        <p className="text-[9px] text-center mt-3 opacity-40 font-bold uppercase tracking-widest">
          Stack: Top to Bottom
        </p>
      </div>
    </div>
  );
};
