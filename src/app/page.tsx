"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useAnimationState } from '@/hooks/use-animation-state';
import { SketchCanvas, SketchCanvasHandle } from '@/components/editor/SketchCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { Timeline } from '@/components/editor/Timeline';
import { AudioTimeline } from '@/components/editor/AudioTimeline';
import { PlaybackControls } from '@/components/editor/PlaybackControls';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { CustomBrushDialog } from '@/components/editor/CustomBrushDialog';
import { 
  Save, 
  Layers, 
  Settings, 
  Download, 
  Upload, 
  Video, 
  Loader2, 
  Plus, 
  Trash2, 
  Scissors, 
  Copy, 
  Move, 
  Clock, 
  Music,
  History,
  FileClock,
  Briefcase,
  Paintbrush,
  Magnet,
  Grid,
  Clock3,
  Eye,
  Settings2,
  Zap,
  Stamp,
  Palette,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const {
    project,
    projectList,
    loadProjectById,
    deleteProject,
    createNewProject,
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
    saveSavedBrush,
    deleteSavedBrush,
    // Brush Pack Actions
    createBrushPack,
    addBrushToPack,
    removeBrushFromPack,
    deleteBrushPack,
    exportBrush,
    exportBrushPack,
    importBrushPack,
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
    togglePlayback,
    toggleOnionSkin,
    saveProject,
    downloadProject,
    uploadProject,
    exportToGif,
    isExporting,
    setProject,
    undo,
    redo,
    canUndo,
    canRedo,
    setCopiedLayerData,
    saveVersion,
    loadVersion,
    deleteVersion,
    isAutoSaving,
    removeAudio,
    setAudio,
    isMultiDrawEnabled,
    setIsMultiDrawEnabled,
    multiDrawRange,
    setMultiDrawRange,
    mounted
  } = useAnimationState();

  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const canvasRef = useRef<SketchCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Export Settings
  const [exportScale, setExportScale] = useState('1');
  const [exportTransparent, setExportTransparent] = useState(false);
  const [exportStartFrame, setExportStartFrame] = useState('1');
  const [exportEndFrame, setExportEndFrame] = useState('1');

  useEffect(() => {
    if (project.frames.length > 0) {
      setExportEndFrame(project.frames.length.toString());
    }
  }, [project.frames.length]);

  const currentFrame = project.frames[currentFrameIndex];
  const activeGroup = project.groups?.find(g => currentFrameIndex >= g.startIndex && currentFrameIndex <= g.endIndex);
  const currentFps = activeGroup ? activeGroup.fps : project.fps;

  const handleLassoAction = (action: 'cut' | 'copy' | 'select' | 'move') => {
    const result = canvasRef.current?.executeLassoAction(action);
    if (result && (action === 'copy' || action === 'move')) {
      setCopiedLayerData({ name: 'Selection', imageData: result });
    }
    if (action === 'move') setTool('move');
  };

  if (!currentFrame && mounted) return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-accent" size={32} />
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col bg-background selection:bg-accent/30 overflow-x-hidden">
      {/* Header - Sticky */}
      <header className="sticky top-0 h-14 flex items-center justify-between px-4 bg-white/80 backdrop-blur-sm border-b border-foreground/10 z-[60] shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold italic tracking-tighter text-primary shrink-0">
            SketchFlow <span className="text-accent">Studio</span>
          </h1>
          
          <div className="flex items-center gap-1 bg-white p-1 sketch-border">
            <button 
              onClick={toggleOnionSkin} 
              className={cn("p-1.5 hover:bg-accent transition-all rounded", project.onionSkinEnabled ? "bg-accent" : "transparent")} 
              title="Toggle Onion Skin"
            >
              <Layers size={14} />
            </button>

            <div className="w-px h-4 bg-foreground/10 mx-1" />

            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-accent transition-all rounded flex items-center gap-1.5">
                  <Briefcase size={14} />
                  <span className="text-[10px] font-bold uppercase hidden md:inline">Project</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sketch-card p-4 space-y-4" side="bottom" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">Workspace</h4>
                    {isAutoSaving && <span className="text-[8px] text-accent animate-pulse font-bold">Autosave on</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => saveProject()} className="flex items-center gap-2 text-[10px] font-bold uppercase p-2 hover:bg-accent/10 rounded border transition-colors"><Save size={12} /> Save</button>
                    <button onClick={createNewProject} className="flex items-center gap-2 text-[10px] font-bold uppercase p-2 hover:bg-accent/10 rounded border transition-colors"><Plus size={12} /> New Project</button>
                    <button onClick={downloadProject} className="flex items-center gap-2 text-[10px] font-bold uppercase p-2 hover:bg-accent/10 rounded border transition-colors"><Download size={12} /> .sketchflow</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[10px] font-bold uppercase p-2 hover:bg-accent/10 rounded border transition-colors"><Upload size={12} /> Open File</button>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Clock3 size={12} /> Recent Projects
                  </h4>
                  <ScrollArea className="h-40">
                    <div className="space-y-2 pr-2">
                      {projectList.length ? projectList.map((p) => (
                        <div key={p.id} className={cn(
                          "p-2 border sketch-border flex items-center justify-between group transition-colors",
                          project.id === p.id ? "bg-accent/5 border-accent" : "bg-slate-50 hover:bg-white"
                        )}>
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => loadProjectById(p.id)}>
                            <p className="text-[10px] font-bold truncate">{p.name}</p>
                            <p className="text-[8px] opacity-40">{mounted ? new Date(p.lastModified).toLocaleString() : '...'}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => deleteProject(p.id)} className="p-1 hover:text-red-500"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      )) : <p className="text-[10px] italic opacity-40 text-center py-4">No recent projects.</p>}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <History size={12} /> Version History
                  </h4>
                  <div className="flex gap-2">
                    <Input placeholder="Label..." value={versionName} onChange={(e) => setVersionName(e.target.value)} className="sketch-border h-8 text-[10px]" />
                    <Button size="sm" onClick={() => { saveVersion(versionName); setVersionName(''); }} className="bg-accent h-8 px-2"><Plus size={14} /></Button>
                  </div>
                  <ScrollArea className="h-32">
                    <div className="space-y-2 pr-2">
                      {project.versions?.length ? [...project.versions].reverse().map((v) => (
                        <div key={v.id} className="p-2 border sketch-border bg-slate-50 flex items-center justify-between group">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold truncate">{v.name}</p>
                            <p className="text-[8px] opacity-40">{mounted ? new Date(v.timestamp).toLocaleTimeString() : '...'}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => loadVersion(v.id)} className="p-1 hover:text-accent"><FileClock size={12} /></button>
                            <button onClick={() => deleteVersion(v.id)} className="p-1 hover:text-red-500"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      )) : <p className="text-[10px] italic opacity-40 text-center py-2">No snapshots.</p>}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-4 bg-foreground/10 mx-1" />

            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-accent transition-all rounded relative">
                  <Music size={14} />
                  {project.audioData && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full border border-white" />}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 sketch-card p-2 space-y-1" side="bottom" align="start">
                 <button onClick={() => audioInputRef.current?.click()} className="w-full text-left px-3 py-2 hover:bg-accent/10 rounded text-[10px] font-bold uppercase flex items-center gap-2"><Upload size={12} /> Import Audio</button>
                 {project.audioData && <button onClick={removeAudio} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-500 rounded text-[10px] font-bold uppercase flex items-center gap-2"><Trash2 size={12} /> Clear</button>}
              </PopoverContent>
            </Popover>

            <div className="w-px h-4 bg-foreground/10 mx-1" />

            <Popover>
              <PopoverTrigger asChild>
                <button disabled={isExporting} className="p-1.5 hover:bg-accent transition-all rounded flex items-center gap-1.5">
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                  <span className="text-[10px] font-bold hidden md:inline uppercase">Export GIF</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 sketch-card p-4 space-y-4" side="bottom" align="start">
                <h4 className="text-[10px] font-bold uppercase tracking-widest border-b pb-2">Export Settings</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase opacity-60">Resolution</Label>
                    <Select value={exportScale} onValueChange={setExportScale}>
                      <SelectTrigger className="sketch-border h-8 text-xs font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="sketch-card">
                        <SelectItem value="0.5">Small (400px)</SelectItem>
                        <SelectItem value="1">Standard (800px)</SelectItem>
                        <SelectItem value="2">HD (1600px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase opacity-60">Frame Range</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={exportStartFrame} onChange={(e) => setExportStartFrame(e.target.value)} className="sketch-border h-8 text-[10px] w-16" min="1" max={project.frames.length} />
                      <span className="text-[10px] opacity-40">to</span>
                      <Input type="number" value={exportEndFrame} onChange={(e) => setExportEndFrame(e.target.value)} className="sketch-border h-8 text-[10px] w-16" min="1" max={project.frames.length} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">Transparency</Label>
                    <Switch checked={exportTransparent} onCheckedChange={setExportTransparent} />
                  </div>
                  <Button onClick={() => exportToGif({ scale: parseFloat(exportScale), transparent: exportTransparent, startFrame: parseInt(exportStartFrame) - 1, endFrame: parseInt(exportEndFrame) - 1 })} disabled={isExporting} className="w-full bg-accent hover:bg-accent/90 text-primary font-bold uppercase text-[10px] sketch-border h-9">
                    {isExporting ? <Loader2 className="animate-spin mr-2" /> : <Download size={14} className="mr-2" />}
                    Generate GIF
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 sketch-border">
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-accent transition-all rounded flex items-center gap-2">
                  <Paintbrush size={14} />
                  <span className="text-[10px] font-bold w-6 hidden md:inline">{brushSize}px</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 sketch-card p-4 space-y-4" side="bottom" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">Active Brush</h4>
                    <div className="w-6 h-6 sketch-border relative" style={{ backgroundColor: color }}>
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between"><Label className="text-[10px] font-bold uppercase">Size</Label><span className="text-[10px] font-mono">{brushSize}px</span></div>
                      <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1 accent-accent cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between"><Label className="text-[10px] font-bold uppercase">Opacity</Label><span className="text-[10px] font-mono">{opacity}%</span></div>
                      <input type="range" min="1" max="100" value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))} className="w-full h-1 accent-accent cursor-pointer" />
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-3">
                    <h5 className="text-[10px] font-bold uppercase opacity-40">Brush Dynamics</h5>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Palette size={12}/><Label className="text-xs">Color Link</Label></div>
                      <Switch checked={customBrushColorLink} onCheckedChange={setCustomBrushColorLink} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Stamp size={12}/><Label className="text-xs">Dynamic Stamping</Label></div>
                      <Switch checked={dynamicStampingEnabled} onCheckedChange={setDynamicStampingEnabled} />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-accent transition-all rounded"><Settings size={14} /></button>
              </PopoverTrigger>
              <PopoverContent className="w-72 sketch-card p-4 space-y-4" side="bottom" align="start">
                <h4 className="text-[10px] font-bold uppercase tracking-widest border-b pb-2">Editor Preferences</h4>
                <div className="space-y-4">
                  <div className="pb-2 border-b">
                    <CustomBrushDialog onSave={saveSavedBrush} currentBrush={customBrushData} layers={currentFrame?.layers || []} width={project.width} height={project.height} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Auto-save</Label>
                      <Switch checked={project.autoSaveEnabled} onCheckedChange={(checked) => setProject(p => ({ ...p, autoSaveEnabled: checked }))} />
                    </div>
                    <div className="flex items-center justify-between"><Label className="text-xs">Pressure Sensitivity</Label><Switch checked={pressureEnabled} onCheckedChange={setPressureEnabled} /></div>
                    <div className="flex items-center justify-between"><Label className="text-xs">Stroke Stabilizer</Label><Switch checked={stabilizationEnabled} onCheckedChange={setStabilizationEnabled} /></div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Scrub with Sound</Label>
                      <Switch checked={project.scrubWithSound} onCheckedChange={(checked) => setProject(p => ({ ...p, scrubWithSound: checked }))} />
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t space-y-3">
                    <h5 className="text-[10px] font-bold uppercase opacity-40">Snapping Controls</h5>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Grid size={12}/><Label className="text-xs">Grid Snap</Label></div>
                      <Switch checked={project.snapToGrid} onCheckedChange={(checked) => setProject(p => ({ ...p, snapToGrid: checked }))} />
                    </div>
                    {project.snapToGrid && (
                      <div className="space-y-1 px-1">
                        <div className="flex justify-between"><Label className="text-[9px] uppercase font-bold">Grid Interval</Label><span className="text-[9px] font-mono">{project.gridSize}px</span></div>
                        <Slider value={[project.gridSize || 20]} min={5} max={100} step={5} onValueChange={([val]) => setProject(p => ({ ...p, gridSize: val }))} />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Magnet size={12}/><Label className="text-xs">Perfect Shapes (Axis)</Label></div>
                      <Switch checked={project.snapToAngle} onCheckedChange={(checked) => setProject(p => ({ ...p, snapToAngle: checked }))} />
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-3">
                    <h5 className="text-[10px] font-bold uppercase opacity-40">Onion Skin Settings</h5>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Eye size={12}/><Label className="text-xs">Advanced View</Label></div>
                      <Switch checked={project.advancedOnionSkinEnabled} onCheckedChange={(checked) => setProject(p => ({ ...p, advancedOnionSkinEnabled: checked }))} />
                    </div>
                    {project.advancedOnionSkinEnabled && (
                      <div className="space-y-3 px-1">
                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-[9px] uppercase font-bold">Frames Before</Label><span className="text-[9px] font-mono">{project.onionSkinBefore}</span></div>
                          <Slider value={[project.onionSkinBefore || 1]} min={1} max={5} step={1} onValueChange={([val]) => setProject(p => ({ ...p, onionSkinBefore: val }))} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-[9px] uppercase font-bold">Frames After</Label><span className="text-[9px] font-mono">{project.onionSkinAfter}</span></div>
                          <Slider value={[project.onionSkinAfter || 1]} min={1} max={5} step={1} onValueChange={([val]) => setProject(p => ({ ...p, onionSkinAfter: val }))} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <PlaybackControls 
          isPlaying={isPlaying} togglePlayback={togglePlayback} loopSelection={loopSelection} setLoopSelection={setLoopSelection}
          fps={currentFps} setFps={(f) => setProject(p => ({ ...p, fps: f }))} onPrev={() => selectFrame(Math.max(0, currentFrameIndex - 1))} onNext={() => selectFrame(Math.min(project.frames.length - 1, currentFrameIndex + 1))}
          activeGroup={activeGroup} hasSelection={selectedFrameIndices.length > 1}
        />
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 relative min-h-0">
        <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-16 flex-none bg-background border-r border-foreground/5 flex flex-col items-center py-4 z-20 overflow-y-auto scrollbar-none">
          <Toolbar 
            currentTool={tool} lastBrushTool={lastBrushTool} lastShapeTool={lastShapeTool} setTool={setTool} 
            moveMode={moveMode} setMoveMode={setMoveMode} undo={undo} redo={redo} flip={() => {}} 
            canUndo={canUndo} canRedo={canRedo} color={color} onOpenLayers={() => setIsLayersOpen(true)} 
            isMultiDrawEnabled={isMultiDrawEnabled} setIsMultiDrawEnabled={setIsMultiDrawEnabled}
            savedBrushes={project.savedBrushes} 
            brushPacks={project.brushPacks}
            customBrushData={customBrushData} setCustomBrushData={setCustomBrushData} deleteSavedBrush={deleteSavedBrush}
            createBrushPack={createBrushPack}
            addBrushToPack={addBrushToPack}
            removeBrushFromPack={removeBrushFromPack}
            deleteBrushPack={deleteBrushPack}
            exportBrush={exportBrush}
            exportBrushPack={exportBrushPack}
            importBrushPack={importBrushPack}
          />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas Area */}
          <div className="flex items-center justify-center p-8 bg-slate-100/30 flex-1 min-h-[500px]">
             <div className="w-full max-w-[800px] flex flex-col gap-4">
               <div className="flex items-center justify-between">
                 {tool === 'lasso' ? (
                   <div className="flex items-center gap-2 bg-white p-2 sketch-border z-30 shadow-md">
                      <button onClick={() => handleLassoAction('cut')} className="flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-50 hover:bg-red-50 px-2 py-1 rounded border transition-colors"><Scissors size={12} /> Cut</button>
                      <button onClick={() => handleLassoAction('copy')} className="flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded border transition-colors"><Copy size={12} /> Copy</button>
                      <button onClick={() => handleLassoAction('move')} className="flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-50 hover:bg-orange-50 px-2 py-1 rounded border transition-colors"><Move size={12} /> Move</button>
                   </div>
                 ) : <div />}

                 {isMultiDrawEnabled && (
                   <div className="flex items-center gap-3 bg-white px-3 py-2 sketch-border shadow-sm animate-in slide-in-from-right duration-200">
                     <div className="flex items-center gap-1.5">
                       <Zap size={14} className="text-accent animate-pulse" />
                       <span className="text-[10px] font-bold uppercase tracking-wider">Multi-Draw Sync</span>
                     </div>
                     <div className="w-px h-4 bg-foreground/10" />
                     <div className="flex items-center gap-3">
                       <span className="text-[9px] font-bold uppercase opacity-50">Range: {multiDrawRange}</span>
                       <Slider value={[multiDrawRange]} min={1} max={24} step={1} onValueChange={([val]) => setMultiDrawRange(val)} className="w-24" />
                     </div>
                   </div>
                 )}
               </div>
               
               {currentFrame && (
                 <div className="w-full aspect-video shadow-2xl bg-white sketch-border overflow-hidden ring-4 ring-white/50 relative shrink-0">
                    <SketchCanvas 
                      ref={canvasRef} width={project.width} height={project.height} frames={project.frames} currentFrameIndex={currentFrameIndex} 
                      activeLayerId={activeLayerId} onionSkinEnabled={project.onionSkinEnabled} 
                      advancedOnionSkinEnabled={project.advancedOnionSkinEnabled}
                      onionSkinBefore={project.onionSkinBefore} onionSkinAfter={project.onionSkinAfter}
                      tool={tool} moveMode={moveMode} 
                      color={color} brushSize={brushSize} opacity={opacity} hardness={80} onLayerUpdate={updateLayerData} 
                      isPlaying={isPlaying} pressureEnabled={pressureEnabled} stabilizationEnabled={stabilizationEnabled} 
                      snapToGrid={project.snapToGrid} gridSize={project.gridSize} snapToAngle={project.snapToAngle}
                      customBrushData={customBrushData} customBrushColorLink={customBrushColorLink} dynamicStampingEnabled={dynamicStampingEnabled}
                    />
                 </div>
               )}
             </div>
          </div>

          {/* Controls Area (Timeline/Audio) */}
          <div className="bg-white border-t border-foreground/5 p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10">
            <div className="w-full max-w-[800px] mx-auto space-y-6">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2 sketch-border">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-accent" />
                  <span className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Exposure</span>
                </div>
                <div className="flex items-center gap-4">
                  <input type="range" min="1" max="24" value={currentFrame?.duration || 1} onChange={(e) => updateFrameDuration(currentFrameIndex, parseInt(e.target.value))} className="w-48 h-1 accent-accent cursor-pointer" />
                  <span className="text-[10px] font-mono font-bold w-16 text-center bg-accent/10 px-2 py-1 rounded">{currentFrame?.duration || 1} Beats</span>
                </div>
              </div>
              
              <Timeline frames={project.frames} currentFrameIndex={currentFrameIndex} selectedFrameIndices={selectedFrameIndices} onSelectFrame={selectFrame} addFrame={addFrame} deleteFrame={deleteFrame} duplicateFrame={duplicateFrame} reorderFrames={reorderFrames} />
              
              <AudioTimeline 
                audioData={project.audioData} metadata={project.audioMetadata} isPlaying={isPlaying} currentFrameIndex={currentFrameIndex} 
                totalFrames={project.frames.length} frames={project.frames} fps={project.fps} onRecord={(blob) => setAudio(blob, 'Recording')} onRemove={removeAudio}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-8 flex items-center justify-between w-full px-4 text-[10px] uppercase font-bold bg-white border-t border-foreground/5 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <span className="opacity-40">Project ID: {mounted ? project.id : '...'}</span>
          {isAutoSaving && <div className="flex items-center gap-1.5 text-accent animate-pulse"><Save size={10} /><span>Draft Backup Active</span></div>}
        </div>
        <div className="flex items-center gap-4 opacity-40">
           <span>{project.frames.length} Frames</span>
           <span>{project.fps} FPS</span>
        </div>
      </footer>

      <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProject(f); }} accept=".sketchflow,.json" className="hidden" />
      <input type="file" ref={audioInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) setAudio(f, f.name); }} accept="audio/*" className="hidden" />
      {isLayersOpen && currentFrame && <LayersPanel layers={currentFrame.layers || []} activeLayerId={activeLayerId} onSetActive={setActiveLayerId} onAdd={addLayer} onCopy={copyLayer} onPaste={pasteLayer} hasCopiedLayer={hasCopiedLayer} onDelete={deleteLayer} onReorder={reorderLayers} onToggleVisibility={() => {}} onToggleLock={() => {}} onOpacityChange={() => {}} onBlendModeChange={() => {}} onClose={() => setIsLayersOpen(false)} />}
    </main>
  );
}
