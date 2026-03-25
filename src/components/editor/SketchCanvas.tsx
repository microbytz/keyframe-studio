"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ToolType, Frame, Layer } from '@/lib/types';

interface SketchCanvasProps {
  width: number;
  height: number;
  currentFrame: Frame;
  prevFrame?: Frame;
  nextFrame?: Frame;
  activeLayerId: string;
  onionSkinEnabled: boolean;
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
  currentFrame,
  prevFrame,
  nextFrame,
  activeLayerId,
  onionSkinEnabled,
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
  const prevCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [lassoPoints, setLassoPoints] = useState<{ x: number, y: number }[]>([]);
  const [dragStartImage, setDragStartImage] = useState<HTMLImageElement | null>(null);
  const [customBrushImage, setCustomBrushImage] = useState<HTMLImageElement | null>(null);

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

  // Onion skinning
  useEffect(() => {
    const prevCtx = prevCanvasRef.current?.getContext('2d');
    const nextCtx = nextCanvasRef.current?.getContext('2d');
    if (prevCtx) prevCtx.clearRect(0, 0, width, height);
    if (nextCtx) nextCtx.clearRect(0, 0, width, height);

    if (!onionSkinEnabled || isPlaying) return;

    const drawFrameComposite = (ctx: CanvasRenderingContext2D, frame: Frame | undefined) => {
      if (!frame) return;
      // Draw all visible layers from bottom to top
      [...frame.layers].reverse().forEach(layer => {
        if (layer.visible && layer.imageData) {
          const img = new Image();
          img.src = layer.imageData;
          img.onload = () => ctx.drawImage(img, 0, 0);
        }
      });
    };

    if (prevCtx) drawFrameComposite(prevCtx, prevFrame);
    if (nextCtx) drawFrameComposite(nextCtx, nextFrame);
  }, [onionSkinEnabled, prevFrame, nextFrame, isPlaying, width, height]);

  // Composite Rendering (for non-active layers)
  useEffect(() => {
    const compositeCtx = compositeCanvasRef.current?.getContext('2d');
    if (!compositeCtx) return;
    compositeCtx.clearRect(0, 0, width, height);

    // Render layers below the active layer
    const layerIndex = currentFrame.layers.findIndex(l => l.id === activeLayerId);
    
    // Reverse because array is top-to-bottom, we draw bottom-to-top
    [...currentFrame.layers].reverse().forEach(layer => {
      if (layer.id !== activeLayerId && layer.visible && layer.imageData) {
        const img = new Image();
        img.src = layer.imageData;
        img.onload = () => compositeCtx.drawImage(img, 0, 0);
      }
    });
  }, [currentFrame, activeLayerId, width, height]);

  // Main canvas initialization for active layer
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    
    if (activeLayer?.imageData && activeLayer.visible) {
      const img = new Image();
      img.src = activeLayer.imageData;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
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

  const startDrawing = (e: React.PointerEvent) => {
    if (isPlaying || !activeLayer.visible) return;
    const pos = getPos(e);
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

    if (tool === 'custom' && customBrushImage) {
      const dist = Math.sqrt(Math.pow(pos.x - lastPos.x, 2) + Math.pow(pos.y - lastPos.y, 2));
      const angle = Math.atan2(pos.y - lastPos.y, pos.x - lastPos.x);
      
      const drawStamp = (x: number, y: number, r: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r);
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

      if (dynamicStampingEnabled) {
        const steps = Math.max(1, Math.ceil(dist / (effectiveBrushSize / 4)));
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
      const steps = Math.max(1, Math.ceil(Math.sqrt(Math.pow(pos.x - lastPos.x, 2) + Math.pow(pos.y - lastPos.y, 2)) / 2));
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
    else if (tool === 'airbrush' || tool === 'spray') {
      const density = (tool === 'airbrush' ? 15 : 8) * (hardness / 100 + 0.5);
      const spread = effectiveBrushSize * 2;
      for (let i = 0; i < density; i++) {
        const r = Math.random() * spread;
        const angle = Math.random() * Math.PI * 2;
        const x = pos.x + r * Math.cos(angle);
        const y = pos.y + r * Math.sin(angle);
        ctx.fillRect(x, y, 1, 1);
      }
    }

    ctx.restore();
    if (tool !== 'move' && !shapeTools.includes(tool)) {
      setLastPos(pos);
    }
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

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
      onLayerUpdate(canvas.toDataURL());
    } else if (tool === 'lasso' && lassoPoints.length > 2) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      lassoPoints.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      onLayerUpdate(canvas.toDataURL());
      setLassoPoints([]);
    } else if (tool !== 'bucket') {
      onLayerUpdate(canvas.toDataURL());
    }
    
    if (tool === 'move') setDragStartImage(null);
  };

  return (
    <div className="relative sketch-border shadow-lg bg-white overflow-hidden w-full aspect-video">
      <div className="absolute inset-0 bg-white" />
      <canvas ref={prevCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none opacity-30 w-full h-full" />
      <canvas ref={nextCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none opacity-15 w-full h-full" />
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
