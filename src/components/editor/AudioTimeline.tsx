
"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AudioMetadata, Frame } from '@/lib/types';

interface AudioTimelineProps {
  audioData?: string;
  metadata?: AudioMetadata;
  isPlaying: boolean;
  currentFrameIndex: number;
  totalFrames: number;
  frames: Frame[];
  fps: number;
  onRecord: (blob: Blob) => void;
  onRemove: () => void;
}

export const AudioTimeline: React.FC<AudioTimelineProps> = ({
  audioData,
  metadata,
  isPlaying,
  currentFrameIndex,
  totalFrames,
  frames,
  fps,
  onRecord,
  onRemove
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onRecord(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
      }, 100);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    if (!metadata || !waveformRef.current) return;
    const canvas = waveformRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Peaks
    ctx.fillStyle = '#82C9C9';
    const barWidth = canvas.width / metadata.peaks.length;
    metadata.peaks.forEach((peak, i) => {
      const h = peak * canvas.height;
      ctx.fillRect(i * barWidth, (canvas.height - h) / 2, barWidth - 1, h);
    });

    // Draw Frame/Beat Markers (The Grid)
    // Professional visualization: make primary beats more prominent
    let accumulatedTime = 0;
    const totalAudioDuration = metadata.duration;

    frames.forEach((frame, idx) => {
      const startTime = accumulatedTime;
      const xPos = (startTime / totalAudioDuration) * canvas.width;
      
      if (xPos < canvas.width) {
        ctx.beginPath();
        // Alternate intensity for readability
        ctx.strokeStyle = idx % 4 === 0 ? 'rgba(69, 77, 82, 0.4)' : 'rgba(69, 77, 82, 0.15)';
        ctx.lineWidth = idx % 4 === 0 ? 1.5 : 1;
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, canvas.height);
        ctx.stroke();
      }
      
      accumulatedTime += (frame.duration || 1) / fps;
    });

  }, [metadata, frames, fps]);

  const totalProjectTime = frames.reduce((acc, f) => acc + (f.duration || 1) / fps, 0);
  const totalTimeBefore = frames.slice(0, currentFrameIndex).reduce((acc, f) => acc + (f.duration || 1) / fps, 0);
  const playheadPos = totalProjectTime > 0 ? (totalTimeBefore / totalProjectTime) * 100 : 0;

  return (
    <div className="w-full sketch-card bg-slate-50 p-2 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Volume2 size={14} className="text-accent" />
          <span className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Audio Track</span>
          {metadata && (
            <span className="text-[9px] bg-accent/20 px-2 py-0.5 rounded font-bold truncate max-w-[150px]">
              {metadata.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRecording ? (
            <div className="flex items-center gap-2 bg-red-50 px-2 py-1 sketch-border border-red-200">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-red-500">{recordingTime.toFixed(1)}s</span>
              <button onClick={stopRecording} className="p-1 hover:bg-red-100 rounded transition-colors text-red-500">
                <Square size={12} fill="currentColor" />
              </button>
            </div>
          ) : (
            <>
              {!audioData ? (
                <button 
                  onClick={startRecording} 
                  className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-accent/10 sketch-border text-[10px] font-bold uppercase transition-all"
                >
                  <Mic size={12} /> Record
                </button>
              ) : (
                <button 
                  onClick={onRemove} 
                  className="p-1.5 hover:text-red-500 transition-colors"
                  title="Remove Audio"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="relative h-12 bg-white sketch-border overflow-hidden">
        {metadata ? (
          <canvas 
            ref={waveformRef} 
            width={800} 
            height={48} 
            className="w-full h-full opacity-70"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20 italic text-[10px]">
            {isRecording ? "Recording in progress..." : "No audio data attached"}
          </div>
        )}
        
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-accent z-10 shadow-[0_0_8px_rgba(130,201,201,0.5)] transition-all duration-100"
          style={{ left: `${playheadPos}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-accent rotate-45" />
        </div>
      </div>
      
      <div className="flex justify-between px-1">
        <span className="text-[8px] font-mono opacity-40">0.0s</span>
        <div className="flex gap-4">
          <span className="text-[8px] font-bold uppercase opacity-30 tracking-widest">Beat Sync Active</span>
          <span className="text-[8px] font-mono opacity-40">{totalProjectTime.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
};
