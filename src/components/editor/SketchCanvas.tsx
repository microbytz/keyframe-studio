"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ToolType, Frame, Layer } from '@/lib/types';

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
  color: string;
  brushSize: number;
  opacity: number;
  hardness: number;
  onLayerUpdate: (dataUrl: string) => void;
  isPlaying: boolean;
  pressureEnabled?: boolean;
  stabilizationEnabled?: boolean;
  dynamicStampingEnabled?: boolean;
  customBrushColorLink?: boolean;
  customBrushData?: string | null;
}

export const SketchCanvas: React.FC<SketchCanvasProps> = ({
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
  color,
  brushSize,
  opacity,
  hardness,
  onLayerUpdate,
  isPlaying,
  pressureEnabled = true,
  stabilizationEnabled = true,
  dynamicStampingEnabled = true,
  customBrushColorLink = true,
  customBrushData = null,
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const onionSkinCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const lastRenderedImageDataRef = useRef<string>('');
  const lastRenderedActiveLayerIdRef = useRef<string>('');

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [lassoPoints, setLassoPoints] = useState<{ x: number, y: number }[]>([]);
  const [dragStartImage, setDragStartImage] = useState<HTMLImageElement | null>(null);
  const [customBrushImage, setCustomBrushImage] = useState<HTMLImageElement | null>(null);

  const currentFrame = frames[currentFrameIndex];
  const activeLayer = currentFrame.layers.find(l => l.id === activeLayerId) || currentFrame.layers[0];

  useEffect(() => {
    if (customBrushData) {
      const img = new Image();
      img.src = customBrushData;
      img.onload = () => setCustomBrushImage(img);
    } else {
      setCustomBrushImage(null);
    }
  }, [customBrushData]);

  // Onion skinning logic
  useEffect(() => {
    const ctx = onionSkinCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    let isCancelled = false;
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
            framesToRender.push({ index: idx, opacity: 0.3 * (1 - (i - 1) / onionSkinBefore) });
          }
        }
        for (let i = 1; i <= onionSkinAfter; i++) {
          const idx = currentFrameIndex + i;
          if (idx < frames.length) {
            framesToRender.push({ index: idx, opacity: 0.15 * (1 - (i - 1) / onionSkinAfter) });
          }
        }
      } else {
        if (currentFrameIndex > 0) framesToRender.push({ index: currentFrameIndex - 1, opacity: 0.3 });
        if (currentFrameIndex < frames.length - 1) framesToRender.push({ index: currentFrameIndex + 1, opacity: 0.15 });
      }

      for (const item of framesToRender) {
        if (isCancelled) return;
        const frame = frames[item.index];
        const layers = [...frame.layers].reverse().filter(l => l.visible && l.imageData);
        
        oCtx.save();
        oCtx.globalAlpha = item.opacity;
        for (const layer of layers) {
          await new Promise((resolve) => {
            const img = new Image();
            img.src = layer.imageData;
            img.onload = () => {
              oCtx.drawImage(img, 0, 0);
              resolve(null);
            };
            img.onerror = () => resolve(null);
          });
        }
        oCtx.restore();
      }

      if (!isCancelled) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(offscreen, 0, 0);
      }
    };

    renderOnionSkin();
    return () => { isCancelled = true; };
  }, [onionSkinEnabled, advancedOnionSkinEnabled, onionSkinBefore, onionSkinAfter, currentFrameIndex, frames, isPlaying, width, height]);

  // Composite Rendering
  useEffect(() => {
    const compositeCtx = compositeCanvasRef.current?.getContext('2d');
    if (!compositeCtx) return;

    let isCancelled = false;

    const renderComposite = async () => {
      const layersToDraw = [...currentFrame.layers].reverse().filter(l => l.id !== activeLayerId && l.visible && l.imageData);
      
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const oCtx = offscreen.getContext('2d')!;

      for (const layer of layersToDraw) {
        if (isCancelled) return;
        await new Promise((resolve) => {
          const img = new Image();
          img.src = layer.imageData;
          img.onload = () => {
            oCtx.drawImage(img, 0, 0);
            resolve(null);
          };
          img.onerror = () => resolve(null);
        });
      }
      
      if (!isCancelled) {
        compositeCtx.clearRect(0, 0, width, height);
        compositeCtx.drawImage(offscreen, 0, 0);
      }
    };

    renderComposite();
    return () => { isCancelled = true; };
  }, [currentFrame, activeLayerId, width, height]);

  // Main canvas initialization
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeLayer?.imageData === lastRenderedImageDataRef.current && activeLayerId === lastRenderedActiveLayerIdRef.current) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    
    if (activeLayer?.imageData && activeLayer.visible) {
      const img = new Image();
      img.src = activeLayer.imageData;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        lastRenderedImageDataRef.current = activeLayer.imageData;
        lastRenderedActiveLayerIdRef.current = activeLayerId;
      };
    } else {
      lastRenderedImageDataRef.current = '';
      lastRenderedActiveLayerIdRef.current = activeLayerId;
    }

    const tCtx = tempCanvasRef.current?.getContext('2d');
    if (tCtx) tCtx.clearRect(0, 0, width, height);
  }, [activeLayerId, activeLayer?.imageData, activeLayer?.visible, width, height]);

  const getPos = (e: React.PointerEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (width / rect.width),
      y: (e.clientY - rect.top) * (height / rect.height)
    };
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const { r: fR, g: fG, b: fB } = hexToRgb(fillColor);
    const fA = Math.floor((opacity / 100) * 255);

    const x = Math.floor(startX);
    const y = Math.floor(startY);
    const startPosIdx = (y * width + x) * 4;
    const sR = data[startPosIdx];
    const sG = data[startPosIdx + 1];
    const sB = data[startPosIdx + 2];
    const sA = data[startPosIdx + 3];

    if (sR === fR && sG === fG && sB === fB && sA === fA) return;

    const stack: [number, number][] = [[x, y]];

    while (stack.length > 0) {
      let [curX, curY] = stack.pop()!;
      let pos = (curY * width + curX) * 4;

      while (curY >= 0 && data[pos] === sR && data[pos + 1] === sG && data[pos + 2] === sB && data[pos + 3] === sA) {
        curY--;
        pos -= width * 4;
      }
      pos += width * 4;
      curY++;

      let reachLeft = false;
      let reachRight = false;

      while (curY < height && data[pos] === sR && data[pos + 1] === sG && data[pos + 2] === sB && data[pos + 3] === sA) {
        data[pos] = fR;
        data[pos + 1] = fG;
        data[pos + 2] = fB;
        data[pos + 3] = fA;

        if (curX > 0) {
          const leftPos = pos - 4;
          if (data[leftPos] === sR && data[leftPos + 1] === sG && data[leftPos + 2] === sB && data[leftPos + 3] === sA) {
            if (!reachLeft) {
              stack.push([curX - 1, curY]);
              reachLeft = true;
            }
          } else {
            reachLeft = false;
          }
        }

        if (curX < width - 1) {
          const rightPos = pos + 4;
          if (data[rightPos] === sR && data[rightPos + 1] === sG && data[rightPos + 2] === sB && data[rightPos + 3] === sA) {
            if (!reachRight) {
              stack.push([curX + 1, curY]);
              reachRight = true;
            }
          } else {
            reachRight = false;
          }
        }

        curY++;
        pos += width * 4;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (isPlaying || !activeLayer.visible) return;
    const pos = getPos(e);
    
    if (tool === 'bucket') {
      const canvas = mainCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d')!;
        floodFill(ctx, pos.x, pos.y, color);
        const dataUrl = canvas.toDataURL();
        lastRenderedImageDataRef.current = dataUrl;
        lastRenderedActiveLayerIdRef.current = activeLayerId;
        onLayerUpdate(dataUrl);
      }
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);
    setLastPos(pos);
    
    if (tool === 'lasso') {
      setLassoPoints([pos]);
    } else if (tool === 'move') {
      const canvas = mainCanvasRef.current;
      if (canvas) {
        const img = new Image();
        img.src = canvas.toDataURL();
        img.onload = () => setDragStartImage(img);
      }
    }

    const immediateBrushes = ['pixel', 'calligraphy', 'airbrush', 'charcoal', 'crayon', 'watercolor', 'spray', 'chalk', 'custom'];
    if (immediateBrushes.includes(tool)) {
      draw(e);
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, sX: number, sY: number, eX: number, eY: number, shapeTool: string) => {
    ctx.beginPath();
    if (shapeTool === 'line') {
      ctx.moveTo(sX, sY);
      ctx.lineTo(eX, eY);
    } else if (shapeTool === 'rectangle') {
      ctx.rect(sX, sY, eX - sX, eY - sY);
    } else if (shapeTool === 'circle') {
      const radius = Math.sqrt(Math.pow(eX - sX, 2) + Math.pow(eY - sY, 2));
      ctx.arc(sX, sY, radius, 0, 2 * Math.PI);
    } else if (shapeTool === 'triangle') {
      ctx.moveTo(sX + (eX - sX) / 2, sY);
      ctx.lineTo(eX, eY);
      ctx.lineTo(sX, eY);
      ctx.closePath();
    }
    ctx.stroke();
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || isPlaying || !activeLayer.visible) return;
    const canvas = mainCanvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    if (!canvas || !tempCanvas) return;
    const ctx = canvas.getContext('2d')!;
    const tCtx = tempCanvas.getContext('2d')!;

    let pos = getPos(e);

    if (tool === 'move') {
      if (dragStartImage) {
        const dx = pos.x - lastPos.x;
        const dy = pos.y - lastPos.y;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(dragStartImage, dx, dy);
      }
      return;
    }

    if (tool === 'lasso') {
      setLassoPoints(prev => [...prev, pos]);
      tCtx.clearRect(0, 0, width, height);
      tCtx.beginPath();
      tCtx.strokeStyle = '#82C9C9';
      tCtx.setLineDash([5, 5]);
      tCtx.moveTo(lassoPoints[0]?.x, lassoPoints[0]?.y);
      lassoPoints.forEach(p => tCtx.lineTo(p.x, p.y));
      tCtx.lineTo(pos.x, pos.y);
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
      drawShape(tCtx, startPos.x, startPos.y, pos.x, pos.y, tool);
      tCtx.restore();
      return;
    }

    // Apply stabilization if enabled
    if (stabilizationEnabled) {
      const factor = 0.25; 
      pos.x = lastPos.x + (pos.x - lastPos.x) * factor;
      pos.y = lastPos.y + (pos.y - lastPos.y) * factor;
    }

    const currentPressure = pressureEnabled ? e.pressure || 0.5 : 1;
    const effectiveBrushSize = brushSize * currentPressure;

    ctx.save();
    ctx.globalAlpha = opacity / 100;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
    }

    // Improved Interpolation and Spacing Logic
    const dist = Math.sqrt(Math.pow(pos.x - lastPos.x, 2) + Math.pow(pos.y - lastPos.y, 2));
    const angle = Math.atan2(pos.y - lastPos.y, pos.x - lastPos.x);

    if (tool === 'custom' && customBrushImage) {
      const drawStamp = (x: number, y: number, r: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r);
        
        // Creating temporary canvas for color injection if needed
        const offscreen = document.createElement('canvas');
        offscreen.width = effectiveBrushSize * 2;
        offscreen.height = effectiveBrushSize * 2;
        const oCtx = offscreen.getContext('2d')!;
        
        oCtx.drawImage(customBrushImage, 0, 0, offscreen.width, offscreen.height);
        
        if (customBrushColorLink) {
          oCtx.globalCompositeOperation = 'source-in';
          oCtx.fillStyle = color;
          oCtx.fillRect(0, 0, offscreen.width, offscreen.height);
        }
        
        ctx.drawImage(offscreen, -effectiveBrushSize, -effectiveBrushSize);
        ctx.restore();
      };

      // Spacing: Draw a stamp every X pixels (standard spacing is 1/4 of brush size)
      const spacing = Math.max(1, effectiveBrushSize / 4);
      
      if (dynamicStampingEnabled) {
        const steps = Math.max(1, Math.ceil(dist / spacing));
        for (let i = 0; i < steps; i++) {
          const t = i / steps;
          const x = lastPos.x + (pos.x - lastPos.x) * t;
          const y = lastPos.y + (pos.y - lastPos.y) * t;
          drawStamp(x, y, angle);
        }
      } else {
        drawStamp(pos.x, pos.y, angle);
      }
    }
    else if (['pen', 'eraser', 'brush', 'marker', 'highlighter', 'technical', 'ink'].includes(tool)) {
      ctx.lineWidth = effectiveBrushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (tool === 'highlighter') ctx.globalAlpha *= 0.5;
      if (tool === 'brush') {
        const blurAmount = (1 - (hardness / 100)) * effectiveBrushSize * 1.5;
        ctx.shadowBlur = blurAmount;
        ctx.shadowColor = color;
      }
      
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } 
    else if (tool === 'pencil') {
      ctx.globalAlpha *= (0.3 + (hardness / 100) * 0.4);
      ctx.lineWidth = Math.max(1, effectiveBrushSize / 2);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    else if (tool === 'pixel') {
      const size = Math.max(1, Math.floor(effectiveBrushSize / 2));
      const px = Math.floor(pos.x / size) * size;
      const py = Math.floor(pos.y / size) * size;
      ctx.fillRect(px, py, size, size);
    } 
    else if (tool === 'calligraphy') {
      const steps = Math.max(1, Math.ceil(dist / 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = lastPos.x + (pos.x - lastPos.x) * t;
        const y = lastPos.y + (pos.y - lastPos.y) * t;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-effectiveBrushSize, -1, effectiveBrushSize * 2, 2);
        ctx.restore();
      }
    } 
    else if (['airbrush', 'spray', 'charcoal', 'crayon', 'watercolor', 'chalk'].includes(tool)) {
      const density = 20 * (hardness / 100 + 0.5);
      const spread = effectiveBrushSize * 1.5;
      
      // Distribute density along the stroke for airbrush-style tools
      const steps = Math.max(1, Math.ceil(dist / 2));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const interpX = lastPos.x + (pos.x - lastPos.x) * t;
        const interpY = lastPos.y + (pos.y - lastPos.y) * t;
        
        for (let i = 0; i < density / 5; i++) { // Lower density per step to balance
          const r = Math.random() * spread;
          const rndAngle = Math.random() * Math.PI * 2;
          const x = interpX + r * Math.cos(rndAngle);
          const y = interpY + r * Math.sin(rndAngle);
          
          if (tool === 'watercolor') {
              ctx.globalAlpha = (opacity / 200) * Math.random();
              ctx.beginPath();
              ctx.arc(x, y, Math.random() * 3, 0, Math.PI * 2);
              ctx.fill();
          } else {
              ctx.fillRect(x, y, 1.5, 1.5);
          }
        }
      }
    }

    ctx.restore();
    if (tool !== 'move' && tool !== 'lasso' && !shapeTools.includes(tool)) {
      setLastPos(pos);
    }
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const handleUpdate = () => {
      const dataUrl = canvas.toDataURL();
      lastRenderedImageDataRef.current = dataUrl;
      lastRenderedActiveLayerIdRef.current = activeLayerId;
      onLayerUpdate(dataUrl);
    };

    const shapeTools = ['line', 'rectangle', 'circle', 'triangle'];
    if (shapeTools.includes(tool)) {
      const pos = getPos(e);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = opacity / 100;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawShape(ctx, startPos.x, startPos.y, pos.x, pos.y, tool);
      ctx.restore();
      handleUpdate();
    } else if (tool === 'lasso' && lassoPoints.length > 2) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      lassoPoints.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      handleUpdate();
      setLassoPoints([]);
    } else if (tool !== 'bucket') {
      handleUpdate();
    }
    
    if (tool === 'move') setDragStartImage(null);
    const tCtx = tempCanvasRef.current?.getContext('2d');
    if (tCtx) tCtx.clearRect(0, 0, width, height);
  };

  return (
    <div className="relative sketch-border shadow-lg bg-white overflow-hidden w-full aspect-video">
      <div className="absolute inset-0 bg-white" />
      <canvas ref={onionSkinCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none w-full h-full" />
      <canvas ref={compositeCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-0 w-full h-full" />
      <canvas 
        ref={mainCanvasRef} 
        width={width} 
        height={height}
        onPointerDown={startDrawing} 
        onPointerMove={draw} 
        onPointerUp={stopDrawing} 
        onPointerLeave={stopDrawing} 
        className="absolute inset-0 touch-none block z-10 w-full h-full"
        style={{ cursor: isPlaying ? 'default' : (tool === 'move' ? 'move' : 'crosshair'), opacity: activeLayer.visible ? 1 : 0.3 }}
      />
      <canvas ref={tempCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-20 w-full h-full" />
    </div>
  );
};