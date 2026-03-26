"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimationProject, ToolType, Frame, Layer, FrameGroup, MoveMode, BlendMode, SavedBrush, AudioMetadata } from '@/lib/types';
import gifshot from 'gifshot';
import { useToast } from "@/hooks/use-toast";

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
  blendMode: 'source-over',
});

const createNewFrame = (): Frame => ({
  id: Math.random().toString(36).substr(2, 9),
  layers: [createNewLayer('Layer 1')],
  duration: 1,
});

export function useAnimationState() {
  const { toast } = useToast();
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
    savedBrushes: [],
  });

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<number[]>([0]);
  const [activeLayerId, setActiveLayerId] = useState<string>(project.frames[0].layers[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopSelection, setLoopSelection] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [lastBrushTool, setLastBrushTool] = useState<ToolType>('pen');
  const [lastShapeTool, setLastShapeTool] = useState<ToolType>('rectangle');
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleSetTool = useCallback((newTool: ToolType) => {
    const brushes: ToolType[] = ['pen', 'pencil', 'brush', 'pixel', 'calligraphy', 'airbrush', 'highlighter', 'marker', 'charcoal', 'crayon', 'watercolor', 'ink', 'spray', 'chalk', 'technical', 'custom', 'blur', 'blend'];
    const shapes: ToolType[] = ['line', 'rectangle', 'circle', 'triangle'];
    
    if (brushes.includes(newTool)) setLastBrushTool(newTool);
    if (shapes.includes(newTool)) setLastShapeTool(newTool);
    
    setTool(newTool);
  }, []);

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
        duration: frameToDup.duration || 1,
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

    // Sync audio if present
    if (audioRef.current && !isPlaying) {
      const totalTimeBefore = project.frames.slice(0, index).reduce((acc, f) => acc + (f.duration || 1) / project.fps, 0);
      audioRef.current.currentTime = totalTimeBefore;
    }
  }, [currentFrameIndex, project.frames, project.fps, isPlaying]);

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

  const updateFrameDuration = useCallback((index: number, duration: number) => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      newFrames[index] = { ...newFrames[index], duration };
      pushToHistory(newFrames);
      return { ...prev, frames: newFrames };
    });
  }, [pushToHistory]);

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

  const updateLayerBlendMode = useCallback((layerId: string, blendMode: BlendMode) => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    frame.layers = frame.layers.map(l => 
      l.id === layerId ? { ...l, blendMode: blendMode } : l
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

  const saveProject = useCallback(() => {
    try {
      localStorage.setItem('sketchflow_project', JSON.stringify(project));
      toast({
        title: "Project Saved!",
        description: "Your animation has been saved to your browser's local storage.",
      });
    } catch (e: any) {
      console.error("Failed to save to localStorage", e);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: e.name === 'QuotaExceededError' 
          ? "Browser storage is full. Please use the 'Download Project' button instead."
          : "Could not save your project. Check the console for more details.",
      });
    }
  }, [project, toast]);

  const loadProject = useCallback(() => {
    try {
      const saved = localStorage.getItem('sketchflow_project');
      if (!saved) {
        toast({
          title: "No Saved Project Found",
          description: "Try downloading your project and uploading it later to keep it safe!",
        });
        return;
      }
      
      const loadedProject = JSON.parse(saved);
      if (!loadedProject.frames || loadedProject.frames.length === 0) return;
      
      if (!loadedProject.savedBrushes) loadedProject.savedBrushes = [];
      if (!loadedProject.groups) loadedProject.groups = [];
      
      setProject(loadedProject);
      historyRef.current = [loadedProject.frames];
      historyIndexRef.current = 0;
      updateHistoryState();
      setCurrentFrameIndex(0);
      setSelectedFrameIndices([0]);
      setActiveLayerId(loadedProject.frames[0].layers[0].id);
      
      toast({
        title: "Project Loaded",
        description: "Successfully restored your last session.",
      });
    } catch (err) {
      console.error("Failed to parse project from storage", err);
      toast({
        variant: "destructive",
        title: "Load Failed",
        description: "The saved project data is corrupted or invalid.",
      });
    }
  }, [updateHistoryState, toast]);

  const handleCustomBrushSave = useCallback((dataUrl: string, name: string, keepInPens: boolean) => {
    setCustomBrushData(dataUrl);
    handleSetTool('custom');
    
    if (keepInPens) {
      setProject(prev => {
        const newBrush: SavedBrush = {
          id: Math.random().toString(36).substr(2, 9),
          name: name || `Tip ${(prev.savedBrushes || []).length + 1}`,
          data: dataUrl
        };
        const nextProject = {
          ...prev,
          savedBrushes: [...(prev.savedBrushes || []), newBrush]
        };
        
        try {
          localStorage.setItem('sketchflow_project', JSON.stringify(nextProject));
          toast({
            title: "Brush Tip Saved!",
            description: `${newBrush.name} is now available in your pens collection.`,
          });
        } catch (e) {
          toast({
            variant: "destructive",
            title: "Could not save tip",
            description: "Browser storage might be full.",
          });
        }
        return nextProject;
      });
    }
  }, [handleSetTool, toast]);

  const deleteSavedBrush = useCallback((brushId: string) => {
    setProject(prev => {
      const nextProject = {
        ...prev,
        savedBrushes: (prev.savedBrushes || []).filter(b => b.id !== brushId)
      };
      try {
        localStorage.setItem('sketchflow_project', JSON.stringify(nextProject));
        toast({
          title: "Brush Deleted",
          description: "Tip removed from your collection.",
        });
      } catch (e) {}
      return nextProject;
    });
  }, [toast]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => {
      const nextState = !prev;
      if (nextState && audioRef.current) {
        // Calculate start time based on current frame
        const totalTimeBefore = project.frames.slice(0, currentFrameIndex).reduce((acc, f) => acc + (f.duration || 1) / project.fps, 0);
        audioRef.current.currentTime = totalTimeBefore;
        audioRef.current.play().catch(() => {});
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      return nextState;
    });
  }, [currentFrameIndex, project.frames, project.fps]);

  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      return;
    }

    const currentFrame = project.frames[currentFrameIndex];
    if (!currentFrame) return;

    const group = project.groups?.find(g => currentFrameIndex >= g.startIndex && currentFrameIndex <= g.endIndex);
    const currentFps = group ? group.fps : project.fps;
    const frameHold = currentFrame.duration || 1;

    playbackTimeoutRef.current = setTimeout(() => {
      setCurrentFrameIndex(prev => {
        let nextIdx;
        if (loopSelection && selectedFrameIndices.length > 1) {
          const sorted = [...selectedFrameIndices].sort((a, b) => a - b);
          const currentInSelection = sorted.indexOf(prev);
          nextIdx = currentInSelection === -1 || currentInSelection === sorted.length - 1 
            ? sorted[0] 
            : sorted[currentInSelection + 1];
          
          if (nextIdx === sorted[0] && audioRef.current) {
            const startTime = project.frames.slice(0, nextIdx).reduce((acc, f) => acc + (f.duration || 1) / project.fps, 0);
            audioRef.current.currentTime = startTime;
          }
        } else {
          nextIdx = (prev + 1) % project.frames.length;
          if (nextIdx === 0 && audioRef.current) {
            audioRef.current.currentTime = 0;
          }
        }
        
        setSelectedFrameIndices([nextIdx]);
        const targetFrame = project.frames[nextIdx];
        if (targetFrame) {
            const hasLayer = targetFrame.layers.some(l => l.id === activeLayerId);
            if (!hasLayer) setActiveLayerId(targetFrame.layers[0].id);
        }
        
        return nextIdx;
      });
    }, (1000 / currentFps) * frameHold);

    return () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
    };
  }, [isPlaying, currentFrameIndex, project.fps, project.frames, project.groups, loopSelection, selectedFrameIndices, activeLayerId]);

  const setAudio = useCallback(async (file: File | Blob, name: string) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      
      // Process peaks for waveform
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const step = Math.ceil(channelData.length / 200);
      const peaks = [];
      for (let i = 0; i < 200; i++) {
        let max = 0;
        for (let j = 0; j < step; j++) {
          const datum = channelData[i * step + j];
          if (datum > max) max = datum;
          else if (datum < -max) max = -datum;
        }
        peaks.push(max);
      }

      const metadata: AudioMetadata = {
        duration: audioBuffer.duration,
        peaks,
        name
      };

      setProject(prev => ({
        ...prev,
        audioData: dataUrl,
        audioMetadata: metadata
      }));
      
      if (!audioRef.current) {
        audioRef.current = new Audio(dataUrl);
      } else {
        audioRef.current.src = dataUrl;
      }

      toast({
        title: "Audio Loaded",
        description: `Successfully attached "${name}" to project.`,
      });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const removeAudio = useCallback(() => {
    setProject(prev => {
      const { audioData, audioMetadata, ...rest } = prev;
      return rest;
    });
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
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
    toast({
      title: "Project Downloaded",
      description: "SketchFlow file has been saved to your device.",
    });
  }, [project, toast]);

  const uploadProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedProject = JSON.parse(e.target?.result as string);
        if (!loadedProject.frames || loadedProject.frames.length === 0) return;
        if (!loadedProject.savedBrushes) loadedProject.savedBrushes = [];
        if (!loadedProject.groups) loadedProject.groups = [];
        
        setProject(loadedProject);
        
        if (loadedProject.audioData) {
          audioRef.current = new Audio(loadedProject.audioData);
        }

        historyRef.current = [loadedProject.frames];
        historyIndexRef.current = 0;
        updateHistoryState();
        setCurrentFrameIndex(0);
        setSelectedFrameIndices([0]);
        setActiveLayerId(loadedProject.frames[0].layers[0].id);
        
        toast({
          title: "Project Imported",
          description: "Successfully loaded your animation file.",
        });
      } catch (err) {
        console.error("Failed to parse project file", err);
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: "This file does not appear to be a valid SketchFlow project.",
        });
      }
    };
    reader.readAsText(file);
  }, [updateHistoryState, toast]);

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
              ctx.globalCompositeOperation = (layer.blendMode || 'source-over') as GlobalCompositeOperation;
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
        toast({
          title: "Export Complete!",
          description: "Your GIF has been generated and downloaded.",
        });
      } else {
        console.error("GIF generation error:", obj.error);
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: "Something went wrong while creating the GIF.",
        });
      }
    });
  }, [project, toast]);

  return {
    project,
    currentFrameIndex,
    selectedFrameIndices,
    selectFrame,
    activeLayerId,
    setActiveLayerId,
    isPlaying,
    loopSelection,
    setLoopSelection,
    tool,
    lastBrushTool,
    lastShapeTool,
    setTool: handleSetTool,
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
    updateFrameDuration,
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
    updateLayerBlendMode,
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
    canRedo,
    handleCustomBrushSave,
    deleteSavedBrush,
    setAudio,
    removeAudio
  };
}
