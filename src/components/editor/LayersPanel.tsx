
"use client"

import React, { useState } from 'react';
import { Layer } from '@/lib/types';
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
  ClipboardPaste
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-2xl z-[100] border-l-2 border-foreground/10 flex flex-col animate-in slide-in-from-right duration-300">
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
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={() => setDraggedIndex(null)}
            onClick={() => onSetActive(layer.id)}
            className={cn(
              "p-2 sketch-border flex items-center gap-3 cursor-pointer transition-all group relative",
              activeLayerId === layer.id ? "bg-accent/10 border-accent shadow-[2px_2px_0px_0px_rgba(130,201,201,0.3)]" : "bg-white hover:bg-accent/5",
              draggedIndex === index && "opacity-30 border-dashed"
            )}
          >
            <div className="flex flex-col gap-2 items-center">
              <div className="cursor-grab active:cursor-grabbing">
                <GripVertical size={12} className="opacity-40 group-hover:opacity-80" />
              </div>
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
            
            <div className="w-12 h-10 sketch-border bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]" />
              {layer.imageData ? (
                <img 
                  src={layer.imageData} 
                  alt={layer.name} 
                  className={cn(
                    "max-w-full max-h-full object-contain pointer-events-none transition-opacity",
                    !layer.visible && "opacity-30"
                  )} 
                />
              ) : (
                <ImageIcon size={12} className="opacity-10" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-[10px] font-bold truncate uppercase tracking-tighter leading-tight",
                !layer.visible && "opacity-40"
              )}>
                {layer.name}
              </p>
              <p className="text-[8px] opacity-40 font-mono">
                {activeLayerId === layer.id ? "ACTIVE" : ""}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
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
            
            {activeLayerId === layer.id && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-accent rounded-full" />
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t-2 border-foreground/5 bg-slate-50/50 space-y-2">
        <button 
          onClick={onAdd}
          className="w-full py-2 bg-accent text-white font-bold sketch-border flex items-center justify-center gap-2 hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] transition-all text-xs"
        >
          <Plus size={14} />
          New Layer
        </button>
        <button 
          onClick={onPaste}
          disabled={!hasCopiedLayer}
          className="w-full py-2 bg-white text-foreground font-bold sketch-border flex items-center justify-center gap-2 hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs"
        >
          <ClipboardPaste size={14} />
          Paste Layer
        </button>
        <p className="text-[8px] text-center mt-3 opacity-40 font-bold uppercase tracking-widest">
          Stack: Top to Bottom
        </p>
      </div>
    </div>
  );
};
