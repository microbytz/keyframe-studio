"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimationProject, ToolType, Frame, Layer } from '@/lib/types';

const INITIAL_FPS = 12;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const MAX_HISTORY = 50;

const createNewLayer = (name: string): Layer => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  imageData: '',
  visible: true,
});

const createNewFrame = (): Frame => ({
  id: Math.random().toString(36).substr(2, 9),
  layers: [createNewLayer('Layer 1')],
});

export function useAnimationState() {
  const [project, setProject] = useState<AnimationProject>({
    id: 'default',
    name: 'Untitled Sketch',
    frames: [createNewFrame()],
    fps: INITIAL_FPS,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    onionSkinEnabled: true,
  });

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activeLayerId, setActiveLayerId] = useState<string>(project.frames[0].layers[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#454D52');
  const [brushSize, setBrushSize] = useState(4);
  const [opacity, setOpacity] = useState(100);
  const [hardness, setHardness] = useState(80);
  
  const [pressureEnabled, setPressureEnabled] = useState(true);
  const [stabilizationEnabled, setStabilizationEnabled] = useState(true);
  const [dynamicStampingEnabled, setDynamicStampingEnabled] = useState(true);
  const [customBrushColorLink, setCustomBrushColorLink] = useState(true);
  const [customBrushData, setCustomBrushData] = useState<string | null>(null);
  
  const [history, setHistory] = useState<Frame[][]>([[createNewFrame()]]);
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
      setActiveLayerId(prevFrames[Math.min(currentFrameIndex, prevFrames.length - 1)].layers[0].id);
    }
  }, [history, historyIndex, currentFrameIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextFrames = history[nextIndex];
      setProject(prev => ({ ...prev, frames: nextFrames }));
      setHistoryIndex(nextIndex);
      setCurrentFrameIndex(curr => Math.min(curr, nextFrames.length - 1));
      setActiveLayerId(nextFrames[Math.min(currentFrameIndex, nextFrames.length - 1)].layers[0].id);
    }
  }, [history, historyIndex, currentFrameIndex]);

  const addFrame = useCallback(() => {
    const newFrame = createNewFrame();
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex + 1, 0, newFrame);
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
    setCurrentFrameIndex(prev => prev + 1);
    setActiveLayerId(newFrame.layers[0].id);
  }, [currentFrameIndex, pushToHistory]);

  const deleteFrame = useCallback(() => {
    if (project.frames.length <= 1) return;
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex, 1);
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
    const nextIndex = Math.max(0, currentFrameIndex - 1);
    setCurrentFrameIndex(nextIndex);
    setActiveLayerId(project.frames[nextIndex].layers[0].id);
  }, [project.frames, currentFrameIndex, pushToHistory]);

  const duplicateFrame = useCallback(() => {
    const frameToDup = project.frames[currentFrameIndex];
    const newFrame: Frame = {
      id: Math.random().toString(36).substr(2, 9),
      layers: frameToDup.layers.map(l => ({ ...l, id: Math.random().toString(36).substr(2, 9) })),
    };
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex + 1, 0, newFrame);
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
    setCurrentFrameIndex(prev => prev + 1);
    setActiveLayerId(newFrame.layers[0].id);
  }, [project.frames, currentFrameIndex, pushToHistory]);

  const updateLayerData = useCallback((dataUrl: string) => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      const frame = { ...newFrames[currentFrameIndex] };
      frame.layers = frame.layers.map(l => 
        l.id === activeLayerId ? { ...l, imageData: dataUrl } : l
      );
      newFrames[currentFrameIndex] = frame;
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
  }, [currentFrameIndex, activeLayerId, pushToHistory]);

  const addLayer = useCallback(() => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      const frame = { ...newFrames[currentFrameIndex] };
      const newLayer = createNewLayer(`Layer ${frame.layers.length + 1}`);
      frame.layers = [newLayer, ...frame.layers]; // Add to top
      newFrames[currentFrameIndex] = frame;
      pushToHistory(newFrames);
      setActiveLayerId(newLayer.id);
      return { ...prev, frames: newFrames };
    });
  }, [currentFrameIndex, pushToHistory]);

  const deleteLayer = useCallback((layerId: string) => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      const frame = { ...newFrames[currentFrameIndex] };
      if (frame.layers.length <= 1) return prev;
      frame.layers = frame.layers.filter(l => l.id !== layerId);
      newFrames[currentFrameIndex] = frame;
      if (activeLayerId === layerId) {
        setActiveLayerId(frame.layers[0].id);
      }
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
  }, [currentFrameIndex, activeLayerId, pushToHistory]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      const frame = { ...newFrames[currentFrameIndex] };
      frame.layers = frame.layers.map(l => 
        l.id === layerId ? { ...l, visible: !l.visible } : l
      );
      newFrames[currentFrameIndex] = frame;
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
  }, [currentFrameIndex, pushToHistory]);

  const toggleOnionSkin = useCallback(() => {
    setProject(prev => ({ ...prev, onionSkinEnabled: !prev.onionSkinEnabled }));
  }, []);

  const flipCurrentLayer = useCallback((axis: 'horizontal' | 'vertical') => {
    const frame = project.frames[currentFrameIndex];
    const layer = frame.layers.find(l => l.id === activeLayerId);
    if (!layer || !layer.imageData) return;

    const img = new Image();
    img.src = layer.imageData;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = project.width;
      canvas.height = project.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      if (axis === 'horizontal') {
        ctx.scale(-1, 1);
        ctx.drawImage(img, -project.width, 0);
      } else {
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, -project.height);
      }
      ctx.restore();
      updateLayerData(canvas.toDataURL());
    };
  }, [project, currentFrameIndex, activeLayerId, updateLayerData]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
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
      // Migration: convert old Frame data to Layer data if needed
      const migratedFrames = loadedProject.frames.map((f: any) => {
        if (f.imageData !== undefined) {
          return {
            id: f.id,
            layers: [{ id: 'migrated', name: 'Base Layer', imageData: f.imageData, visible: true }]
          };
        }
        return f;
      });
      loadedProject.frames = migratedFrames;
      
      setProject(loadedProject);
      setHistory([loadedProject.frames]);
      setHistoryIndex(0);
      setCurrentFrameIndex(0);
      setActiveLayerId(loadedProject.frames[0].layers[0].id);
    }
  }, []);

  return {
    project,
    currentFrameIndex,
    setCurrentFrameIndex,
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
    addFrame,
    deleteFrame,
    duplicateFrame,
    updateLayerData,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    togglePlayback,
    toggleOnionSkin,
    saveProject,
    loadProject,
    setProject,
    undo,
    redo,
    flipCurrentLayer,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
}
