"use client"

import React, { useRef, useEffect, useState } from 'react';
import { ToolType, Frame } from '@/lib/types';

interface SketchCanvasProps {
  width: number;
  height: number;
  currentFrame: Frame;
  prevFrame?: Frame;
  nextFrame?: Frame;
  onionSkinEnabled: boolean;
  tool: ToolType;
  color: string;
  brushSize: number;
  opacity: number;
  hardness: number;
  onFrameUpdate: (dataUrl: string) => void;
  isPlaying: boolean;
  pressureEnabled?: boolean;
  stabilizationEnabled?: boolean;
}

export const SketchCanvas: React.FC<SketchCanvasProps> = ({
  width,
  height,
  currentFrame,
  prevFrame,
  nextFrame,
  onionSkinEnabled,
  tool,
  color,
  brushSize,
  opacity,
  hardness,
  onFrameUpdate,
  isPlaying,
  pressureEnabled = true,
  stabilizationEnabled = true,
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [lassoPoints, setLassoPoints] = useState<{ x: number, y: number }[]>([]);

  useEffect(() => {
    const prevCtx = prevCanvasRef.current?.getContext('2d');
    const nextCtx = nextCanvasRef.current?.getContext('2d');

    if (prevCtx) prevCtx.clearRect(0, 0, width, height);
    if (nextCtx) nextCtx.clearRect(0, 0, width, height);

    if (!onionSkinEnabled || isPlaying) return;

    const drawSkin = (ctx: CanvasRenderingContext2D, frame: Frame | undefined) => {
      if (!frame || !frame.imageData) return;
      const img = new Image();
      img.src = frame.imageData;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    };

    if (prevCtx) drawSkin(prevCtx, prevFrame);
    if (nextCtx) drawSkin(nextCtx, nextFrame);
  }, [onionSkinEnabled, prevFrame, nextFrame, isPlaying, width, height]);

  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    
    if (currentFrame.imageData) {
      const img = new Image();
      img.src = currentFrame.imageData;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }

    const tCtx = tempCanvasRef.current?.getContext('2d');
    if (tCtx) tCtx.clearRect(0, 0, width, height);
  }, [currentFrame.id, currentFrame.imageData, width, height]);

  const getPos = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = (e as any).touches[0].clientX;
      clientY = (e as any).touches[0].clientY;
    } else {
      clientX = (e as any).clientX;
      clientY = (e as any).clientY;
    }
    
    return {
      x: (clientX - rect.left) * (width / rect.width),
      y: (clientY - rect.top) * (height / rect.height)
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (isPlaying) return;
    const pos = getPos(e);
    setIsDrawing(true);
    setLastPos(pos);
    
    if (tool === 'lasso') {
      setLassoPoints([pos]);
    }

    const immediateBrushes = ['pixel', 'calligraphy', 'airbrush', 'charcoal', 'crayon', 'watercolor', 'spray', 'chalk'];
    if (immediateBrushes.includes(tool)) {
      draw(e);
    }
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || isPlaying) return;
    const canvas = mainCanvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    if (!canvas || !tempCanvas) return;
    const ctx = canvas.getContext('2d')!;
    const tCtx = tempCanvas.getContext('2d')!;

    let pos = getPos(e);

    // Apply Stabilization
    if (stabilizationEnabled) {
      const factor = 0.25; // Smoothing factor
      pos.x = lastPos.x + (pos.x - lastPos.x) * factor;
      pos.y = lastPos.y + (pos.y - lastPos.y) * factor;
    }

    // Apply Pressure
    const currentPressure = pressureEnabled ? e.pressure || 0.5 : 1;
    const effectiveBrushSize = brushSize * currentPressure;

    ctx.save();

    const brushTools = [
      'pen', 'pencil', 'brush', 'pixel', 'calligraphy', 'airbrush', 
      'highlighter', 'marker', 'charcoal', 'crayon', 'watercolor', 'ink',
      'spray', 'chalk', 'technical', 'eraser'
    ];
    
    if (brushTools.includes(tool)) {
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
      }

      ctx.globalAlpha = opacity / 100;

      if (['pen', 'eraser', 'brush', 'marker', 'highlighter', 'technical', 'ink'].includes(tool)) {
        ctx.lineWidth = tool === 'technical' ? Math.max(1, effectiveBrushSize / 4) : effectiveBrushSize;
        ctx.lineCap = (tool === 'marker' || tool === 'highlighter') ? 'butt' : 'round';
        ctx.lineJoin = 'round';
        
        if (tool === 'highlighter') {
          ctx.globalAlpha *= 0.5;
        } else if (tool === 'ink') {
          ctx.globalAlpha *= 0.9;
        }

        if (tool === 'brush' && tool !== 'eraser') {
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
        
        for (let i = 0; i < 3; i++) {
          const r = Math.random() * (effectiveBrushSize / 2);
          const a = Math.random() * Math.PI * 2;
          ctx.fillRect(pos.x + r * Math.cos(a), pos.y + r * Math.sin(a), 1, 1);
        }
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
        const spread = tool === 'spray' ? effectiveBrushSize * 3 : effectiveBrushSize * 2;
        for (let i = 0; i < density; i++) {
          const r = Math.random() * spread;
          const angle = Math.random() * Math.PI * 2;
          const x = pos.x + r * Math.cos(angle);
          const y = pos.y + r * Math.sin(angle);
          const pSize = tool === 'spray' ? Math.random() * 3 : 1;
          ctx.globalAlpha = (opacity / 100) * Math.random();
          ctx.fillRect(x, y, pSize, pSize);
        }
      } 
      else if (tool === 'charcoal' || tool === 'chalk') {
        const density = (tool === 'charcoal' ? 12 : 18) * (hardness / 100);
        ctx.globalAlpha *= tool === 'chalk' ? 0.3 : 0.6;
        for (let i = 0; i < density; i++) {
          const r = Math.random() * effectiveBrushSize;
          const angle = Math.random() * Math.PI * 2;
          const x = pos.x + r * Math.cos(angle);
          const y = pos.y + r * Math.sin(angle);
          const pSize = Math.random() * (tool === 'charcoal' ? 3 : 2);
          ctx.fillRect(x, y, pSize, pSize);
        }
      } 
      else if (tool === 'crayon') {
        ctx.lineWidth = effectiveBrushSize;
        ctx.lineCap = 'round';
        ctx.globalAlpha *= 0.8;
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const offsetX = (Math.random() - 0.5) * effectiveBrushSize * 1.5;
          const offsetY = (Math.random() - 0.5) * effectiveBrushSize * 1.5;
          ctx.globalAlpha = (opacity / 100) * 0.4;
          ctx.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
        }
      } 
      else if (tool === 'watercolor') {
        ctx.globalAlpha *= 0.05;
        const blurFactor = 3 * (1 - hardness / 100 + 0.5);
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, effectiveBrushSize * blurFactor);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, effectiveBrushSize * blurFactor, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (tool === 'lasso') {
      const newPoints = [...lassoPoints, pos];
      setLassoPoints(newPoints);
      
      tCtx.clearRect(0, 0, width, height);
      tCtx.beginPath();
      tCtx.strokeStyle = '#000';
      tCtx.setLineDash([5, 5]);
      tCtx.moveTo(newPoints[0].x, newPoints[0].y);
      newPoints.forEach(p => tCtx.lineTo(p.x, p.y));
      tCtx.stroke();
      tCtx.setLineDash([]);
    }

    ctx.restore();
    setLastPos(pos);
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = mainCanvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    if (!canvas || !tempCanvas) return;
    const ctx = canvas.getContext('2d')!;
    const tCtx = tempCanvas.getContext('2d')!;

    if (tool === 'lasso') {
      if (lassoPoints.length > 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
        lassoPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        onFrameUpdate(canvas.toDataURL());
      }
      setLassoPoints([]);
      tCtx.clearRect(0, 0, width, height);
    } else if (tool !== 'bucket') {
      onFrameUpdate(canvas.toDataURL());
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPlaying) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);

    if (tool === 'bucket') {
      const x = Math.floor(pos.x);
      const y = Math.floor(pos.y);
      const imgData = ctx.getImageData(0, 0, width, height);
      const targetColor = getPixelColor(imgData, x, y);
      const fillColor = hexToRgb(color);
      if (colorsMatch(targetColor, fillColor)) return;
      floodFill(imgData, x, y, targetColor, fillColor);
      ctx.putImageData(imgData, 0, 0);
      onFrameUpdate(canvas.toDataURL());
    }
  };

  return (
    <div ref={containerRef} className="relative sketch-border shadow-lg bg-white overflow-hidden w-full aspect-video">
      <div className="absolute inset-0 bg-white" />
      <canvas ref={prevCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none opacity-30 w-full h-full" />
      <canvas ref={nextCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none opacity-15 w-full h-full" />
      <canvas ref={mainCanvasRef} width={width} height={height}
        onPointerDown={startDrawing} 
        onPointerMove={draw} 
        onPointerUp={stopDrawing} 
        onPointerLeave={stopDrawing} 
        onClick={handleCanvasClick}
        className="absolute inset-0 touch-none block z-10 w-full h-full"
        style={{ cursor: isPlaying ? 'default' : 'crosshair' }}
      />
      <canvas ref={tempCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-20 w-full h-full" />
      {isPlaying && (
        <div className="absolute top-1 right-1 md:top-2 md:right-2 px-1 py-0.5 md:px-2 md:py-1 bg-accent text-[8px] md:text-xs font-bold uppercase tracking-wider sketch-border z-30">
          Preview
        </div>
      )}
    </div>
  );
};

function getPixelColor(imgData: ImageData, x: number, y: number) {
  const index = (y * imgData.width + x) * 4;
  return [imgData.data[index], imgData.data[index + 1], imgData.data[index + 2], imgData.data[index + 3]];
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255] : [0, 0, 0, 255];
}

function colorsMatch(c1: number[], c2: number[]) {
  return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
}

function floodFill(imgData: ImageData, x: number, y: number, targetColor: number[], fillColor: number[]) {
  const width = imgData.width;
  const height = imgData.height;
  const stack = [[x, y]];
  while (stack.length > 0) {
    const [currX, currY] = stack.pop()!;
    const index = (currY * width + currX) * 4;
    if (currX < 0 || currX >= width || currY < 0 || currY >= height) continue;
    if (!colorsMatch(getPixelColor(imgData, currX, currY), targetColor)) continue;
    imgData.data[index] = fillColor[0];
    imgData.data[index + 1] = fillColor[1];
    imgData.data[index + 2] = fillColor[2];
    imgData.data[index + 3] = fillColor[3];
    stack.push([currX + 1, currY], [currX - 1, currY], [currX, currY + 1], [currX, currY - 1]);
  }
}
