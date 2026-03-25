"use client"

import React from 'react';
import { useAnimationState } from '@/hooks/use-animation-state';
import { SketchCanvas } from '@/components/editor/SketchCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { Timeline } from '@/components/editor/Timeline';
import { PlaybackControls } from '@/components/editor/PlaybackControls';
import { CustomBrushDialog } from '@/components/editor/CustomBrushDialog';
import { Save, FolderOpen, Layers, Settings2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Home() {
  const {
    project,
    currentFrameIndex,
    setCurrentFrameIndex,
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
    customBrushData,
    setCustomBrushData,
    addFrame,
    deleteFrame,
    duplicateFrame,
    updateFrameData,
    togglePlayback,
    toggleOnionSkin,
    saveProject,
    loadProject,
    setProject,
    undo,
    redo,
    flipCurrentFrame,
    canUndo,
    canRedo
  } = useAnimationState();

  const currentFrame = project.frames[currentFrameIndex];
  const prevFrame = currentFrameIndex > 0 ? project.frames[currentFrameIndex - 1] : undefined;
  const nextFrame = currentFrameIndex < project.frames.length - 1 ? project.frames[currentFrameIndex + 1] : undefined;

  return (
    <main className="min-h-screen flex flex-col items-center bg-background overflow-x-hidden">
      <div className="w-full flex items-center justify-between max-w-7xl h-auto md:h-14 p-2 md:px-4 bg-white/30 backdrop-blur-sm border-b border-foreground/10 sticky top-0 z-50">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <h1 className="text-base md:text-lg font-bold italic tracking-tighter text-primary">
            SketchFlow <span className="text-accent">Studio</span>
          </h1>
          
          <div className="flex items-center gap-1 bg-white p-1 sketch-border">
            <button 
              onClick={toggleOnionSkin}
              className={cn(
                "p-1.5 hover:bg-accent transition-all rounded",
                project.onionSkinEnabled ? "bg-accent" : "transparent"
              )}
              title="Onion Skinning"
            >
              <Layers size={14} className="md:w-4 md:h-4" />
            </button>
            <button 
              onClick={saveProject}
              className="p-1.5 hover:bg-accent transition-all rounded"
              title="Save Project"
            >
              <Save size={14} className="md:w-4 md:h-4" />
            </button>
            <button 
              onClick={loadProject}
              className="p-1.5 hover:bg-accent transition-all rounded"
              title="Load Project"
            >
              <FolderOpen size={14} className="md:w-4 md:h-4" />
            </button>
          </div>

          <div className="hidden md:block h-6 w-px bg-foreground/10 mx-1" />

          <div className="flex items-center gap-2 md:gap-3 bg-white px-2 py-1 sketch-border">
            <div className="flex items-center">
              <div 
                className="w-5 h-5 sketch-border cursor-pointer overflow-hidden relative"
                style={{ backgroundColor: color }}
              >
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
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
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full h-1 accent-accent cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-tighter">Opacity</label>
                    <span className="text-[10px] font-mono">{opacity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={opacity} 
                    onChange={(e) => setOpacity(parseInt(e.target.value))}
                    className="w-full h-1 accent-accent cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-tighter">Hardness</label>
                    <span className="text-[10px] font-mono">{hardness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={hardness} 
                    onChange={(e) => setHardness(parseInt(e.target.value))}
                    className="w-full h-1 accent-accent cursor-pointer"
                  />
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 hover:bg-accent/10 rounded transition-colors">
                  <Settings size={14} className="opacity-70" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 sketch-card p-4 space-y-4" side="bottom" align="end">
                <h4 className="text-[10px] font-bold uppercase tracking-widest border-b pb-2 mb-2">Input Settings</h4>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="pressure-mode" className="text-xs">Pressure Sensitivity</Label>
                  <Switch 
                    id="pressure-mode" 
                    checked={pressureEnabled} 
                    onCheckedChange={setPressureEnabled} 
                  />
                </div>
                <p className="text-[9px] opacity-60 leading-tight">Vary brush thickness based on stylus pressure.</p>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="stabilization-mode" className="text-xs">Line Stabilization</Label>
                  <Switch 
                    id="stabilization-mode" 
                    checked={stabilizationEnabled} 
                    onCheckedChange={setStabilizationEnabled} 
                  />
                </div>
                <p className="text-[9px] opacity-60 leading-tight">Smooths out shaky hand-drawn lines.</p>

                <div className="pt-2 border-t mt-2">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3">Custom Brush</h4>
                   <CustomBrushDialog onSave={setCustomBrushData} currentBrush={customBrushData} />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex items-center">
          <PlaybackControls 
            isPlaying={isPlaying}
            togglePlayback={togglePlayback}
            fps={project.fps}
            setFps={(fps) => setProject(p => ({ ...p, fps }))}
            onPrev={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
            onNext={() => setCurrentFrameIndex(Math.min(project.frames.length - 1, currentFrameIndex + 1))}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 w-full max-w-7xl items-center md:items-start py-4 md:py-6">
        <div className="w-full md:w-auto px-4 mb-4 md:mb-0 md:flex-none md:sticky md:top-20 z-40">
          <Toolbar 
            currentTool={tool}
            setTool={setTool}
            undo={undo}
            redo={redo}
            flip={flipCurrentFrame}
            canUndo={canUndo}
            canRedo={canRedo}
            color={color}
          />
        </div>

        <div className="flex-1 flex flex-col items-center px-4 gap-4 md:gap-6 pb-20 w-full overflow-hidden">
          <div className="w-full max-w-full flex justify-center">
            <div className="shadow-xl bg-white sketch-border overflow-hidden w-full max-w-[800px]">
              <SketchCanvas 
                width={project.width}
                height={project.height}
                currentFrame={currentFrame}
                prevFrame={prevFrame}
                nextFrame={nextFrame}
                onionSkinEnabled={project.onionSkinEnabled}
                tool={tool}
                color={color}
                brushSize={brushSize}
                opacity={opacity}
                hardness={hardness}
                onFrameUpdate={updateFrameData}
                isPlaying={isPlaying}
                pressureEnabled={pressureEnabled}
                stabilizationEnabled={stabilizationEnabled}
                customBrushData={customBrushData}
              />
            </div>
          </div>
          
          <div className="w-full max-w-[800px] flex-none">
            <Timeline 
              frames={project.frames}
              currentFrameIndex={currentFrameIndex}
              setCurrentFrameIndex={setCurrentFrameIndex}
              addFrame={addFrame}
              deleteFrame={deleteFrame}
              duplicateFrame={duplicateFrame}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto h-8 flex items-center justify-center w-full text-[8px] md:text-[10px] opacity-40 uppercase font-bold bg-white/50 border-t border-foreground/5 shrink-0">
        Tip: Select "Custom Brush" in the sidebar to use your imported or drawn tip.
      </div>
    </main>
  );
}
