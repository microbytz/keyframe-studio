"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  onFrameUpdate: (dataUrl: string) => void;
  isPlaying: boolean;
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
  onFrameUpdate,
  isPlaying,
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Draw onion skin layers
  const drawOnionSkins = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!onionSkinEnabled || isPlaying) return;

    const drawSkin = (frame: Frame | undefined, opacity: number, tintColor: string) => {
      if (!frame || !frame.imageData) return;
      const img = new Image();
      img.src = frame.imageData;
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = opacity;
        // Optional: Tint the onion skin (e.g., prev is red, next is green)
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      };
    };

    drawSkin(prevFrame, 0.3, '#FF0000');
    drawSkin(nextFrame, 0.15, '#00FF00');
  }, [onionSkinEnabled, prevFrame, nextFrame, isPlaying]);

  // Load current frame data onto canvas
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    
    // Draw background (paper effect)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (currentFrame.imageData) {
      const img = new Image();
      img.src = currentFrame.imageData;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }

    drawOnionSkins(ctx);
  }, [currentFrame.id, currentFrame.imageData, width, height, drawOnionSkins]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (width / rect.width),
      y: (clientY - rect.top) * (height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPlaying) return;
    setIsDrawing(true);
    setLastPos(getPos(e));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isPlaying) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);

    ctx.beginPath();
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      // To erase to white instead of transparency if preferred:
      // ctx.strokeStyle = '#FFFFFF';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPos(pos);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = mainCanvasRef.current;
    if (canvas) {
      onFrameUpdate(canvas.toDataURL());
    }
  };

  // Simplified Bucket Fill (Flood Fill)
  const handleBucketFill = (e: React.MouseEvent) => {
    if (tool !== 'bucket' || isPlaying) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    const x = Math.floor(pos.x);
    const y = Math.floor(pos.y);

    const imgData = ctx.getImageData(0, 0, width, height);
    const targetColor = getPixelColor(imgData, x, y);
    const fillColor = hexToRgb(color);

    if (colorsMatch(targetColor, fillColor)) return;

    floodFill(imgData, x, y, targetColor, fillColor);
    ctx.putImageData(imgData, 0, 0);
    onFrameUpdate(canvas.toDataURL());
  };

  return (
    <div className="relative sketch-border shadow-lg bg-white overflow-hidden" style={{ width, height }}>
      <canvas
        ref={mainCanvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={(e) => {
          if (tool === 'bucket') return;
          draw(e);
        }}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onClick={handleBucketFill}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="touch-none block"
      />
      {isPlaying && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-accent text-xs font-bold uppercase tracking-wider sketch-border">
          Preview Mode
        </div>
      )}
    </div>
  );
};

// --- Helper Functions for Canvas Tools ---

function getPixelColor(imgData: ImageData, x: number, y: number) {
  const index = (y * imgData.width + x) * 4;
  return [imgData.data[index], imgData.data[index + 1], imgData.data[index + 2], imgData.data[index + 3]];
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    255
  ] : [0, 0, 0, 255];
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

    stack.push([currX + 1, currY]);
    stack.push([currX - 1, currY]);
    stack.push([currX, currY + 1]);
    stack.push([currX, currY - 1]);
  }
}
