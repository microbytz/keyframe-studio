"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimationProject, ToolType, Frame, Layer, FrameGroup, MoveMode } from '@/lib/types';
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
  locked: false,
  opacity: 100,
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
    advancedOnionSkinEnabled: false,
    onionSkinBefore: 1,
    onionSkinAfter: 1,
    groups: [],
  });

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<number[]>([0]);
  const [activeLayerId, setActiveLayerId] = useState<string>(project.frames[0].layers[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [moveMode, setMoveMode] = useState<MoveMode>('translate');
  const [color, setColor] = useState('#454D52');
  const [brushSize, setBrushSize] = useState(4);
  const [opacity, setOpacity] = useState(100);
  const [hardness, setHardness] = useState(80);
  
  const [pressureEnabled, setPressureEnabled] = useState(true);
  const [stabilizationEnabled, setStabilizationEnabled] = useState(true);
  const [dynamicStampingEnabled, setDynamicStampingEnabled] = useState(true);
  const [customBrushColorLink, setCustomBrushColorLink] = useState(true);
  const [customBrushData, setCustomBrushData] = useState<string | null>(null);

  const [isMultiDrawEnabled, setIsMultiDrawEnabled] = useState(false);
  const [multiDrawRange, setMultiDrawRange] = useState(5);
  
  const historyRef = useRef<Frame[][]>([[createNewFrame()]]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLayerData, setCopiedLayerData] = useState<{ name: string, imageData: string } | null>(null);
  
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const pushToHistory = useCallback((newFrames: Frame[]) => {
    const nextIndex = historyIndexRef.current + 1;
    historyRef.current = [...historyRef.current.slice(0, nextIndex), [...newFrames]];
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
      historyIndexRef.current = MAX_HISTORY - 1;
    } else {
      historyIndexRef.current = nextIndex;
    }
    updateHistoryState();
  }, [updateHistoryState]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevFrames = historyRef.current[historyIndexRef.current];
      
      setProject(prev => {
        const nextIdx = Math.min(currentFrameIndex, prevFrames.length - 1);
        const currentActiveLayer = prevFrames[nextIdx].layers.find(l => l.id === activeLayerId);
        if (!currentActiveLayer) setActiveLayerId(prevFrames[nextIdx].layers[0].id);
        
        return { ...prev, frames: prevFrames };
      });
      setCurrentFrameIndex(prev => Math.min(prev, prevFrames.length - 1));
      updateHistoryState();
    }
  }, [currentFrameIndex, activeLayerId, updateHistoryState]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextFrames = historyRef.current[historyIndexRef.current];

      setProject(prev => {
        const nextIdx = Math.min(currentFrameIndex, nextFrames.length - 1);
        const currentActiveLayer = nextFrames[nextIdx].layers.find(l => l.id === activeLayerId);
        if (!currentActiveLayer) setActiveLayerId(nextFrames[nextIdx].layers[0].id);
        
        return { ...prev, frames: nextFrames };
      });
      setCurrentFrameIndex(prev => Math.min(prev, nextFrames.length - 1));
      updateHistoryState();
    }
  }, [currentFrameIndex, activeLayerId, updateHistoryState]);

  const addFrame = useCallback(() => {
    const newFrame = createNewFrame();
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames.splice(currentFrameIndex + 1, 0, newFrame);
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
    setCurrentFrameIndex(prev => prev + 1);
    setSelectedFrameIndices([currentFrameIndex + 1]);
    setActiveLayerId(newFrame.layers[0].id);
  }, [currentFrameIndex, pushToHistory]);

  const deleteSelectedFrames = useCallback(() => {
    if (project.frames.length <= selectedFrameIndices.length) return;
    
    const sortedIndices = [...selectedFrameIndices].sort((a, b) => b - a);
    const newFrames = [...project.frames];
    
    sortedIndices.forEach(index => {
      newFrames.splice(index, 1);
    });

    const nextIndex = Math.max(0, Math.min(currentFrameIndex, newFrames.length - 1));
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
    setCurrentFrameIndex(nextIndex);
    setSelectedFrameIndices([nextIndex]);
    setActiveLayerId(newFrames[nextIndex].layers[0].id);
  }, [project.frames, selectedFrameIndices, currentFrameIndex, pushToHistory]);

  const duplicateSelectedFrames = useCallback(() => {
    const sortedIndices = [...selectedFrameIndices].sort((a, b) => a - b);
    const newFrames = [...project.frames];
    const newSelectedIndices: number[] = [];
    
    let offset = 0;
    sortedIndices.forEach(index => {
      const frameToDup = project.frames[index];
      const newFrame: Frame = {
        id: Math.random().toString(36).substr(2, 9),
        layers: frameToDup.layers.map(l => ({ ...l, id: Math.random().toString(36).substr(2, 9) })),
      };
      newFrames.splice(index + 1 + offset, 0, newFrame);
      newSelectedIndices.push(index + 1 + offset);
      offset++;
    });

    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
    const lastIdx = newSelectedIndices[newSelectedIndices.length - 1];
    setCurrentFrameIndex(lastIdx);
    setSelectedFrameIndices(newSelectedIndices);
    setActiveLayerId(newFrames[lastIdx].layers[0].id);
  }, [project.frames, selectedFrameIndices, pushToHistory]);

  const reorderFrames = useCallback((startIndex: number, endIndex: number) => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      const selectedIndices = [...selectedFrameIndices].sort((a, b) => a - b);
      
      if (!selectedIndices.includes(startIndex)) {
        const [removed] = newFrames.splice(startIndex, 1);
        newFrames.splice(endIndex, 0, removed);
        setCurrentFrameIndex(endIndex);
        setSelectedFrameIndices([endIndex]);
      } else {
        const selectedFrames = selectedIndices.map(i => prev.frames[i]);
        [...selectedIndices].reverse().forEach(i => {
          newFrames.splice(i, 1);
        });
        let targetIndex = endIndex;
        const itemsBeforeTarget = selectedIndices.filter(i => i < targetIndex).length;
        targetIndex = Math.max(0, targetIndex - itemsBeforeTarget);
        newFrames.splice(targetIndex, 0, ...selectedFrames);
        const newSelection = Array.from({ length: selectedFrames.length }, (_, i) => targetIndex + i);
        setSelectedFrameIndices(newSelection);
        const relativeActiveIdx = selectedIndices.indexOf(startIndex);
        setCurrentFrameIndex(targetIndex + relativeActiveIdx);
      }
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
  }, [selectedFrameIndices, pushToHistory]);

  const selectFrame = useCallback((index: number, multi?: boolean, range?: boolean) => {
    if (range) {
      const start = Math.min(currentFrameIndex, index);
      const end = Math.max(currentFrameIndex, index);
      const newSelection = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      setSelectedFrameIndices(newSelection);
    } else if (multi) {
      setSelectedFrameIndices(prev => 
        prev.includes(index) 
          ? (prev.length > 1 ? prev.filter(i => i !== index) : prev) 
          : [...prev, index]
      );
    } else {
      setSelectedFrameIndices([index]);
    }
    setCurrentFrameIndex(index);
    setActiveLayerId(project.frames[index].layers[0].id);
  }, [currentFrameIndex, project.frames]);

  const updateLayerData = useCallback((dataUrl: string) => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    
    const layerIdx = frame.layers.findIndex(l => l.id === activeLayerId);
    if (layerIdx === -1 || frame.layers[layerIdx].locked) return;

    frame.layers = frame.layers.map((l, idx) => 
      idx === layerIdx ? { ...l, imageData: dataUrl } : l
    );
    newFrames[currentFrameIndex] = frame;

    if (isMultiDrawEnabled && multiDrawRange > 0) {
      for (let i = 1; i <= multiDrawRange; i++) {
        const targetIdx = currentFrameIndex + i;
        if (targetIdx < newFrames.length) {
          const targetFrame = { ...newFrames[targetIdx] };
          if (targetFrame.layers[layerIdx] && !targetFrame.layers[layerIdx].locked) {
            const targetLayers = [...targetFrame.layers];
            targetLayers[layerIdx] = { ...targetLayers[layerIdx], imageData: dataUrl };
            targetFrame.layers = targetLayers;
            newFrames[targetIdx] = targetFrame;
          }
        }
      }
    }
    
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
  }, [project.frames, currentFrameIndex, activeLayerId, isMultiDrawEnabled, multiDrawRange, pushToHistory]);

  const addLayer = useCallback(() => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    const newLayer = createNewLayer(`Layer ${frame.layers.length + 1}`);
    frame.layers = [newLayer, ...frame.layers]; 
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

  const reorderLayers = useCallback((startIndex: number, endIndex: number) => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      const frame = { ...newFrames[currentFrameIndex] };
      const newLayers = [...frame.layers];
      const [removed] = newLayers.splice(startIndex, 1);
      newLayers.splice(endIndex, 0, removed);
      frame.layers = newLayers;
      newFrames[currentFrameIndex] = frame;
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
  }, [currentFrameIndex, pushToHistory]);

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

  const toggleLayerLock = useCallback((layerId: string) => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    frame.layers = frame.layers.map(l => 
      l.id === layerId ? { ...l, locked: !l.locked } : l
    );
    newFrames[currentFrameIndex] = frame;
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
  }, [project.frames, currentFrameIndex, pushToHistory]);

  const updateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    frame.layers = frame.layers.map(l => 
      l.id === layerId ? { ...l, opacity: opacity } : l
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
    if (!layer || !layer.imageData || layer.locked) return;
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
    if (!isPlaying) {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      return;
    }

    const group = project.groups?.find(g => currentFrameIndex >= g.startIndex && currentFrameIndex <= g.endIndex);
    const currentFps = group ? group.fps : project.fps;

    playbackTimeoutRef.current = setTimeout(() => {
      setCurrentFrameIndex(prev => {
        const nextIdx = (prev + 1) % project.frames.length;
        setSelectedFrameIndices([nextIdx]);
        return nextIdx;
      });
    }, 1000 / currentFps);

    return () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
    };
  }, [isPlaying, currentFrameIndex, project.fps, project.frames.length, project.groups]);

  const saveProject = useCallback(() => {
    localStorage.setItem('sketchflow_project', JSON.stringify(project));
  }, [project]);

  const loadProject = useCallback(() => {
    const saved = localStorage.getItem('sketchflow_project');
    if (saved) {
      const loadedProject = JSON.parse(saved);
      setProject(loadedProject);
      historyRef.current = [loadedProject.frames];
      historyIndexRef.current = 0;
      updateHistoryState();
      setCurrentFrameIndex(0);
      setSelectedFrameIndices([0]);
      setActiveLayerId(loadedProject.frames[0].layers[0].id);
    }
  }, [updateHistoryState]);

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
        historyRef.current = [loadedProject.frames];
        historyIndexRef.current = 0;
        updateHistoryState();
        setCurrentFrameIndex(0);
        setSelectedFrameIndices([0]);
        setActiveLayerId(loadedProject.frames[0].layers[0].id);
      } catch (err) {
        console.error("Failed to parse project file", err);
      }
    };
    reader.readAsText(file);
  }, [updateHistoryState]);

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
              ctx.save();
              ctx.globalAlpha = (layer.opacity ?? 100) / 100;
              ctx.drawImage(img, 0, 0);
              ctx.restore();
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
    selectedFrameIndices,
    selectFrame,
    activeLayerId,
    setActiveLayerId,
    isPlaying,
    tool,
    setTool,
    moveMode,
    setMoveMode,
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
    isMultiDrawEnabled,
    setIsMultiDrawEnabled,
    multiDrawRange,
    setMultiDrawRange,
    addFrame,
    deleteFrame: deleteSelectedFrames,
    duplicateFrame: duplicateSelectedFrames,
    reorderFrames,
    updateLayerData,
    addLayer,
    copyLayer,
    pasteLayer,
    hasCopiedLayer: !!copiedLayerData,
    setCopiedLayerData,
    deleteLayer,
    reorderLayers,
    toggleLayerVisibility,
    toggleLayerLock,
    updateLayerOpacity,
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
    canUndo,
    canRedo
  };
}
