"use client"

import React, { useState, useRef } from 'react';
import { useAnimationState } from '@/hooks/use-animation-state';
import { SketchCanvas } from '@/components/editor/SketchCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { Timeline } from '@/components/editor/Timeline';
import { PlaybackControls } from '@/components/editor/PlaybackControls';
import { CustomBrushDialog } from '@/components/editor/CustomBrushDialog';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { Save, FolderOpen, Layers, Settings2, Settings, Download, Upload, Video, Loader2, Sparkles, Plus, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FrameGroup } from '@/lib/types';

export default function Home() {
  const {
    project,
    currentFrameIndex,
    selectedFrameIndices,
    selectFrame,
    activeLayerId,
    setActiveLayerId,
    isPlaying,
    tool,
    setTool,
    color,
    setColor,
    brushSize,
    setBrushSize,
    opacity,
    setOpacity,
    hardness,
    setHardness,
    pressureEnabled,
    setPressureEnabled,
    stabilizationEnabled,
    setStabilizationEnabled,
    dynamicStampingEnabled,
    setDynamicStampingEnabled,
    customBrushColorLink,
    setCustomBrushColorLink,
    customBrushData,
    setCustomBrushData,
    isMultiDrawEnabled,
    setIsMultiDrawEnabled,
    multiDrawRange,
    setMultiDrawRange,
    addFrame,
    deleteFrame,
    duplicateFrame,
    reorderFrames,
    updateLayerData,
    addLayer,
    copyLayer,
    pasteLayer,
    hasCopiedLayer,
    deleteLayer,
    reorderLayers,
    toggleLayerVisibility,
    togglePlayback,
    toggleOnionSkin,
    saveProject,
    loadProject,
    downloadProject,
    uploadProject,
    exportToGif,
    isExporting,
    setProject,
    undo,
    redo,
    flipCurrentLayer,
    canUndo,
    canRedo
  } = useAnimationState();

  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isMultiDrawDialogOpen, setIsMultiDrawDialogOpen] = useState(false);
  const [tempRange, setTempRange] = useState(multiDrawRange.toString());
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group Management State
  const [groupStart, setGroupStart] = useState('1');
  const [groupEnd, setGroupEnd] = useState('1');
  const [groupName, setGroupName] = useState('New Action');
  const [groupFps, setGroupFps] = useState('12');
  const [groupColor, setGroupColor] = useState('#82C9C9');

  const currentFrame = project.frames[currentFrameIndex];
  const activeGroup = project.groups?.find(g => currentFrameIndex >= g.startIndex && currentFrameIndex <= g.endIndex);
  
  const currentFps = activeGroup ? activeGroup.fps : project.fps;

  const handleFpsChange = (newFps: number) => {
    if (activeGroup) {
      setProject(p => ({
        ...p,
        groups: p.groups.map(g => g.id === activeGroup.id ? { ...g, fps: newFps } : g)
      }));
    } else {
      setProject(p => ({ ...p, fps: newFps }));
    }
  };

  const handleAddGroup = () => {
    const start = Math.max(0, parseInt(groupStart) - 1);
    const end = Math.min(project.frames.length - 1, parseInt(groupEnd) - 1);
    
    if (isNaN(start) || isNaN(end) || start > end) return;

    const newGroup: FrameGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: groupName,
      startIndex: start,
      endIndex: end,
      fps: parseInt(groupFps) || 12,
      color: groupColor
    };

    setProject(p => ({
      ...p,
      groups: [...(p.groups || []), newGroup]
    }));
    setIsGroupDialogOpen(false);
  };

  const removeGroup = (id: string) => {
    setProject(p => ({
      ...p,
      groups: p.groups.filter(g => g.id !== id)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadProject(file);
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-background overflow-x-hidden">
      <div className="w-full flex items-center justify-between max-w-7xl h-auto md:h-14 p-2 md:px-4 bg-white/30 backdrop-blur-sm border-b border-foreground/10 sticky top-0 z-50">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <h1 className="text-base md:text-lg font-bold italic tracking-tighter text-primary">
            SketchFlow <span className="text-accent">Studio</span>
          </h1>
          
          <div className="flex items-center gap-1 bg-white p-1 sketch-border">
            <button onClick={toggleOnionSkin} className={cn("p-1.5 hover:bg-accent transition-all rounded", project.onionSkinEnabled ? "bg-accent" : "transparent")} title="Onion Skinning">
              <Layers size={14} className="md:w-4 md:h-4" />
            </button>
            <button onClick={saveProject} className="p-1.5 hover:bg-accent transition-all rounded" title="Quick Save (Browser)">
              <Save size={14} className="md:w-4 md:h-4" />
            </button>
            <button onClick={loadProject} className="p-1.5 hover:bg-accent transition-all rounded" title="Quick Load (Browser)">
              <FolderOpen size={14} className="md:w-4 md:h-4" />
            </button>
            <div className="w-px h-4 bg-foreground/10 mx-1" />
            <button onClick={downloadProject} className="p-1.5 hover:bg-accent transition-all rounded" title="Download Project File">
              <Download size={14} className="md:w-4 md:h-4" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-accent transition-all rounded" title="Upload Project File">
              <Upload size={14} className="md:w-4 md:h-4" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".sketchflow,.json" className="hidden" />
            <div className="w-px h-4 bg-foreground/10 mx-1" />
            <button onClick={exportToGif} disabled={isExporting} className="p-1.5 hover:bg-accent transition-all rounded flex items-center gap-1 group" title="Export as GIF">
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} className="md:w-4 md:h-4" />}
              <span className="text-[10px] font-bold hidden md:inline uppercase group-hover:text-primary transition-colors">Export GIF</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3 bg-white px-2 py-1 sketch-border">
            <div className="flex items-center">
              <div className="w-5 h-5 sketch-border cursor-pointer overflow-hidden relative" style={{ backgroundColor: color }}>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-accent/10 px-1 py-0.5 rounded transition-colors">
                  <span className="text-[10px] font-bold w-6">{brushSize}px</span>
                  <Settings2 size={12} className="opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 sketch-card p-4 space-y-4" side="bottom" align="end">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-tighter">Size</label>
                    <span className="text-[10px] font-mono">{brushSize}px</span>
                  </div>
                  <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1 accent-accent cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-tighter">Opacity</label>
                    <span className="text-[10px] font-mono">{opacity}%</span>
                  </div>
                  <input type="range" min="1" max="100" value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))} className="w-full h-1 accent-accent cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-tighter">Hardness</label>
                    <span className="text-[10px] font-mono">{hardness}%</span>
                  </div>
                  <input type="range" min="1" max="100" value={hardness} onChange={(e) => setHardness(parseInt(e.target.value))} className="w-full h-1 accent-accent cursor-pointer" />
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 hover:bg-accent/10 rounded transition-colors">
                  <Settings size={14} className="opacity-70" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 sketch-card p-4 space-y-4 max-h-[80vh] overflow-y-auto" side="bottom" align="end">
                <h4 className="text-[10px] font-bold uppercase tracking-widest border-b pb-2 mb-2">Editor Settings</h4>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="pressure-mode" className="text-xs">Pressure Sensitivity</Label>
                  <Switch id="pressure-mode" checked={pressureEnabled} onCheckedChange={setPressureEnabled} />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="stabilization-mode" className="text-xs">Line Stabilization</Label>
                  <Switch id="stabilization-mode" checked={stabilizationEnabled} onCheckedChange={setStabilizationEnabled} />
                </div>
                
                <div className="pt-2 border-t mt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3">Sync Tools</h4>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col">
                      <Label htmlFor="multi-draw" className="text-xs">Multi Draw across frames</Label>
                      {isMultiDrawEnabled && (
                        <button onClick={() => setIsMultiDrawDialogOpen(true)} className="text-[8px] text-accent uppercase font-bold text-left hover:underline">
                          Extent: {multiDrawRange} Frames
                        </button>
                      )}
                    </div>
                    <Switch id="multi-draw" checked={isMultiDrawEnabled} onCheckedChange={(checked) => { setIsMultiDrawEnabled(checked); if (checked) setIsMultiDrawDialogOpen(true); }} />
                  </div>
                </div>

                <div className="pt-2 border-t mt-2">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3">Frame Groups (Variable FPS)</h4>
                   <div className="space-y-2">
                     <Button variant="outline" size="sm" onClick={() => setIsGroupDialogOpen(true)} className="w-full text-[10px] font-bold uppercase sketch-border h-7">
                       <Plus size={12} className="mr-1" /> Create Group
                     </Button>
                     <div className="space-y-1">
                       {project.groups?.map(group => (
                         <div key={group.id} className="flex items-center justify-between p-1 bg-slate-50 border rounded text-[9px] group/item">
                           <div className="flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                             <span className="font-bold">{group.name}</span>
                             <span className="opacity-40">{group.startIndex+1}-{group.endIndex+1}</span>
                             <span className="text-accent font-bold">{group.fps}F</span>
                           </div>
                           <button onClick={() => removeGroup(group.id)} className="opacity-0 group-hover/item:opacity-100 text-red-500 hover:scale-110 transition-all">
                             <Trash2 size={10} />
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                </div>

                <div className="pt-2 border-t mt-2">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3">Custom Brush Engine</h4>
                   <CustomBrushDialog onSave={setCustomBrushData} currentBrush={customBrushData} layers={currentFrame.layers} width={project.width} height={project.height} />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex items-center">
          <PlaybackControls 
            isPlaying={isPlaying}
            togglePlayback={togglePlayback}
            fps={currentFps}
            setFps={handleFpsChange}
            onPrev={() => selectFrame(Math.max(0, currentFrameIndex - 1))}
            onNext={() => selectFrame(Math.min(project.frames.length - 1, currentFrameIndex + 1))}
            activeGroup={activeGroup}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 w-full max-w-7xl items-center md:items-start py-4 md:py-6">
        <div className="w-full md:w-auto px-4 mb-4 md:mb-0 md:flex-none md:sticky md:top-20 z-40">
          <Toolbar currentTool={tool} setTool={setTool} undo={undo} redo={redo} flip={flipCurrentLayer} canUndo={canUndo} canRedo={canRedo} color={color} onOpenLayers={() => setIsLayersOpen(true)} isMultiDrawEnabled={isMultiDrawEnabled} setIsMultiDrawEnabled={setIsMultiDrawEnabled} />
        </div>

        <div className="flex-1 flex flex-col items-center px-4 gap-4 md:gap-6 pb-20 w-full overflow-hidden">
          <div className="w-full max-w-full flex justify-center">
            <div className="shadow-xl bg-white sketch-border overflow-hidden w-full max-w-[800px]">
              <SketchCanvas width={project.width} height={project.height} currentFrame={currentFrame} prevFrame={currentFrameIndex > 0 ? project.frames[currentFrameIndex - 1] : undefined} nextFrame={currentFrameIndex < project.frames.length - 1 ? project.frames[currentFrameIndex + 1] : undefined} activeLayerId={activeLayerId} onionSkinEnabled={project.onionSkinEnabled} tool={tool} color={color} brushSize={brushSize} opacity={opacity} hardness={hardness} onLayerUpdate={updateLayerData} isPlaying={isPlaying} pressureEnabled={pressureEnabled} stabilizationEnabled={stabilizationEnabled} dynamicStampingEnabled={dynamicStampingEnabled} customBrushColorLink={customBrushColorLink} customBrushData={customBrushData} />
            </div>
          </div>
          
          <div className="w-full max-w-[800px] flex-none">
            <Timeline frames={project.frames} groups={project.groups} currentFrameIndex={currentFrameIndex} selectedFrameIndices={selectedFrameIndices} onSelectFrame={selectFrame} addFrame={addFrame} deleteFrame={deleteFrame} duplicateFrame={duplicateFrame} reorderFrames={reorderFrames} />
          </div>
        </div>
      </div>

      {isLayersOpen && <LayersPanel layers={currentFrame.layers} activeLayerId={activeLayerId} onSetActive={setActiveLayerId} onAdd={addLayer} onCopy={copyLayer} onPaste={pasteLayer} hasCopiedLayer={hasCopiedLayer} onDelete={deleteLayer} onReorder={reorderLayers} onToggleVisibility={toggleLayerVisibility} onClose={() => setIsLayersOpen(false)} />}

      <Dialog open={isMultiDrawDialogOpen} onOpenChange={setIsMultiDrawDialogOpen}>
        <DialogContent className="sketch-card sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              Multi-Draw Sync
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase opacity-60">Number of frames</Label>
              <Input type="number" value={tempRange} onChange={(e) => setTempRange(e.target.value)} min="1" max="100" className="sketch-border" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { const range = parseInt(tempRange); if (!isNaN(range)) setMultiDrawRange(range); setIsMultiDrawDialogOpen(false); }} className="w-full bg-accent hover:bg-accent/90 font-bold uppercase text-xs sketch-border">Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="sketch-card sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Zap size={16} className="text-accent" />
              Make FPS Group
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-bold opacity-60">From Frame</Label>
                <Input type="number" value={groupStart} onChange={(e) => setGroupStart(e.target.value)} min="1" max={project.frames.length} className="sketch-border h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-bold opacity-60">To Frame</Label>
                <Input type="number" value={groupEnd} onChange={(e) => setGroupEnd(e.target.value)} min="1" max={project.frames.length} className="sketch-border h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold opacity-60">Group Speed (FPS)</Label>
              <Input type="number" value={groupFps} onChange={(e) => setGroupFps(e.target.value)} min="1" max="60" className="sketch-border h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold opacity-60">Group Color</Label>
              <div className="flex gap-2">
                {['#82C9C9', '#F0A0A0', '#A0F0A0', '#A0A0F0', '#F0F0A0'].map(c => (
                  <button key={c} onClick={() => setGroupColor(c)} className={cn("w-6 h-6 rounded-full border-2", groupColor === c ? "border-foreground" : "border-transparent")} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddGroup} className="w-full bg-accent hover:bg-accent/90 font-bold uppercase text-xs sketch-border">Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-auto h-8 flex items-center justify-center w-full text-[8px] md:text-[10px] opacity-40 uppercase font-bold bg-white/50 border-t border-foreground/5 shrink-0">
        Tip: Groups allow you to change speed for specific parts of your animation!
      </div>
    </main>
  );
}
