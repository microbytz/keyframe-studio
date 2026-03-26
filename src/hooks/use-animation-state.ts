
"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimationProject, ToolType, Frame, Layer, FrameGroup, MoveMode, BlendMode, SavedBrush, AudioMetadata, ProjectVersionMetadata } from '@/lib/types';
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

export interface ProjectListItem {
  id: string;
  name: string;
  lastModified: number;
}

export function useAnimationState() {
  const { toast } = useToast();
  
  // Initialize with a completely static state to avoid hydration mismatches
  const [project, setProject] = useState<AnimationProject>({
    id: '', 
    name: 'Untitled Sketch',
    frames: [], // Empty initially
    fps: INITIAL_FPS,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    onionSkinEnabled: true,
    advancedOnionSkinEnabled: false,
    onionSkinBefore: 1,
    onionSkinAfter: 1,
    scrubWithSound: true,
    autoSaveEnabled: true,
    snapToGrid: false,
    gridSize: 20,
    snapToAngle: false,
    groups: [],
    savedBrushes: [],
    versions: [],
  });

  const [projectList, setProjectList] = useState<ProjectListItem[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<number[]>([0]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');
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
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const historyRef = useRef<Frame[][]>([]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLayerData, setCopiedLayerData] = useState<{ name: string, imageData: string } | null>(null);
  
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fix Hydration Mismatch: Initialize dynamic content on client mount only
  useEffect(() => {
    const initializeProject = () => {
      // Check for last worked on draft in local storage first
      const registryStr = localStorage.getItem('sketchflow_registry');
      if (registryStr) {
        try {
          const registry: ProjectListItem[] = JSON.parse(registryStr);
          if (registry.length > 0) {
            const lastId = registry[0].id;
            const saved = localStorage.getItem(`sketchflow_draft_${lastId}`) || localStorage.getItem(`sketchflow_project_${lastId}`);
            if (saved) {
              const loaded = JSON.parse(saved);
              setProject(loaded);
              historyRef.current = [loaded.frames];
              if (loaded.frames[0]) setActiveLayerId(loaded.frames[0].layers[0].id);
              return;
            }
          }
        } catch (e) {
          console.error("Registry load error", e);
        }
      }

      // Default new project if nothing to restore
      const initialFrame = createNewFrame();
      const initialProject = {
        ...project,
        id: Math.random().toString(36).substr(2, 9),
        frames: [initialFrame]
      };
      setProject(initialProject);
      setActiveLayerId(initialFrame.layers[0].id);
      historyRef.current = [[initialFrame]];
      updateHistoryState();
    };

    initializeProject();
    refreshProjectList();
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevFrames = historyRef.current[historyIndexRef.current];
      
      setProject(prev => {
        const nextIdx = Math.min(currentFrameIndex, prevFrames.length - 1);
        const frame = prevFrames[nextIdx];
        if (frame) {
           const currentActiveLayer = frame.layers.find(l => l.id === activeLayerId);
           if (!currentActiveLayer) setActiveLayerId(frame.layers[0].id);
        }
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
        const frame = nextFrames[nextIdx];
        if (frame) {
          const currentActiveLayer = frame.layers.find(l => l.id === activeLayerId);
          if (!currentActiveLayer) setActiveLayerId(frame.layers[0].id);
        }
        return { ...prev, frames: nextFrames };
      });
      setCurrentFrameIndex(prev => Math.min(prev, nextFrames.length - 1));
      updateHistoryState();
    }
  }, [currentFrameIndex, activeLayerId, updateHistoryState]);

  const refreshProjectList = useCallback(() => {
    if (typeof window === 'undefined') return;
    const registry = localStorage.getItem('sketchflow_registry');
    if (registry) {
      try {
        setProjectList(JSON.parse(registry));
      } catch (e) {
        setProjectList([]);
      }
    }
  }, []);

  const saveProject = useCallback((isAuto = false) => {
    if (!project.id) return;
    try {
      if (isAuto) setIsAutoSaving(true);
      
      const storageKey = isAuto ? `sketchflow_draft_${project.id}` : `sketchflow_project_${project.id}`;
      localStorage.setItem(storageKey, JSON.stringify(project));
      
      const registryStr = localStorage.getItem('sketchflow_registry');
      let registry: ProjectListItem[] = registryStr ? JSON.parse(registryStr) : [];
      
      const existingIdx = registry.findIndex(p => p.id === project.id);
      const projectMeta = { id: project.id, name: project.name, lastModified: Date.now() };
      
      if (existingIdx > -1) {
        registry[existingIdx] = projectMeta;
      } else {
        registry.unshift(projectMeta);
      }
      
      registry.sort((a, b) => b.lastModified - a.lastModified);
      localStorage.setItem('sketchflow_registry', JSON.stringify(registry));
      setProjectList(registry);

      if (!isAuto) {
        toast({
          title: "Project Saved!",
          description: `"${project.name}" has been saved to your browser storage.`,
        });
      }
      
      if (isAuto) {
        setTimeout(() => setIsAutoSaving(false), 1000);
      }
    } catch (e: any) {
      console.error("Failed to save project", e);
    }
  }, [project, toast]);

  const loadProjectById = useCallback((id: string) => {
    const saved = localStorage.getItem(`sketchflow_project_${id}`) || localStorage.getItem(`sketchflow_draft_${id}`);
    if (!saved) return;
    
    try {
      const loadedProject = JSON.parse(saved);
      setProject(loadedProject);
      historyRef.current = [loadedProject.frames];
      historyIndexRef.current = 0;
      updateHistoryState();
      setCurrentFrameIndex(0);
      setSelectedFrameIndices([0]);
      if (loadedProject.frames[0]) setActiveLayerId(loadedProject.frames[0].layers[0].id);
      
      if (loadedProject.audioData) {
        audioRef.current = new Audio(loadedProject.audioData);
      }
      
      toast({
        title: "Project Loaded",
        description: `Successfully opened "${loadedProject.name}".`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Load Error" });
    }
  }, [updateHistoryState, toast]);

  const deleteProject = useCallback((id: string) => {
    localStorage.removeItem(`sketchflow_project_${id}`);
    localStorage.removeItem(`sketchflow_draft_${id}`);
    
    const registryStr = localStorage.getItem('sketchflow_registry');
    if (registryStr) {
      let registry: ProjectListItem[] = JSON.parse(registryStr);
      registry = registry.filter(p => p.id !== id);
      localStorage.setItem('sketchflow_registry', JSON.stringify(registry));
      setProjectList(registry);
    }
    
    toast({ title: "Project Deleted" });
  }, [toast]);

  const createNewProject = useCallback(() => {
    const newFrame = createNewFrame();
    const newProject: AnimationProject = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Animation',
      frames: [newFrame],
      fps: INITIAL_FPS,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      onionSkinEnabled: true,
      advancedOnionSkinEnabled: false,
      onionSkinBefore: 1,
      onionSkinAfter: 1,
      scrubWithSound: true,
      autoSaveEnabled: true,
      snapToGrid: false,
      gridSize: 20,
      snapToAngle: false,
      groups: [],
      savedBrushes: [],
      versions: [],
    };
    
    setProject(newProject);
    historyRef.current = [newProject.frames];
    historyIndexRef.current = 0;
    updateHistoryState();
    setCurrentFrameIndex(0);
    setSelectedFrameIndices([0]);
    setActiveLayerId(newFrame.layers[0].id);
    
    toast({ title: "New Project Created" });
  }, [updateHistoryState, toast]);

  useEffect(() => {
    if (!project.autoSaveEnabled || !project.id) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => saveProject(true), 5000);
    return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current); };
  }, [project, saveProject]);

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
    sortedIndices.forEach(index => { newFrames.splice(index, 1); });
    const nextIndex = Math.max(0, Math.min(currentFrameIndex, newFrames.length - 1));
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
    setCurrentFrameIndex(nextIndex);
    setSelectedFrameIndices([nextIndex]);
    if (newFrames[nextIndex]) setActiveLayerId(newFrames[nextIndex].layers[0].id);
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
    if (newFrames[lastIdx]) setActiveLayerId(newFrames[lastIdx].layers[0].id);
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
        [...selectedIndices].reverse().forEach(i => { newFrames.splice(i, 1); });
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
        prev.includes(index) ? (prev.length > 1 ? prev.filter(i => i !== index) : prev) : [...prev, index]
      );
    } else {
      setSelectedFrameIndices([index]);
    }
    setCurrentFrameIndex(index);
    if (project.frames[index]) {
      setActiveLayerId(project.frames[index].layers[0].id);
    }
    if (audioRef.current && !isPlaying) {
      const totalTimeBefore = project.frames.slice(0, index).reduce((acc, f) => acc + (f.duration || 1) / project.fps, 0);
      audioRef.current.currentTime = totalTimeBefore;
      if (project.scrubWithSound) {
        audioRef.current.play().catch(() => {});
        setTimeout(() => { if (!isPlaying && audioRef.current) audioRef.current.pause(); }, 80);
      }
    }
  }, [currentFrameIndex, project.frames, project.fps, project.scrubWithSound, isPlaying]);

  const updateLayerData = useCallback((dataUrl: string) => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    if (!frame) return;
    const layerIdx = frame.layers.findIndex(l => l.id === activeLayerId);
    if (layerIdx === -1 || frame.layers[layerIdx].locked) return;
    frame.layers = frame.layers.map((l, idx) => idx === layerIdx ? { ...l, imageData: dataUrl } : l);
    newFrames[currentFrameIndex] = frame;
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
  }, [project.frames, currentFrameIndex, activeLayerId, pushToHistory]);

  const updateFrameDuration = useCallback((index: number, duration: number) => {
    setProject(prev => {
      const newFrames = [...prev.frames];
      if (newFrames[index]) {
        newFrames[index] = { ...newFrames[index], duration };
        pushToHistory(newFrames);
      }
      return { ...prev, frames: newFrames };
    });
  }, [pushToHistory]);

  const addLayer = useCallback(() => {
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    if (!frame) return;
    const newLayer = createNewLayer(`Layer ${frame.layers.length + 1}`);
    frame.layers = [newLayer, ...frame.layers]; 
    newFrames[currentFrameIndex] = frame;
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
    setActiveLayerId(newLayer.id);
  }, [project.frames, currentFrameIndex, pushToHistory]);

  const copyLayer = useCallback((layerId: string) => {
    const frame = project.frames[currentFrameIndex];
    if (!frame) return;
    const layer = frame.layers.find(l => l.id === layerId);
    if (layer) setCopiedLayerData({ name: layer.name, imageData: layer.imageData });
  }, [project.frames, currentFrameIndex]);

  const pasteLayer = useCallback(() => {
    if (!copiedLayerData) return;
    const newFrames = [...project.frames];
    const frame = { ...newFrames[currentFrameIndex] };
    if (!frame) return;
    const newLayer = createNewLayer(`${copiedLayerData.name} (Copy)`);
    newLayer.imageData = copiedLayerData.imageData;
    frame.layers = [newLayer, ...frame.layers];
    newFrames[currentFrameIndex] = frame;
    setProject(prev => ({ ...prev, frames: newFrames }));
    pushToHistory(newFrames);
    setActiveLayerId(newLayer.id);
  }, [project.frames, currentFrameIndex, copiedLayerData, pushToHistory]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => {
      const nextState = !prev;
      if (nextState && audioRef.current) {
        const totalTimeBefore = project.frames.slice(0, currentFrameIndex).reduce((acc, f) => acc + (f.duration || 1) / project.fps, 0);
        audioRef.current.currentTime = totalTimeBefore;
        audioRef.current.play().catch(() => {});
      } else if (audioRef.current) audioRef.current.pause();
      return nextState;
    });
  }, [currentFrameIndex, project.frames, project.fps]);

  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimeoutRef.current) { clearTimeout(playbackTimeoutRef.current); playbackTimeoutRef.current = null; }
      return;
    }
    const currentFrame = project.frames[currentFrameIndex];
    if (!currentFrame) return;
    const frameHold = currentFrame.duration || 1;
    playbackTimeoutRef.current = setTimeout(() => {
      setCurrentFrameIndex(prev => {
        const nextIdx = (prev + 1) % project.frames.length;
        if (nextIdx === 0 && audioRef.current) audioRef.current.currentTime = 0;
        setSelectedFrameIndices([nextIdx]);
        return nextIdx;
      });
    }, (1000 / project.fps) * frameHold);
    return () => { if (playbackTimeoutRef.current) { clearTimeout(playbackTimeoutRef.current); playbackTimeoutRef.current = null; } };
  }, [isPlaying, currentFrameIndex, project.fps, project.frames]);

  const saveVersion = useCallback((name: string) => {
    if (!project.id) return;
    const versionId = Math.random().toString(36).substr(2, 9);
    const newVersionMeta: ProjectVersionMetadata = { id: versionId, name: name || `Snapshot ${Date.now()}`, timestamp: Date.now() };
    try {
      localStorage.setItem(`sketchflow_vdata_${versionId}`, JSON.stringify(project.frames));
      setProject(prev => ({ ...prev, versions: [...(prev.versions || []), newVersionMeta] }));
      toast({ title: "Snapshot Created" });
    } catch (e) { toast({ variant: "destructive", title: "Storage Full" }); }
  }, [project, toast]);

  const loadVersion = useCallback((versionId: string) => {
    const vdata = localStorage.getItem(`sketchflow_vdata_${versionId}`);
    if (vdata) {
      const frames = JSON.parse(vdata);
      setProject(prev => ({ ...prev, frames }));
      historyRef.current = [frames]; historyIndexRef.current = 0; updateHistoryState();
      toast({ title: "Snapshot Restored" });
    }
  }, [updateHistoryState, toast]);

  const deleteVersion = useCallback((versionId: string) => {
    localStorage.removeItem(`sketchflow_vdata_${versionId}`);
    setProject(prev => ({ ...prev, versions: (prev.versions || []).filter(v => v.id !== versionId) }));
  }, []);

  const downloadProject = useCallback(() => {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `${project.name}.sketchflow`; link.click();
    toast({ title: "Project Downloaded" });
  }, [project, toast]);

  const uploadProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loaded = JSON.parse(e.target?.result as string);
        setProject(loaded);
        toast({ title: "Project Imported" });
      } catch (err) { toast({ variant: "destructive", title: "Invalid File" }); }
    };
    reader.readAsText(file);
  }, [toast]);

  const setAudio = useCallback(async (file: File | Blob, name: string) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const peaks = [];
      for (let i = 0; i < 200; i++) peaks.push(Math.abs(channelData[Math.floor(i * channelData.length / 200)]));
      setProject(prev => ({ ...prev, audioData: dataUrl, audioMetadata: { duration: audioBuffer.duration, peaks, name } }));
      if (audioRef.current) audioRef.current.src = dataUrl;
      else audioRef.current = new Audio(dataUrl);
      toast({ title: "Audio Attached" });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const exportToGif = useCallback(async (options: { scale: number, transparent: boolean, startFrame: number, endFrame: number }) => {
    setIsExporting(true);
    const framesToExport = project.frames.slice(options.startFrame, options.endFrame + 1);
    const frameImages: string[] = [];

    for (const frame of framesToExport) {
       const canvas = document.createElement('canvas');
       canvas.width = project.width * options.scale;
       canvas.height = project.height * options.scale;
       const ctx = canvas.getContext('2d')!;
       
       if (!options.transparent) {
         ctx.fillStyle = 'white';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
       }

       for (const layer of [...frame.layers].reverse()) {
         if (!layer.visible || !layer.imageData) continue;
         await new Promise((resolve) => {
           const img = new Image();
           img.src = layer.imageData;
           img.onload = () => {
             ctx.save();
             ctx.globalAlpha = (layer.opacity ?? 100) / 100;
             ctx.globalCompositeOperation = (layer.blendMode || 'source-over') as GlobalCompositeOperation;
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
             ctx.restore();
             resolve(null);
           };
         });
       }
       frameImages.push(canvas.toDataURL());
    }

    gifshot.createGIF({
      images: frameImages,
      interval: 1 / project.fps,
      gifWidth: project.width * options.scale,
      gifHeight: project.height * options.scale,
    }, (obj: any) => {
      if (!obj.error) {
        const link = document.createElement('a');
        link.download = `${project.name}.gif`;
        link.href = obj.image;
        link.click();
        toast({ title: "GIF Exported!" });
      }
      setIsExporting(false);
    });
  }, [project, toast]);

  return {
    project, setProject, projectList, loadProjectById, deleteProject, createNewProject,
    currentFrameIndex, selectedFrameIndices, selectFrame, activeLayerId, setActiveLayerId,
    isPlaying, loopSelection, setLoopSelection, tool, setTool: handleSetTool, lastBrushTool, lastShapeTool,
    moveMode, setMoveMode, color, setColor, brushSize, setBrushSize, opacity, setOpacity, hardness, setHardness,
    pressureEnabled, setPressureEnabled, stabilizationEnabled, setStabilizationEnabled,
    dynamicStampingEnabled, setDynamicStampingEnabled, customBrushColorLink, setCustomBrushColorLink,
    customBrushData, setCustomBrushData, isMultiDrawEnabled, setIsMultiDrawEnabled, multiDrawRange, setMultiDrawRange,
    addFrame, deleteFrame: deleteSelectedFrames, duplicateFrame: duplicateSelectedFrames, reorderFrames,
    updateLayerData, updateFrameDuration, addLayer, copyLayer, pasteLayer, hasCopiedLayer: !!copiedLayerData, setCopiedLayerData,
    togglePlayback, toggleOnionSkin: () => setProject(p => ({ ...p, onionSkinEnabled: !p.onionSkinEnabled })),
    saveProject, downloadProject, uploadProject, exportToGif, isExporting, undo, redo,
    canUndo, canRedo,
    setAudio, removeAudio: () => setProject(p => { const { audioData, audioMetadata, ...r } = p; return r as any; }),
    saveVersion, loadVersion, deleteVersion, isAutoSaving
  };
}
