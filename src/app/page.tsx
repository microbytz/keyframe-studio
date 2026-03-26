
"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useAnimationState } from '@/hooks/use-animation-state';
import { SketchCanvas, SketchCanvasHandle } from '@/components/editor/SketchCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { Timeline } from '@/components/editor/Timeline';
import { AudioTimeline } from '@/components/editor/AudioTimeline';
import { PlaybackControls } from '@/components/editor/PlaybackControls';
import { CustomBrushDialog } from '@/components/editor/CustomBrushDialog';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { AIPanel } from '@/components/editor/AIPanel';
import { 
  Save, 
  FolderOpen, 
  Layers, 
  Settings2, 
  Settings, 
  Download, 
  Upload, 
  Video, 
  Loader2, 
  Sparkles, 
  Plus, 
  Trash2, 
  Zap, 
  Ghost, 
  Scissors, 
  Copy, 
  Move, 
  Check, 
  Clock, 
  Music,
  Mic,
  Volume2
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    loopSelection,
    setLoopSelection,
    tool,
    lastBrushTool,
    lastShapeTool,
    setTool,
    moveMode,
    setMoveMode,
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
    updateFrameDuration,
    addLayer,
    copyLayer,
    pasteLayer,
    hasCopiedLayer,
    deleteLayer,
    reorderLayers,
    toggleLayerVisibility,
    toggleLayerLock,
    updateLayerOpacity,
    updateLayerBlendMode,
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
    canRedo,
    setCopiedLayerData,
    handleCustomBrushSave,
    deleteSavedBrush,
    setAudio,
    removeAudio
  } = useAnimationState();

  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isMultiDrawDialogOpen, setIsMultiDrawDialogOpen] = useState(false);
  const [tempRange, setTempRange] = useState(multiDrawRange.toString());
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const canvasRef = useRef<SketchCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioTimelineRef = useRef<HTMLDivElement>(null);

  const [groupStart, setGroupStart] = useState('1');
  const [groupEnd, setGroupEnd] = useState('1');
  const [groupName, setGroupName] = useState('New Action');
  const [groupFps, setGroupFps] = useState('12');
  const [groupColor, setGroupColor] = useState('#82C9C9');

  // Export Settings
  const [exportScale, setExportScale] = useState('1');
  const [exportTransparent, setExportTransparent] = useState(false);
  const [exportStartFrame, setExportStartFrame] = useState('1');
  const [exportEndFrame, setExportEndFrame] = useState(project.frames.length.toString());

  // Update export bounds when project changes
  useEffect(() => {
    setExportEndFrame(project.frames.length.toString());
  }, [project.frames.length]);

  const currentFrame = project.frames[currentFrameIndex];
  const activeGroup = project.groups?.find(g => currentFrameIndex >= g.startIndex && currentFrameIndex <= g.endIndex);
  const currentFps = activeGroup ? activeGroup.fps : project.fps;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if (e.key === 'ArrowLeft') selectFrame(Math.max(0, currentFrameIndex - 1));
      if (e.key === 'ArrowRight') selectFrame(Math.min(project.frames.length - 1, currentFrameIndex + 1));
      if (e.key === '[') setBrushSize(Math.max(1, brushSize - 1));
      if (e.key === ']') setBrushSize(Math.min(100, brushSize + 1));
      if (e.key === 'b') setTool('pen');
      if (e.key === 'e') setTool('eraser');
      if (e.key === 'm') setTool('move');
      if (e.key === ' ') { e.preventDefault(); togglePlayback(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFrameIndex, project.frames.length, undo, redo, selectFrame, brushSize, setBrushSize, setTool, togglePlayback]);

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

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudio(file, file.name);
  };

  const scrollToAudio = () => {
    audioTimelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleLassoAction = (action: 'cut' | 'copy' | 'select' | 'move') => {
    const result = canvasRef.current?.executeLassoAction(action);
    if (result && (action === 'copy' || action === 'move')) {
      setCopiedLayerData({ name: 'Selection', imageData: result });
    }
    if (action === 'move') {
      setTool('move');
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* AI Panel Integrated */}
      <AIPanel />

      {/* Header / Top Bar */}
      <div className="w-full flex items-center justify-between h-auto md:h-14 p-2 md:px-4 bg-white/80 backdrop-blur-sm border-b border-foreground/10 sticky top-0 z-[60]">
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
            
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-accent transition-all rounded relative" title="Audio Hub">
                  <Music size={14} className="md:w-4 md:h-4" />
                  {project.audioData && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full border border-white" />}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 sketch-card p-2 space-y-1" side="bottom" align="start">
                 <button 
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 hover:bg-accent/10 rounded text-[10px] font-bold uppercase flex items-center gap-2"
                 >
                   <Upload size={12} /> Import Audio
                 </button>
                 <button 
                  onClick={scrollToAudio}
                  className="w-full text-left px-3 py-2 hover:bg-accent/10 rounded text-[10px] font-bold uppercase flex items-center gap-2"
                 >
                   <Mic size={12} /> Record Live
                 </button>
                 {project.audioData && (
                   <button 
                    onClick={removeAudio}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-500 rounded text-[10px] font-bold uppercase flex items-center gap-2"
                   >
                     <Trash2 size={12} /> Clear Track
                   </button>
                 )}
              </PopoverContent>
            </Popover>
            <input type="file" ref={audioInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden" />

            <div className="w-px h-4 bg-foreground/10 mx-1" />
            <button onClick={downloadProject} className="p-1.5 hover:bg-accent transition-all rounded" title="Download Project File">
              <Download size={14} className="md:w-4 md:h-4" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-accent transition-all rounded" title="Upload Project File">
              <Upload size={14} className="md:w-4 md:h-4" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".sketchflow,.json" className="hidden" />
            <div className="w-px h-4 bg-foreground/10 mx-1" />
            
            <Popover>
              <PopoverTrigger asChild>
                <button disabled={isExporting} className="p-1.5 hover:bg-accent transition-all rounded flex items-center gap-1 group" title="Export Settings">
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} className="md:w-4 md:h-4" />}
                  <span className="text-[10px] font-bold hidden md:inline uppercase group-hover:text-primary transition-colors">Export GIF</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 sketch-card p-4 space-y-4" side="bottom" align="start">
                <h4 className="text-[10px] font-bold uppercase tracking-widest border-b pb-2 mb-2">GIF Export Settings</h4>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-60">Output Resolution</Label>
                  <Select value={exportScale} onValueChange={setExportScale}>
                    <SelectTrigger className="sketch-border h-8 text-xs font-bold">
                      <SelectValue placeholder="Resolution" />
                    </SelectTrigger>
                    <SelectContent className="sketch-card">
                      <SelectItem value="0.5" className="text-xs">0.5x (Small - 400px)</SelectItem>
                      <SelectItem value="1" className="text-xs">1.0x (Standard - 800px)</SelectItem>
                      <SelectItem value="1.5" className="text-xs">1.5x (Large - 1200px)</SelectItem>
                      <SelectItem value="2" className="text-xs">2.0x (Full HD - 1600px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-60">Frame Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase font-bold opacity-40">From</span>
                      <Input 
                        type="number" 
                        min="1" 
                        max={project.frames.length} 
                        value={exportStartFrame} 
                        onChange={(e) => setExportStartFrame(e.target.value)}
                        className="sketch-border h-7 text-[10px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase font-bold opacity-40">To</span>
                      <Input 
                        type="number" 
                        min="1" 
                        max={project.frames.length} 
                        value={exportEndFrame} 
                        onChange={(e) => setExportEndFrame(e.target.value)}
                        className="sketch-border h-7 text-[10px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-2 pt-2">
                  <div className="flex flex-col">
                    <Label htmlFor="transparent-export" className="text-xs font-bold">Transparent Background</Label>
                    <span className="text-[8px] opacity-50 uppercase">Best for stickers/overlays</span>
                  </div>
                  <Switch id="transparent-export" checked={exportTransparent} onCheckedChange={setExportTransparent} />
                </div>

                <Button 
                  onClick={() => exportToGif({ 
                    scale: parseFloat(exportScale), 
                    transparent: exportTransparent,
                    startFrame: parseInt(exportStartFrame) - 1,
                    endFrame: parseInt(exportEndFrame) - 1
                  })} 
                  disabled={isExporting}
                  className="w-full mt-2 bg-accent hover:bg-accent/90 text-primary font-bold uppercase text-[10px] sketch-border h-9"
                >
                  {isExporting ? <Loader2 className="animate-spin mr-2" size={14} /> : <Download size={14} className="mr-2" />}
                  Generate GIF
                </Button>
              </PopoverContent>
            </Popover>
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
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Ghost size={12} className="text-accent" />
                    Onion Skinning
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="main-onion-toggle" className="text-xs font-bold">Enable Onion Skin</Label>
                      <Switch id="main-onion-toggle" checked={project.onionSkinEnabled} onCheckedChange={toggleOnionSkin} />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="advanced-skin" className="text-xs">Multi-Skin Mode</Label>
                      <Switch id="advanced-skin" checked={project.advancedOnionSkinEnabled} onCheckedChange={(checked) => setProject(p => ({ ...p, advancedOnionSkinEnabled: checked }))} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t mt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Volume2 size={12} className="text-accent" />
                    Audio Sync
                  </h4>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="scrub-sound" className="text-xs">Scrub with Sound</Label>
                    <Switch id="scrub-sound" checked={project.scrubWithSound} onCheckedChange={(checked) => setProject(p => ({ ...p, scrubWithSound: checked }))} />
                  </div>
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
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex items-center">
          <PlaybackControls 
            isPlaying={isPlaying}
            togglePlayback={togglePlayback}
            loopSelection={loopSelection}
            setLoopSelection={setLoopSelection}
            fps={currentFps}
            setFps={handleFpsChange}
            onPrev={() => selectFrame(Math.max(0, currentFrameIndex - 1))}
            onNext={() => selectFrame(Math.min(project.frames.length - 1, currentFrameIndex + 1))}
            activeGroup={activeGroup}
            hasSelection={selectedFrameIndices.length > 1}
          />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto py-4 md:py-6 relative min-h-0">
        {/* Left Toolbar Column */}
        <div className="w-full md:w-16 px-4 mb-4 md:mb-0 md:flex-none">
          <Toolbar 
            currentTool={tool} 
            lastBrushTool={lastBrushTool} 
            lastShapeTool={lastShapeTool} 
            setTool={setTool} 
            moveMode={moveMode} 
            setMoveMode={setMoveMode} 
            undo={undo} 
            redo={redo} 
            flip={flipCurrentLayer} 
            canUndo={canUndo} 
            canRedo={canRedo} 
            color={color} 
            onOpenLayers={() => setIsLayersOpen(true)} 
            isMultiDrawEnabled={isMultiDrawEnabled} 
            setIsMultiDrawEnabled={setIsMultiDrawEnabled} 
            savedBrushes={project.savedBrushes} 
            customBrushData={customBrushData} 
            setCustomBrushData={setCustomBrushData} 
            deleteSavedBrush={deleteSavedBrush} 
          />
        </div>

        {/* Central Editor Area */}
        <div className="flex-1 flex flex-col items-center px-4 gap-6 min-h-0">
          {tool === 'lasso' && (
            <div className="flex items-center gap-2 bg-white p-2 sketch-border animate-in slide-in-from-top duration-300 z-30 shadow-md">
               <span className="text-[10px] font-bold uppercase opacity-50 mr-2 px-2 border-r">Lasso Active</span>
               <button onClick={() => handleLassoAction('cut')} className="flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-50 hover:bg-red-50 px-2 py-1 rounded border transition-colors">
                  <Scissors size={12} /> Cut
               </button>
               <button onClick={() => handleLassoAction('copy')} className="flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded border transition-colors">
                  <Copy size={12} /> Cut & Copy
               </button>
               <button onClick={() => handleLassoAction('select')} className="flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-50 hover:bg-accent/20 px-2 py-1 rounded border transition-colors">
                  <Check size={12} /> Select
               </button>
               <button onClick={() => handleLassoAction('move')} className="flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-50 hover:bg-orange-50 px-2 py-1 rounded border transition-colors">
                  <Move size={12} /> Select & Move
               </button>
            </div>
          )}
          
          <div className="w-full flex justify-center">
            <div className="shadow-xl bg-white sketch-border overflow-hidden w-full max-w-[800px]">
              <SketchCanvas 
                ref={canvasRef} 
                width={project.width} 
                height={project.height} 
                frames={project.frames} 
                currentFrameIndex={currentFrameIndex} 
                activeLayerId={activeLayerId} 
                onionSkinEnabled={project.onionSkinEnabled} 
                advancedOnionSkinEnabled={project.advancedOnionSkinEnabled} 
                onionSkinBefore={project.onionSkinBefore} 
                onionSkinAfter={project.onionSkinAfter} 
                tool={tool} 
                moveMode={moveMode} 
                color={color} 
                brushSize={brushSize} 
                opacity={opacity} 
                hardness={hardness} 
                onLayerUpdate={updateLayerData} 
                isPlaying={isPlaying} 
                pressureEnabled={pressureEnabled} 
                stabilizationEnabled={stabilizationEnabled} 
                dynamicStampingEnabled={dynamicStampingEnabled} 
                customBrushColorLink={customBrushColorLink} 
                customBrushData={customBrushData} 
              />
            </div>
          </div>
          
          {/* Bottom Timeline Column */}
          <div className="w-full max-w-[800px] space-y-4 pb-12">
            <div className="flex items-center justify-between bg-white px-3 py-1.5 sketch-border">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-accent" />
                <span className="text-[10px] font-bold uppercase opacity-50">Hold Frame (Exposure)</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="1" 
                  max="24" 
                  value={currentFrame.duration || 1} 
                  onChange={(e) => updateFrameDuration(currentFrameIndex, parseInt(e.target.value))}
                  className="w-32 h-1 accent-accent cursor-pointer" 
                />
                <span className="text-[10px] font-mono font-bold w-12 text-center bg-accent/10 px-2 py-0.5 rounded">
                  {currentFrame.duration || 1} Beats
                </span>
              </div>
            </div>
            
            <Timeline frames={project.frames} groups={project.groups} currentFrameIndex={currentFrameIndex} selectedFrameIndices={selectedFrameIndices} onSelectFrame={selectFrame} addFrame={addFrame} deleteFrame={deleteFrame} duplicateFrame={duplicateFrame} reorderFrames={reorderFrames} />
            
            <div ref={audioTimelineRef}>
              <AudioTimeline 
                audioData={project.audioData}
                metadata={project.audioMetadata}
                isPlaying={isPlaying}
                currentFrameIndex={currentFrameIndex}
                totalFrames={project.frames.length}
                frames={project.frames}
                fps={project.fps}
                onRecord={(blob) => setAudio(blob, 'Recording')}
                onRemove={removeAudio}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      {isLayersOpen && <LayersPanel layers={currentFrame.layers} activeLayerId={activeLayerId} onSetActive={setActiveLayerId} onAdd={addLayer} onCopy={copyLayer} onPaste={pasteLayer} hasCopiedLayer={hasCopiedLayer} onDelete={deleteLayer} onReorder={reorderLayers} onToggleVisibility={toggleLayerVisibility} onToggleLock={toggleLayerLock} onOpacityChange={updateLayerOpacity} onBlendModeChange={updateLayerBlendMode} onClose={() => setIsLayersOpen(false)} />}

      {/* Dialogs */}
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

      <div className="h-8 flex items-center justify-center w-full text-[8px] md:text-[10px] opacity-40 uppercase font-bold bg-white/50 border-t border-foreground/5 shrink-0">
        Tip: Sync your animation to audio peaks for perfect timing! Use the visual beat markers in the audio bar.
      </div>
    </main>
  );
}
