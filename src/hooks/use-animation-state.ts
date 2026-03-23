"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimationProject, ToolType, Frame } from '@/lib/types';

const INITIAL_FPS = 12;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

export function useAnimationState() {
  const [project, setProject] = useState<AnimationProject>({
    id: 'default',
    name: 'Untitled Sketch',
    frames: [{ id: '1', imageData: '' }],
    fps: INITIAL_FPS,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    onionSkinEnabled: true,
  });

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#454D52');
  const [brushSize, setBrushSize] = useState(4);
  
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addFrame = useCallback(() => {
    const newFrame: Frame = {
      id: Math.random().toString(36).substr(2, 9),
      imageData: '',
    };
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex + 1, 0, newFrame);
      return { ...prev, frames: newFrames };
    });
    setCurrentFrameIndex(prev => prev + 1);
  }, [currentFrameIndex]);

  const deleteFrame = useCallback(() => {
    if (project.frames.length <= 1) return;
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex, 1);
      return { ...prev, frames: newFrames };
    });
    setCurrentFrameIndex(prev => Math.max(0, prev - 1));
  }, [project.frames.length, currentFrameIndex]);

  const duplicateFrame = useCallback(() => {
    const frameToDup = project.frames[currentFrameIndex];
    const newFrame: Frame = {
      id: Math.random().toString(36).substr(2, 9),
      imageData: frameToDup.imageData,
    };
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex + 1, 0, newFrame);
      return { ...prev, frames: newFrames };
    });
    setCurrentFrameIndex(prev => prev + 1);
  }, [project.frames, currentFrameIndex]);

  const updateFrameData = useCallback((dataUrl: string) => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], imageData: dataUrl };
      return { ...prev, frames: newFrames };
    });
  }, [currentFrameIndex]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const toggleOnionSkin = useCallback(() => {
    setProject(prev => ({ ...prev, onionSkinEnabled: !prev.onionSkinEnabled }));
  }, []);

  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % project.frames.length);
      }, 1000 / project.fps);
    } else {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    }
    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, project.fps, project.frames.length]);

  const saveProject = useCallback(() => {
    localStorage.setItem('sketchflow_project', JSON.stringify(project));
  }, [project]);

  const loadProject = useCallback(() => {
    const saved = localStorage.getItem('sketchflow_project');
    if (saved) {
      setProject(JSON.parse(saved));
      setCurrentFrameIndex(0);
    }
  }, []);

  return {
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
  };
}
