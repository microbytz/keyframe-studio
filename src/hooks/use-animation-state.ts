"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimationProject, ToolType, Frame } from '@/lib/types';

const INITIAL_FPS = 12;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const MAX_HISTORY = 50;

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
  const [opacity, setOpacity] = useState(100);
  const [hardness, setHardness] = useState(80);
  
  // Undo/Redo History
  const [history, setHistory] = useState<Frame[][]>([[{ id: '1', imageData: '' }]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pushToHistory = useCallback((newFrames: Frame[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newFrames);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => {
      const next = prev + 1;
      return next >= MAX_HISTORY ? MAX_HISTORY - 1 : next;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevFrames = history[prevIndex];
      setProject(prev => ({ ...prev, frames: prevFrames }));
      setHistoryIndex(prevIndex);
      setCurrentFrameIndex(curr => Math.min(curr, prevFrames.length - 1));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextFrames = history[nextIndex];
      setProject(prev => ({ ...prev, frames: nextFrames }));
      setHistoryIndex(nextIndex);
      setCurrentFrameIndex(curr => Math.min(curr, nextFrames.length - 1));
    }
  }, [history, historyIndex]);

  const addFrame = useCallback(() => {
    const newFrame: Frame = {
      id: Math.random().toString(36).substr(2, 9),
      imageData: '',
    };
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex + 1, 0, newFrame);
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
    setCurrentFrameIndex(prev => prev + 1);
  }, [currentFrameIndex, pushToHistory]);

  const deleteFrame = useCallback(() => {
    if (project.frames.length <= 1) return;
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex, 1);
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
    setCurrentFrameIndex(prev => Math.max(0, prev - 1));
  }, [project.frames.length, currentFrameIndex, pushToHistory]);

  const duplicateFrame = useCallback(() => {
    const frameToDup = project.frames[currentFrameIndex];
    const newFrame: Frame = {
      id: Math.random().toString(36).substr(2, 9),
      imageData: frameToDup.imageData,
    };
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex + 1, 0, newFrame);
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
    setCurrentFrameIndex(prev => prev + 1);
  }, [project.frames, currentFrameIndex, pushToHistory]);

  const updateFrameData = useCallback((dataUrl: string) => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], imageData: dataUrl };
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
  }, [currentFrameIndex, pushToHistory]);

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
      const loadedProject = JSON.parse(saved);
      setProject(loadedProject);
      setHistory([loadedProject.frames]);
      setHistoryIndex(0);
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
    opacity,
    setOpacity,
    hardness,
    setHardness,
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
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
}
