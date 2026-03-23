"use client"

import React from 'react';
import { useAnimationState } from '@/hooks/use-animation-state';
import { SketchCanvas } from '@/components/editor/SketchCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { Timeline } from '@/components/editor/Timeline';
import { PlaybackControls } from '@/components/editor/PlaybackControls';

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
    setProject
  } = useAnimationState();

  const currentFrame = project.frames[currentFrameIndex];
  const prevFrame = currentFrameIndex > 0 ? project.frames[currentFrameIndex - 1] : undefined;
  const nextFrame = currentFrameIndex < project.frames.length - 1 ? project.frames[currentFrameIndex + 1] : undefined;

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8">
      {/* Header Area */}
      <div className="w-full flex items-center justify-between max-w-6xl mb-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold italic tracking-tighter text-primary">
            SketchFlow <span className="text-accent">Studio</span>
          </h1>
          <p className="text-xs opacity-50 uppercase tracking-widest font-bold">2D Animation Workshop</p>
        </div>
        
        <div className="hidden md:block">
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
      <div className="flex flex-1 w-full max-w-6xl items-start gap-4 mb-4 relative">
        <Toolbar 
          currentTool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onSave={saveProject}
          onLoad={loadProject}
          onionSkinEnabled={project.onionSkinEnabled}
          toggleOnionSkin={toggleOnionSkin}
        />

        <div className="flex-1 flex flex-col items-center justify-center h-full">
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
          
          <div className="mt-4 md:hidden w-full">
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
      </div>

      {/* Footer / Timeline Area */}
      <div className="w-full max-w-6xl">
        <Timeline 
          frames={project.frames}
          currentFrameIndex={currentFrameIndex}
          setCurrentFrameIndex={setCurrentFrameIndex}
          addFrame={addFrame}
          deleteFrame={deleteFrame}
          duplicateFrame={duplicateFrame}
        />
      </div>

      {/* Mobile Tool Overlay Info */}
      <div className="mt-2 text-[10px] opacity-40 uppercase font-bold text-center">
        Tip: Press 'S' to save, 'L' to load projects locally.
      </div>
    </main>
  );
}
