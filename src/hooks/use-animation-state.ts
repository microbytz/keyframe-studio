
"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimationProject, ToolType, Frame, Layer } from '@/lib/types';
import gifshot from 'gifshot';

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
  
  // History management
  const [history, setHistory] = useState<Frame[][]>([[createNewFrame()]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  // Layer clipboard state
  const [copiedLayerData, setCopiedLayerData] = useState<{ name: string, imageData: string } | null>(null);
  
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to push history more efficiently
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
      const next = historyIndex + 1;
      return next >= MAX_HISTORY ? MAX_HISTORY - 1 : next;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevFrames = history[prevIndex];
      const prevFrameIndex = Math.min(currentFrameIndex, prevFrames.length - 1);
      const prevFrame = prevFrames[prevFrameIndex];
      
      // Try to keep the same active layer ID if it exists in the history
      const existingLayer = prevFrame.layers.find(l => l.id === activeLayerId);
      const nextActiveId = existingLayer ? existingLayer.id : prevFrame.layers[0].id;

      setProject(prev => ({ ...prev, frames: prevFrames }));
      setHistoryIndex(prevIndex);
      setCurrentFrameIndex(prevFrameIndex);
      setActiveLayerId(nextActiveId);
    }
  }, [history, historyIndex, currentFrameIndex, activeLayerId]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextFrames = history[nextIndex];
      const nextFrameIndex = Math.min(currentFrameIndex, nextFrames.length - 1);
      const nextFrame = nextFrames[nextFrameIndex];
      
      const existingLayer = nextFrame.layers.find(l => l.id === activeLayerId);
      const nextActiveId = existingLayer ? existingLayer.id : nextFrame.layers[0].id;

      setProject(prev => ({ ...prev, frames: nextFrames }));
      setHistoryIndex(nextIndex);
      setCurrentFrameIndex(nextFrameIndex);
      setActiveLayerId(nextActiveId);
    }
  }, [history, historyIndex, currentFrameIndex, activeLayerId]);

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
    const newFrames = [...project.frames];
    newFrames.splice(currentFrameIndex, 1);
    
    const nextIndex = Math.max(0, currentFrameIndex - 1);
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
    setCurrentFrameIndex(nextIndex);
    setActiveLayerId(newFrames[nextIndex].layers[0].id);
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
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    frame.layers = frame.layers.map(l => 
      l.id === activeLayerId ? { ...l, imageData: dataUrl } : l
    );
    newFrames[currentFrameIndex] = frame;
    
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
  }, [project.frames, currentFrameIndex, activeLayerId, pushToHistory]);

  const addLayer = useCallback(() => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    const newLayer = createNewLayer(`Layer ${frame.layers.length + 1}`);
    frame.layers = [newLayer, ...frame.layers]; // Add to top
    newFrames[currentFrameIndex] = frame;
    
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
    setActiveLayerId(newLayer.id);
  }, [project.frames, currentFrameIndex, pushToHistory]);

  const copyLayer = useCallback((layerId: string) => {
    const layer = project.frames[currentFrameIndex].layers.find(l => l.id === layerId);
    if (layer) {
      setCopiedLayerData({ name: layer.name, imageData: layer.imageData });
    }
  }, [project.frames, currentFrameIndex]);

  const pasteLayer = useCallback(() => {
    if (!copiedLayerData) return;
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    const newLayer = createNewLayer(`${copiedLayerData.name} (Copy)`);
    newLayer.imageData = copiedLayerData.imageData;
    frame.layers = [newLayer, ...frame.layers];
    newFrames[currentFrameIndex] = frame;
    
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
    setActiveLayerId(newLayer.id);
  }, [project.frames, currentFrameIndex, copiedLayerData, pushToHistory]);

  const deleteLayer = useCallback((layerId: string) => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    if (frame.layers.length <= 1) return;
    frame.layers = frame.layers.filter(l => l.id !== layerId);
    newFrames[currentFrameIndex] = frame;
    
    if (activeLayerId === layerId) {
      setActiveLayerId(frame.layers[0].id);
    }
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
  }, [project.frames, currentFrameIndex, activeLayerId, pushToHistory]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    frame.layers = frame.layers.map(l => 
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    newFrames[currentFrameIndex] = frame;
    
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
  }, [project.frames, currentFrameIndex, pushToHistory]);

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
      setProject(loadedProject);
      setHistory([loadedProject.frames]);
      setHistoryIndex(0);
      setCurrentFrameIndex(0);
      setActiveLayerId(loadedProject.frames[0].layers[0].id);
    }
  }, []);

  const downloadProject = useCallback(() => {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}.sketchflow`;
    link.click();
    URL.revokeObjectURL(url);
  }, [project]);

  const uploadProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedProject = JSON.parse(e.target?.result as string);
        setProject(loadedProject);
        setHistory([loadedProject.frames]);
        setHistoryIndex(0);
        setCurrentFrameIndex(0);
        setActiveLayerId(loadedProject.frames[0].layers[0].id);
      } catch (err) {
        console.error("Failed to parse project file", err);
      }
    };
    reader.readAsText(file);
  }, []);

  const exportToGif = useCallback(async () => {
    setIsExporting(true);
    const images = await Promise.all(project.frames.map(async (frame) => {
      const canvas = document.createElement('canvas');
      canvas.width = project.width;
      canvas.height = project.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const layers = [...frame.layers].reverse();
      for (const layer of layers) {
        if (layer.visible && layer.imageData) {
          await new Promise((resolve) => {
            const img = new Image();
            img.src = layer.imageData;
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              resolve(null);
            };
            img.onerror = () => resolve(null);
          });
        }
      }
      return canvas.toDataURL('image/png');
    }));

    gifshot.createGIF({
      images,
      interval: 1 / project.fps,
      gifWidth: project.width,
      gifHeight: project.height,
    }, (obj: any) => {
      setIsExporting(false);
      if (!obj.error) {
        const link = document.createElement('a');
        link.href = obj.image;
        link.download = `${project.name.replace(/\s+/g, '_')}.gif`;
        link.click();
      } else {
        console.error("GIF generation error:", obj.error);
      }
    });
  }, [project]);

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
    copyLayer,
    pasteLayer,
    hasCopiedLayer: !!copiedLayerData,
    deleteLayer,
    toggleLayerVisibility,
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
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
}
