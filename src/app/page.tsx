
"use client"

import React from 'react';
import { useAnimationState } from '@/hooks/use-animation-state';
import { SketchCanvas } from '@/components/editor/SketchCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { Timeline } from '@/components/editor/Timeline';
import { PlaybackControls } from '@/components/editor/PlaybackControls';
import { Save, FolderOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    canUndo,
    canRedo
  } = useAnimationState();

  const currentFrame = project.frames[currentFrameIndex];
  const prevFrame = currentFrameIndex > 0 ? project.frames[currentFrameIndex - 1] : undefined;
  const nextFrame = currentFrameIndex < project.frames.length - 1 ? project.frames[currentFrameIndex + 1] : undefined;

  return (
    <main className="min-h-screen flex flex-col items-center bg-background overflow-y-auto">
      {/* Header Area - Compacted and holds more controls */}
      <div className="w-full flex items-center justify-between max-w-7xl h-14 px-4 bg-white/30 backdrop-blur-sm border-b border-foreground/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold italic tracking-tighter text-primary">
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
              <Layers size={16} />
            </button>
            <button 
              onClick={saveProject}
              className="p-1.5 hover:bg-accent transition-all rounded"
              title="Save Project"
            >
              <Save size={16} />
            </button>
            <button 
              onClick={loadProject}
              className="p-1.5 hover:bg-accent transition-all rounded"
              title="Load Project"
            >
              <FolderOpen size={16} />
            </button>
          </div>

          <div className="h-6 w-px bg-foreground/10 mx-1" />

          {/* Color & Size in header to save sidebar space */}
          <div className="flex items-center gap-3 bg-white px-2 py-1 sketch-border">
            <div className="flex items-center gap-1.5">
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
            <div className="flex items-center gap-2">
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-20 h-1 accent-accent cursor-pointer"
              />
              <span className="text-[10px] font-bold w-6">{brushSize}px</span>
            </div>
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

      {/* Workspace Area */}
      <div className="flex flex-1 w-full max-w-7xl items-start py-6">
        {/* Sidebar - Tools Only */}
        <div className="px-4 flex-none sticky top-20">
          <Toolbar 
            currentTool={tool}
            setTool={setTool}
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>

        {/* Drawing & Timeline Area */}
        <div className="flex-1 flex flex-col items-center px-4 gap-6 pb-20">
          <div className="flex-none shadow-xl bg-white sketch-border overflow-hidden">
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
              onFrameUpdate={updateFrameData}
              isPlaying={isPlaying}
            />
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

      {/* Footer Info */}
      <div className="mt-auto h-8 flex items-center justify-center w-full text-[10px] opacity-40 uppercase font-bold bg-white/50 border-t border-foreground/5 shrink-0">
        Tip: Press 'S' to save, 'L' to load projects locally.
      </div>
    </main>
  );
}
