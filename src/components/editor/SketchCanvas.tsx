"use client"

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { ToolType, Frame, Layer, MoveMode } from '@/lib/types';

interface SketchCanvasProps {
  width: number;
  height: number;
  frames: Frame[];
  currentFrameIndex: number;
  activeLayerId: string;
  onionSkinEnabled: boolean;
  advancedOnionSkinEnabled?: boolean;
  onionSkinBefore?: number;
  onionSkinAfter?: number;
  tool: ToolType;
  moveMode?: MoveMode;
  color: string;
  brushSize: number;
  opacity: number;
  hardness: number;
  onLayerUpdate: (dataUrl: string) => void;
  onLassoSelect?: (hasSelection: boolean) => void;
  isPlaying: boolean;
  pressureEnabled?: boolean;
  stabilizationEnabled?: boolean;
  dynamicStampingEnabled?: boolean;
  customBrushColorLink?: boolean;
  customBrushData?: string | null;
}

export interface SketchCanvasHandle {
  executeLassoAction: (action: 'cut' | 'copy' | 'select' | 'move') => string | null;
}

export const SketchCanvas = forwardRef<SketchCanvasHandle, SketchCanvasProps>(({
  width,
  height,
  frames,
  currentFrameIndex,
  activeLayerId,
  onionSkinEnabled,
  advancedOnionSkinEnabled = false,
  onionSkinBefore = 1,
  onionSkinAfter = 1,
  tool,
  moveMode = 'translate',
  color,
  brushSize,
  opacity,
  hardness,
  onLayerUpdate,
  onLassoSelect,
  isPlaying,
  pressureEnabled = true,
  stabilizationEnabled = true,
  dynamicStampingEnabled = true,
  customBrushColorLink = true,
  customBrushData = null,
}, ref) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const compositeBelowCanvasRef = useRef<HTMLCanvasElement>(null);
  const compositeAboveCanvasRef = useRef<HTMLCanvasElement>(null);
  const onionSkinCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const lassoPointsRef = useRef<{ x: number, y: number }[]>([]);
  
  const lastRenderedImageDataRef = useRef<string>('');
  const lastRenderedActiveLayerIdRef = useRef<string>('');

  const [dragStartImage, setDragStartImage] = useState<HTMLImageElement | null>(null);
  const [customBrushImage, setCustomBrushImage] = useState<HTMLImageElement | null>(null);
  const [movingSelection, setMovingSelection] = useState<HTMLImageElement | null>(null);
  const [selectionBounds, setSelectionBounds] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const currentFrame = frames[currentFrameIndex];
  const activeLayerIdx = currentFrame.layers.findIndex(l => l.id === activeLayerId);
  const activeLayer = currentFrame.layers[activeLayerIdx] || currentFrame.layers[0];

  const calculateBounds = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 5) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) return { x: 0, y: 0, w: width, h: height };
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  };

  useImperativeHandle(ref, () => ({
    executeLassoAction: (action) => {
      if (activeLayer.locked) return null;
      const points = lassoPointsRef.current;
      if (points.length < 3 || !mainCanvasRef.current) return null;
      const canvas = mainCanvasRef.current;
      const ctx = canvas.getContext('2d')!;
      
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const oCtx = offscreen.getContext('2d')!;
      
      oCtx.beginPath();
      oCtx.moveTo(points[0].x, points[0].y);
      points.forEach(p => oCtx.lineTo(p.x, p.y));
      oCtx.closePath();
      oCtx.clip();
      oCtx.drawImage(canvas, 0, 0);
      const resultData = offscreen.toDataURL();

      const bounds = calculateBounds(offscreen);

      if (action === 'move') {
        const img = new Image();
        img.src = resultData;
        img.onload = () => {
          setMovingSelection(img);
          setSelectionBounds(bounds);
          const tCtx = tempCanvasRef.current?.getContext('2d');
          if (tCtx) {
            tCtx.clearRect(0, 0, width, height);
            tCtx.drawImage(img, 0, 0);
            drawSelectionBox(tCtx, bounds);
          }
        };
      }

      if (action === 'cut' || action === 'move' || action === 'copy') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        const committedData = canvas.toDataURL();
        lastRenderedImageDataRef.current = committedData;
        onLayerUpdate(committedData);
      }

      const tCtx = tempCanvasRef.current?.getContext('2d');
      if (tCtx && action !== 'move') {
        tCtx.clearRect(0, 0, width, height);
      }

      if (action !== 'select') {
        lassoPointsRef.current = [];
        onLassoSelect?.(false);
      }

      return resultData;
    }
  }));

  const drawSelectionBox = (ctx: CanvasRenderingContext2D, bounds: { x: number, y: number, w: number, h: number }) => {
    ctx.save();
    ctx.strokeStyle = '#82C9C9';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);
    
    ctx.setLineDash([]);
    ctx.fillStyle = '#82C9C9';
    const s = 6;
    ctx.fillRect(bounds.x - 4 - s/2, bounds.y - 4 - s/2, s, s);
    ctx.fillRect(bounds.x + bounds.w + 4 - s/2, bounds.y - 4 - s/2, s, s);
    ctx.fillRect(bounds.x - 4 - s/2, bounds.y + bounds.h + 4 - s/2, s, s);
    ctx.fillRect(bounds.x + bounds.w + 4 - s/2, bounds.y + bounds.h + 4 - s/2, s, s);
    ctx.restore();
  };

  useEffect(() => {
    if (tool !== 'move' && tool !== 'lasso') {
      setMovingSelection(null);
      setSelectionBounds(null);
      setDragStartImage(null);
      const tCtx = tempCanvasRef.current?.getContext('2d');
      if (tCtx) tCtx.clearRect(0, 0, width, height);
    }
  }, [tool, width, height]);

  useEffect(() => {
    if (customBrushData) {
      const img = new Image();
      img.src = customBrushData;
      img.onload = () => setCustomBrushImage(img);
    } else {
      setCustomBrushImage(null);
    }
  }, [customBrushData]);

  useEffect(() => {
    const ctx = onionSkinCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!onionSkinEnabled || isPlaying) return;

    const renderOnionSkin = async () => {
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const oCtx = offscreen.getContext('2d')!;
      const framesToRender: { index: number; opacity: number }[] = [];

      if (advancedOnionSkinEnabled) {
        for (let i = 1; i <= onionSkinBefore; i++) {
          const idx = currentFrameIndex - i;
          if (idx >= 0) {
            framesToRender.push({ index: idx, opacity: 0.1 * (1 - (i - 1) / onionSkinBefore) });
          }
        }
        for (let i = 1; i <= onionSkinAfter; i++) {
          const idx = currentFrameIndex + i;
          if (idx < frames.length) {
            framesToRender.push({ index: idx, opacity: 0.05 * (1 - (i - 1) / onionSkinAfter) });
          }
        }
      } else {
        if (currentFrameIndex > 0) framesToRender.push({ index: currentFrameIndex - 1, opacity: 0.1 });
        if (currentFrameIndex < frames.length - 1) framesToRender.push({ index: currentFrameIndex + 1, opacity: 0.05 });
      }

      for (const item of framesToRender) {
        const frame = frames[item.index];
        oCtx.save();
        oCtx.globalAlpha = item.opacity;
        for (const layer of [...frame.layers].reverse().filter(l => l.visible && l.imageData)) {
          await new Promise((resolve) => {
            const img = new Image();
            img.src = layer.imageData;
            img.onload = () => { 
              oCtx.save();
              oCtx.globalAlpha = (layer.opacity ?? 100) / 100;
              oCtx.globalCompositeOperation = (layer.blendMode || 'source-over') as GlobalCompositeOperation;
              oCtx.drawImage(img, 0, 0); 
              oCtx.restore();
              resolve(null); 
            };
            img.onerror = () => resolve(null);
          });
        }
        oCtx.restore();
      }
      ctx.drawImage(offscreen, 0, 0);
    };
    renderOnionSkin();
  }, [onionSkinEnabled, advancedOnionSkinEnabled, onionSkinBefore, onionSkinAfter, currentFrameIndex, frames, isPlaying, width, height]);

  useEffect(() => {
    const renderComposites = async () => {
      if (!currentFrame) return;

      const renderLayerSet = async (ctx: CanvasRenderingContext2D, targetLayers: Layer[]) => {
        ctx.clearRect(0, 0, width, height);
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const oCtx = offscreen.getContext('2d')!;
        
        for (const layer of [...targetLayers].reverse()) {
          if (!layer.visible || !layer.imageData) continue;
          await new Promise((resolve) => {
            const img = new Image();
            img.src = layer.imageData;
            img.onload = () => {
              oCtx.save();
              oCtx.globalAlpha = (layer.opacity ?? 100) / 100;
              oCtx.globalCompositeOperation = (layer.blendMode || 'source-over') as GlobalCompositeOperation;
              oCtx.drawImage(img, 0, 0);
              oCtx.restore();
              resolve(null);
            };
            img.onerror = () => resolve(null);
          });
        }
        ctx.drawImage(offscreen, 0, 0);
      };

      const belowLayers = currentFrame.layers.slice(activeLayerIdx + 1);
      const aboveLayers = currentFrame.layers.slice(0, activeLayerIdx);

      const belowCtx = compositeBelowCanvasRef.current?.getContext('2d');
      const aboveCtx = compositeAboveCanvasRef.current?.getContext('2d');

      if (belowCtx) await renderLayerSet(belowCtx, belowLayers);
      if (aboveCtx) await renderLayerSet(aboveCtx, aboveLayers);
    };
    
    renderComposites();
  }, [currentFrame, activeLayerId, activeLayerIdx, width, height]);

  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeLayer?.imageData === lastRenderedImageDataRef.current && activeLayerId === lastRenderedActiveLayerIdRef.current) {
      canvas.style.opacity = ((activeLayer.opacity ?? 100) / 100).toString();
      canvas.style.mixBlendMode = (activeLayer.blendMode === 'source-over' ? 'normal' : activeLayer.blendMode) || 'normal';
      return;
    }

    ctx.clearRect(0, 0, width, height);
    if (activeLayer?.imageData && activeLayer.visible) {
      const img = new Image();
      img.src = activeLayer.imageData;
      img.onload = () => {
        if (!isDrawingRef.current || tool !== 'move') {
          ctx.drawImage(img, 0, 0);
        }
        lastRenderedImageDataRef.current = activeLayer.imageData;
        lastRenderedActiveLayerIdRef.current = activeLayerId;
      };
    } else {
      lastRenderedImageDataRef.current = '';
      lastRenderedActiveLayerIdRef.current = activeLayerId;
    }
    canvas.style.opacity = ((activeLayer.opacity ?? 100) / 100).toString();
    canvas.style.mixBlendMode = (activeLayer.blendMode === 'source-over' ? 'normal' : activeLayer.blendMode) || 'normal';
  }, [activeLayerId, activeLayer?.imageData, activeLayer?.visible, activeLayer?.opacity, activeLayer?.blendMode, width, height, tool]);

  const getPos = (e: React.PointerEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (width / rect.width),
      y: (e.clientY - rect.top) * (height / rect.height)
    };
  };

  const getTransformBounds = (bounds: { x: number, y: number, w: number, h: number }, startX: number, startY: number, curX: number, curY: number, mode: MoveMode) => {
    const b = { ...bounds };
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    if (mode === 'translate') {
      b.x += (curX - startX);
      b.y += (curY - startY);
    } else if (mode === 'scale') {
      const scaleX = 1 + (curX - startX) / (width / 2);
      const scaleY = 1 + (curY - startY) / (height / 2);
      b.w = Math.abs(bounds.w * scaleX);
      b.h = Math.abs(bounds.h * scaleY);
      b.x = cx - b.w / 2;
      b.y = cy - b.h / 2;
    }
    return b;
  };

  const applyTransform = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, startX: number, startY: number, curX: number, curY: number, mode: MoveMode, bounds: { x: number, y: number, w: number, h: number }) => {
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    ctx.save();
    if (mode === 'translate') {
      ctx.translate(curX - startX, curY - startY);
    } else if (mode === 'scale') {
      const scaleX = 1 + (curX - startX) / (width / 2);
      const scaleY = 1 + (curY - startY) / (height / 2);
      ctx.translate(cx, cy);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-cx, -cy);
    } else if (mode === 'rotate') {
      const angle = Math.atan2(curY - cy, curX - cx) - Math.atan2(startY - cy, startX - cx);
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.translate(-cx, -cy);
    } else if (mode === 'skew') {
      const skewX = (curX - startX) / (width / 2);
      const skewY = (curY - startY) / (height / 2);
      ctx.transform(1, skewY, skewX, 1, 0, 0);
    }
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (isPlaying || !activeLayer.visible || activeLayer.locked) return;
    const pos = getPos(e);
    
    if (tool === 'bucket') {
      const canvas = mainCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d')!;
        floodFill(ctx, pos.x, pos.y, color);
        onLayerUpdate(canvas.toDataURL());
      }
      return;
    }

    isDrawingRef.current = true;
    startPosRef.current = pos;
    lastPosRef.current = pos;
    
    if (tool === 'lasso') {
      lassoPointsRef.current = [pos];
    } else if (tool === 'move') {
      const canvas = mainCanvasRef.current;
      if (canvas && !movingSelection) {
        const bounds = calculateBounds(canvas);
        setSelectionBounds(bounds);
        const img = new Image();
        img.src = canvas.toDataURL();
        img.onload = () => {
          setDragStartImage(img);
          canvas.getContext('2d')?.clearRect(0, 0, width, height);
        };
      }
    }
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawingRef.current || isPlaying || !activeLayer.visible || activeLayer.locked) return;
    const canvas = mainCanvasRef.current;
    const tCtx = tempCanvasRef.current?.getContext('2d');
    if (!canvas || !tCtx) return;
    const ctx = canvas.getContext('2d')!;

    let pos = getPos(e);

    if (tool === 'move') {
      tCtx.clearRect(0, 0, width, height);
      const source = movingSelection || dragStartImage;
      const bounds = selectionBounds;
      if (source && bounds) {
        applyTransform(tCtx, source, startPosRef.current.x, startPosRef.current.y, pos.x, pos.y, moveMode, bounds);
        const currentBounds = getTransformBounds(bounds, startPosRef.current.x, startPosRef.current.y, pos.x, pos.y, moveMode);
        drawSelectionBox(tCtx, currentBounds);
      }
      return;
    }

    if (tool === 'lasso') {
      lassoPointsRef.current.push(pos);
      tCtx.clearRect(0, 0, width, height);
      tCtx.beginPath();
      tCtx.strokeStyle = '#82C9C9';
      tCtx.setLineDash([5, 5]);
      tCtx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);
      lassoPointsRef.current.forEach(p => tCtx.lineTo(p.x, p.y));
      tCtx.stroke();
      tCtx.setLineDash([]);
      return;
    }

    const shapeTools = ['line', 'rectangle', 'circle', 'triangle'];
    if (shapeTools.includes(tool)) {
      tCtx.clearRect(0, 0, width, height);
      tCtx.save();
      tCtx.strokeStyle = color;
      tCtx.lineWidth = brushSize;
      tCtx.globalAlpha = opacity / 100;
      tCtx.lineCap = 'round';
      tCtx.lineJoin = 'round';
      drawShape(tCtx, startPosRef.current.x, startPosRef.current.y, pos.x, pos.y, tool);
      tCtx.restore();
      return;
    }

    const lastPos = lastPosRef.current;
    if (stabilizationEnabled) {
      pos.x = lastPos.x + (pos.x - lastPos.x) * 0.25;
      pos.y = lastPos.y + (pos.y - lastPos.y) * 0.25;
    }

    const currentPressure = pressureEnabled ? e.pressure || 0.5 : 1;
    const effectiveBrushSize = brushSize * currentPressure;

    ctx.save();
    ctx.globalAlpha = opacity / 100;
    if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
    else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
    }

    const dist = Math.sqrt(Math.pow(pos.x - lastPos.x, 2) + Math.pow(pos.y - lastPos.y, 2));
    const angle = Math.atan2(pos.y - lastPos.y, pos.x - lastPos.x);

    if (tool === 'custom' && customBrushImage) {
      const spacing = dynamicStampingEnabled ? effectiveBrushSize * 1.1 : Math.max(1, effectiveBrushSize / 10);
      const steps = Math.max(1, Math.ceil(dist / spacing));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const curX = lastPos.x + (pos.x - lastPos.x) * t;
        const curY = lastPos.y + (pos.y - lastPos.y) * t;
        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(angle);
        const off = document.createElement('canvas');
        off.width = off.height = effectiveBrushSize * 2;
        const oCtx = off.getContext('2d')!;
        oCtx.drawImage(customBrushImage, 0, 0, off.width, off.height);
        if (customBrushColorLink) { oCtx.globalCompositeOperation = 'source-in'; oCtx.fillStyle = color; oCtx.fillRect(0, 0, off.width, off.height); }
        ctx.drawImage(off, -effectiveBrushSize, -effectiveBrushSize);
        ctx.restore();
      }
    } else if (['pen', 'eraser', 'brush', 'marker', 'highlighter', 'technical', 'ink', 'pencil', 'pixel'].includes(tool)) {
      ctx.lineWidth = tool === 'pencil' ? Math.max(1, effectiveBrushSize / 2) : effectiveBrushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (tool === 'highlighter') ctx.globalAlpha *= 0.5;
      if (tool === 'pixel') {
        const s = Math.max(1, Math.floor(effectiveBrushSize / 2));
        ctx.fillRect(Math.floor(pos.x / s) * s, Math.floor(pos.y / s) * s, s, s);
      } else {
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    } else if (['airbrush', 'spray', 'charcoal', 'crayon', 'watercolor', 'chalk'].includes(tool)) {
      const steps = Math.max(1, Math.ceil(dist / 2));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const ix = lastPos.x + (pos.x - lastPos.x) * t;
        const iy = lastPos.y + (pos.y - lastPos.y) * t;
        for (let i = 0; i < 5; i++) {
          const r = Math.random() * (effectiveBrushSize * 1.5);
          const a = Math.random() * Math.PI * 2;
          ctx.fillRect(ix + r * Math.cos(a), iy + r * Math.sin(a), 1.5, 1.5);
        }
      }
    }
    ctx.restore();
    lastPosRef.current = pos;
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawingRef.current || activeLayer.locked) return;
    isDrawingRef.current = false;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);

    if (tool === 'move') {
      const source = movingSelection || dragStartImage;
      const bounds = selectionBounds;
      if (source && bounds) {
        ctx.clearRect(0, 0, width, height);
        applyTransform(ctx, source, startPosRef.current.x, startPosRef.current.y, pos.x, pos.y, moveMode, bounds);
        onLayerUpdate(canvas.toDataURL());
        setMovingSelection(null);
        setDragStartImage(null);
      }
    } else if (['line', 'rectangle', 'circle', 'triangle'].includes(tool)) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.globalAlpha = opacity / 100;
      drawShape(ctx, startPosRef.current.x, startPosRef.current.y, pos.x, pos.y, tool);
      ctx.restore();
      onLayerUpdate(canvas.toDataURL());
    } else if (tool !== 'lasso' && tool !== 'bucket') {
      onLayerUpdate(canvas.toDataURL());
    }
    tempCanvasRef.current?.getContext('2d')?.clearRect(0, 0, width, height);
  };

  const floodFill = (ctx: CanvasRenderingContext2D, sX: number, sY: number, fill: string) => {
    const img = ctx.getImageData(0, 0, width, height);
    const d = img.data;
    const x = Math.floor(sX), y = Math.floor(sY);
    const start = (y * width + x) * 4;
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const sR = d[start], sG = d[start+1], sB = d[start+2], sA = d[start+3];
    const {r, g, b} = { r: parseInt(fill.slice(1,3),16), g: parseInt(fill.slice(3,5),16), b: parseInt(fill.slice(5,7),16) };
    if (sR === r && sG === g && sB === b) return;
    const stack: [number, number][] = [[x, y]];
    while(stack.length) {
      const [cx, cy] = stack.pop()!;
      const i = (cy * width + cx) * 4;
      if (cx>=0 && cx<width && cy>=0 && cy<height && d[i]===sR && d[i+1]===sG && d[i+2]===sB) {
        d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=255;
        stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  const drawShape = (ctx: CanvasRenderingContext2D, sX: number, sY: number, eX: number, eY: number, sT: string) => {
    ctx.beginPath();
    if (sT === 'line') { ctx.moveTo(sX, sY); ctx.lineTo(eX, eY); }
    else if (sT === 'rectangle') ctx.rect(sX, sY, eX - sX, eY - sY);
    else if (sT === 'circle') ctx.arc(sX, sY, Math.sqrt(Math.pow(eX - sX, 2) + Math.pow(eY - sY, 2)), 0, 2*Math.PI);
    else if (sT === 'triangle') { ctx.moveTo(sX + (eX - sX)/2, sY); ctx.lineTo(eX, eY); ctx.lineTo(sX, eY); ctx.closePath(); }
    ctx.stroke();
  };

  return (
    <div className="relative sketch-border shadow-lg bg-white overflow-hidden w-full aspect-video">
      <div className="absolute inset-0 bg-white" />
      <canvas ref={onionSkinCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none w-full h-full" />
      <canvas ref={compositeBelowCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-0 w-full h-full" />
      <canvas ref={mainCanvasRef} width={width} height={height} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing} className="absolute inset-0 touch-none block z-10 w-full h-full" style={{ cursor: isPlaying || activeLayer.locked ? 'default' : (tool === 'move' ? 'move' : 'crosshair'), opacity: activeLayer.visible ? 1 : 0.3 }} />
      <canvas ref={compositeAboveCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-[15] w-full h-full" />
      <canvas ref={tempCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-20 w-full h-full" />
    </div>
  );
});

SketchCanvas.displayName = 'SketchCanvas';