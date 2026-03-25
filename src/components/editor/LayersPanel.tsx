"use client"

import React from 'react';
import { Layer } from '@/lib/types';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Layers as LayersIcon, 
  X,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSetActive: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onClose: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSetActive,
  onAdd,
  onDelete,
  onToggleVisibility,
  onClose
}) => {
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

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {layers.map((layer) => (
          <div 
            key={layer.id}
            onClick={() => onSetActive(layer.id)}
            className={cn(
              "p-2 sketch-border flex items-center gap-3 cursor-pointer transition-all group",
              activeLayerId === layer.id ? "bg-accent/20 border-accent" : "bg-white hover:bg-accent/5"
            )}
          >
            <GripVertical size={14} className="opacity-20 group-hover:opacity-40" />
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              className="p-1 hover:bg-foreground/5 rounded"
            >
              {layer.visible ? <Eye size={14} /> : <EyeOff size={14} className="opacity-40" />}
            </button>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-xs font-bold truncate uppercase tracking-tighter",
                !layer.visible && "opacity-40"
              )}>
                {layer.name}
              </p>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(layer.id);
              }}
              className="p-1 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={layers.length <= 1}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t-2 border-foreground/5">
        <button 
          onClick={onAdd}
          className="w-full py-2 bg-accent text-white font-bold sketch-border flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          New Layer
        </button>
      </div>
    </div>
  );
};
