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
    <main className="h-screen flex flex-col items-center p-2 md:p-4 bg-background">
      {/* Header Area - Compacted */}
      <div className="w-full flex items-center justify-between max-w-6xl mb-2 px-2">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold italic tracking-tighter text-primary">
              SketchFlow <span className="text-accent">Studio</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-1 bg-white/50 p-1 sketch-border">
            <button 
              onClick={toggleOnionSkin}
              className={cn(
                "p-1.5 hover:bg-accent transition-all rounded",
                project.onionSkinEnabled ? "bg-accent" : "transparent"
              )}
              title="Onion Skinning"
            >
              <Layers size={18} />
            </button>
            <div className="w-px h-6 bg-foreground/20 mx-1" />
            <button 
              onClick={saveProject}
              className="p-1.5 hover:bg-accent transition-all rounded"
              title="Save Project"
            >
              <Save size={18} />
            </button>
            <button 
              onClick={loadProject}
              className="p-1.5 hover:bg-accent transition-all rounded"
              title="Load Project"
            >
              <FolderOpen size={18} />
            </button>
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
      <div className="flex flex-1 w-full max-w-6xl items-start gap-4 relative overflow-hidden">
        <div className="pt-2">
          <Toolbar 
            currentTool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>

        <div className="flex-1 flex flex-col items-center h-full overflow-hidden">
          <div className="flex-none">
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
          
          <div className="w-full mt-2 flex-1 min-h-0">
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
      <div className="mt-1 text-[10px] opacity-40 uppercase font-bold text-center">
        Tip: Press 'S' to save, 'L' to load projects locally.
      </div>
    </main>
  );
}
