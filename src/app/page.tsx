
"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useAnimationState } from '@/hooks/use-animation-state';
import { SketchCanvas, SketchCanvasHandle } from '@/components/editor/SketchCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { Timeline } from '@/components/editor/Timeline';
import { AudioTimeline } from '@/components/editor/AudioTimeline';
import { CustomBrushDialog } from '@/components/editor/CustomBrushDialog';
import { 
  Settings, 
  Music, 
  ChevronLeft, 
  Save, 
  Plus, 
  Download, 
  Upload, 
  Video, 
  Trash2, 
  History,
  Paintbrush,
  Briefcase,
  Loader2,
  Zap,
  RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';

type AppView = 'home' | 'settings' | 'audio';

export default function Home() {
  const {
    project, projectList, loadProjectById, deleteProject, createNewProject,
    currentFrameIndex, selectedFrameIndices, selectFrame,
    activeLayerId, setActiveLayerId, isPlaying, tool, lastBrushTool, lastShapeTool, setTool, moveMode, setMoveMode,
    color, setColor, brushSize, setBrushSize, opacity, setOpacity,
    pressureEnabled, setPressureEnabled, stabilizationEnabled, setStabilizationEnabled,
    dynamicStampingEnabled, setDynamicStampingEnabled,
    customBrushColorLink, setCustomBrushColorLink,
    customBrushData, setCustomBrushData, saveSavedBrush, deleteSavedBrush,
    addFrame, deleteFrame, duplicateFrame, reorderFrames,
    updateLayerData, updateFrameDuration, addLayer, copyLayer, pasteLayer, hasCopiedLayer, deleteLayer, reorderLayers,
    togglePlayback, toggleOnionSkin, saveProject, downloadProject, uploadProject, exportToGif, isExporting, setProject,
    undo, redo, canUndo, canRedo, setCopiedLayerData,
    saveVersion, loadVersion, deleteVersion, isAutoSaving, removeAudio, setAudio,
    isMultiDrawEnabled, setIsMultiDrawEnabled, multiDrawRange, setMultiDrawRange, mounted,
    createBrushPack, addBrushToPack, removeBrushFromPack, deleteBrushPack, exportBrush, exportBrushPack, importBrushPack
  } = useAnimationState();

  const [currentView, setCurrentView] = useState<AppView>('home');
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
    if (project.frames.length > 0) setExportEndFrame(project.frames.length.toString());
  }, [project.frames.length]);

  if (!mounted) return <div className="h-screen w-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" size={48} /></div>;

  const currentFrame = project.frames[currentFrameIndex];

  const renderHome = () => (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      {/* Home Header - Ultra Compact */}
      <header className="h-12 flex items-center justify-between px-4 bg-background border-b border-white/5 z-50 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-8 h-8 studio-panel border-white/20 flex items-center justify-center p-0.5 relative" style={{ backgroundColor: color }}>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div className="flex items-center gap-3 w-40 md:w-64">
             <span className="text-[9px] font-mono opacity-40 text-white">{brushSize}px</span>
             <Slider value={[brushSize]} min={1} max={100} step={1} onValueChange={([val]) => setBrushSize(val)} className="flex-1" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentView('audio')} className="studio-icon-btn relative">
            <Music size={18} />
            {project.audioData && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" />}
          </button>
          <button onClick={() => setCurrentView('settings')} className="studio-icon-btn">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Drawing Area - Horizontal Flex */}
      <div className="flex-1 flex overflow-hidden bg-background">
        <aside className="w-12 bg-background border-r border-white/5 flex flex-col items-center py-2 shrink-0">
          <Toolbar 
            currentTool={tool} lastBrushTool={lastBrushTool} lastShapeTool={lastShapeTool} setTool={setTool} 
            moveMode={moveMode} setMoveMode={setMoveMode} undo={undo} redo={redo} 
            canUndo={canUndo} canRedo={canRedo} color={color} 
            savedBrushes={project.savedBrushes} 
            customBrushData={customBrushData} setCustomBrushData={setCustomBrushData} deleteSavedBrush={deleteSavedBrush}
            isMultiDrawEnabled={isMultiDrawEnabled} setIsMultiDrawEnabled={setIsMultiDrawEnabled}
          />
        </aside>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-[90vh] aspect-video studio-panel bg-white/5 relative">
             <SketchCanvas 
                ref={canvasRef} width={project.width} height={project.height} frames={project.frames} currentFrameIndex={currentFrameIndex} 
                activeLayerId={activeLayerId} onionSkinEnabled={project.onionSkinEnabled} 
                advancedOnionSkinEnabled={project.advancedOnionSkinEnabled}
                onionSkinBefore={project.onionSkinBefore} onionSkinAfter={project.onionSkinAfter}
                tool={tool} moveMode={moveMode} color={color} brushSize={brushSize} opacity={opacity} hardness={80} 
                onLayerUpdate={updateLayerData} isPlaying={isPlaying} pressureEnabled={pressureEnabled} 
                stabilizationEnabled={stabilizationEnabled} snapToGrid={project.snapToGrid} gridSize={project.gridSize} 
                snapToAngle={project.snapToAngle} customBrushData={customBrushData} customBrushColorLink={customBrushColorLink} 
                dynamicStampingEnabled={dynamicStampingEnabled}
              />
          </div>
        </div>
      </div>

      {/* Bottom Dock - Increased height for larger professional timeline */}
      <div className="h-44 bg-background border-t border-white/5 p-2 shrink-0">
        <Timeline frames={project.frames} currentFrameIndex={currentFrameIndex} selectedFrameIndices={selectedFrameIndices} onSelectFrame={selectFrame} addFrame={addFrame} deleteFrame={deleteFrame} duplicateFrame={duplicateFrame} reorderFrames={reorderFrames} />
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex-1 studio-screen animate-in slide-in-from-right duration-500 overflow-y-auto bg-background">
      <header className="h-14 flex items-center justify-between px-6 bg-background border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentView('home')} className="studio-icon-btn"><ChevronLeft size={24} /></button>
          <h2 className="font-bold uppercase tracking-widest text-sm text-white/50">Studio Settings</h2>
        </div>
        <div className="flex items-center gap-2">
           {isAutoSaving && <span className="text-[8px] font-bold text-white/30 uppercase animate-pulse">Auto-Sync...</span>}
           <button onClick={() => saveProject()} className="studio-button border-white/20"><Save size={14} /> Commit</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
              <Briefcase size={16} /> Library
            </h3>
            <div className="studio-panel border-white/5 p-4 space-y-4">
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={createNewProject} className="studio-button"><Plus size={14} /> New</button>
                 <button onClick={downloadProject} className="studio-button"><Download size={14} /> Export</button>
                 <button onClick={() => fileInputRef.current?.click()} className="studio-button"><Upload size={14} /> Import</button>
                 <button onClick={() => saveVersion(versionName || `Snap ${new Date().toLocaleTimeString()}`)} className="studio-button"><History size={14} /> Snapshot</button>
               </div>
               <ScrollArea className="h-48 border-t border-white/5 pt-4">
                 <div className="space-y-2">
                   {projectList.map(p => (
                     <div key={p.id} className={cn("p-2 rounded border border-white/5 flex items-center justify-between group", p.id === project.id ? "bg-white/10 border-white/40" : "bg-white/5")}>
                       <div className="cursor-pointer flex-1" onClick={() => loadProjectById(p.id)}>
                         <p className="text-[10px] font-bold uppercase">{p.name}</p>
                         <p className="text-[8px] opacity-20">{new Date(p.lastModified).toLocaleString()}</p>
                       </div>
                       <button onClick={() => deleteProject(p.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500"><Trash2 size={12} /></button>
                     </div>
                   ))}
                 </div>
               </ScrollArea>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
              <Video size={16} /> Render GIF
            </h3>
            <div className="studio-panel border-white/5 p-4 space-y-4">
               <div className="space-y-3">
                 <div className="flex items-center justify-between"><Label className="text-[10px] uppercase opacity-40">Scale</Label>
                   <Select value={exportScale} onValueChange={setExportScale}>
                     <SelectTrigger className="w-24 h-8 bg-white/5 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                     <SelectContent className="bg-background border-white/10"><SelectItem value="0.5">0.5x</SelectItem><SelectItem value="1">1.0x</SelectItem><SelectItem value="2">2.0x</SelectItem></SelectContent>
                   </Select>
                 </div>
                 <div className="flex items-center justify-between"><Label className="text-[10px] uppercase opacity-40">Alpha</Label><Switch checked={exportTransparent} onCheckedChange={setExportTransparent} /></div>
                 <Button onClick={() => exportToGif({ scale: parseFloat(exportScale), transparent: exportTransparent, startFrame: parseInt(exportStartFrame)-1, endFrame: parseInt(exportEndFrame)-1 })} className="w-full bg-white text-black font-bold h-10 hover:bg-white/90">
                   {isExporting ? <Loader2 className="animate-spin mr-2" /> : <Download size={14} className="mr-2" />} GENERATE GIF
                 </Button>
               </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
              <Zap size={16} /> Preferences
            </h3>
            <div className="studio-panel border-white/5 p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><Label className="text-[10px] uppercase font-bold opacity-60">Stabilizer</Label><Switch checked={stabilizationEnabled} onCheckedChange={setStabilizationEnabled} /></div>
                  <div className="flex items-center justify-between"><Label className="text-[10px] uppercase font-bold opacity-60">Pressure</Label><Switch checked={pressureEnabled} onCheckedChange={setPressureEnabled} /></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><Label className="text-[10px] uppercase font-bold opacity-60">Grid Snap</Label><Switch checked={project.snapToGrid} onCheckedChange={(c) => setProject(p => ({...p, snapToGrid: c}))} /></div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase opacity-40">Onion Skinning</Label>
                  <Switch checked={project.onionSkinEnabled} onCheckedChange={toggleOnionSkin} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><span className="text-[8px] uppercase opacity-40">Before: {project.onionSkinBefore}</span><Slider value={[project.onionSkinBefore || 1]} min={1} max={5} onValueChange={([v]) => setProject(p => ({...p, onionSkinBefore: v}))} /></div>
                  <div className="space-y-1"><span className="text-[8px] uppercase opacity-40">After: {project.onionSkinAfter}</span><Slider value={[project.onionSkinAfter || 1]} min={1} max={5} onValueChange={([v]) => setProject(p => ({...p, onionSkinAfter: v}))} /></div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
              <Paintbrush size={16} /> Brush Lab
            </h3>
            <div className="studio-panel border-white/5 p-4 space-y-4">
               <CustomBrushDialog onSave={saveSavedBrush} currentBrush={customBrushData} layers={currentFrame?.layers || []} width={project.width} height={project.height} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const renderAudio = () => (
    <div className="flex-1 studio-screen animate-in slide-in-from-top duration-500 bg-background">
       <header className="h-14 flex items-center justify-between px-6 bg-background border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentView('home')} className="studio-icon-btn"><ChevronLeft size={24} /></button>
          <h2 className="font-bold uppercase tracking-widest text-sm text-white/50">Audio Sync</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => audioInputRef.current?.click()} className="studio-button border-white/20"><Upload size={14} /> Import MP3</button>
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="studio-panel border-white/5 p-6 flex flex-col gap-6">
          <AudioTimeline 
            audioData={project.audioData} metadata={project.audioMetadata} isPlaying={isPlaying} currentFrameIndex={currentFrameIndex} 
            totalFrames={project.frames.length} frames={project.frames} fps={project.fps} onRecord={(blob) => setAudio(blob, 'Mic Recording')} onRemove={removeAudio}
          />
          <div className="space-y-2 mt-4">
             <div className="flex items-center justify-between"><h4 className="text-[10px] font-bold uppercase opacity-20">Timeline Reference</h4></div>
             {/* Timeline Ref is also larger now */}
             <div className="h-44">
               <Timeline frames={project.frames} currentFrameIndex={currentFrameIndex} selectedFrameIndices={selectedFrameIndices} onSelectFrame={selectFrame} addFrame={addFrame} deleteFrame={deleteFrame} duplicateFrame={duplicateFrame} reorderFrames={reorderFrames} />
             </div>
          </div>
        </div>

        <section className="studio-panel border-white/5 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/20">Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/5">
              <p className="text-[10px] font-bold uppercase opacity-60">Scrub Audio</p>
              <Switch checked={project.scrubWithSound} onCheckedChange={(c) => setProject(p => ({...p, scrubWithSound: c}))} />
            </div>
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/5">
              <p className="text-[10px] font-bold uppercase opacity-60">FPS: {project.fps}</p>
              <Slider value={[project.fps]} min={1} max={60} onValueChange={([v]) => setProject(p => ({...p, fps: v}))} className="w-32" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <main className="studio-screen h-screen">
      <div className="portrait-warning">
        <RotateCw size={48} className="text-white/20 mb-4 animate-spin-slow" />
        <h2 className="text-xl font-bold uppercase tracking-widest mb-2 text-white/80">Landscape Only</h2>
        <p className="opacity-40 text-sm">Rotate your device for the best animation experience.</p>
      </div>

      {currentView === 'home' && renderHome()}
      {currentView === 'settings' && renderSettings()}
      {currentView === 'audio' && renderAudio()}

      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProject(f); }} accept=".sketchflow,.json" className="hidden" />
      <input type="file" ref={audioInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) setAudio(f, f.name); }} accept="audio/*" className="hidden" />
      
      <footer className="h-6 bg-background border-t border-white/5 flex items-center justify-between px-4 fixed bottom-0 left-0 right-0 z-[60]">
        <div className="flex items-center gap-4 text-[8px] font-bold uppercase opacity-40">
           <span>{project.name}</span>
           <span>ID: {project.id.slice(0, 8)}</span>
        </div>
        <div className="text-[8px] font-bold uppercase opacity-40">
           {project.frames.length} F @ {project.fps} FPS
        </div>
      </footer>
    </main>
  );
}
