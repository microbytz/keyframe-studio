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
    ctx.fillStyle = '#1e3a8a'; // Dark Blue
    const barWidth = canvas.width / metadata.peaks.length;
    metadata.peaks.forEach((peak, i) => {
      const h = peak * canvas.height;
      ctx.fillRect(i * barWidth, (canvas.height - h) / 2, barWidth - 1, h);
    });

    // Draw Grid Markers
    let accumulatedTime = 0;
    const totalAudioDuration = metadata.duration;

    frames.forEach((frame, idx) => {
      const startTime = accumulatedTime;
      const xPos = (startTime / totalAudioDuration) * canvas.width;
      
      if (xPos < canvas.width) {
        ctx.beginPath();
        ctx.strokeStyle = idx % 4 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
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
    <div className="w-full flex flex-col gap-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Volume2 size={14} className="opacity-40" />
          <span className="text-[10px] font-bold uppercase opacity-30 tracking-wider">Audio Track</span>
          {metadata && (
            <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded font-bold text-white/60">
              {metadata.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRecording ? (
            <div className="flex items-center gap-2 bg-red-950/20 px-2 py-1 sketch-border border-red-500/20">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-red-500">{recordingTime.toFixed(1)}s</span>
              <button onClick={stopRecording} className="p-1 hover:bg-red-500/10 rounded transition-colors text-red-500">
                <Square size={12} fill="currentColor" />
              </button>
            </div>
          ) : (
            <>
              {!audioData ? (
                <button 
                  onClick={startRecording} 
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 sketch-border border-white/20 text-[10px] font-bold uppercase transition-all"
                >
                  <Mic size={12} /> Record
                </button>
              ) : (
                <button onClick={onRemove} className="p-1.5 hover:text-red-500 opacity-40 hover:opacity-100"><Trash2 size={14} /></button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="relative h-16 bg-black/40 sketch-border overflow-hidden">
        {metadata ? (
          <canvas ref={waveformRef} width={1200} height={64} className="w-full h-full opacity-60" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10 italic text-[10px]">
            {isRecording ? "Capturing Sound..." : "Empty Track"}
          </div>
        )}
        <div className="absolute top-0 bottom-0 w-px bg-white/60 z-10" style={{ left: `${playheadPos}%` }} />
      </div>
      
      <div className="flex justify-between px-1">
        <span className="text-[8px] font-mono opacity-20">0.0s</span>
        <span className="text-[8px] font-mono opacity-20">{totalProjectTime.toFixed(1)}s</span>
      </div>
    </div>
  );
};