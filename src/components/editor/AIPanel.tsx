"use client"

import React, { useState } from 'react';
import { aiCreativeInspirer, AiCreativeInspirerOutput } from '@/ai/flows/ai-creative-inspirer-flow';
import { Sparkles, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AIPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [inspiration, setInspiration] = useState<AiCreativeInspirerOutput | null>(null);

  const handleGenerate = async () => {
    if (!keywords.trim()) return;
    setLoading(true);
    try {
      const result = await aiCreativeInspirer({ keywords });
      setInspiration(result);
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="p-3 bg-accent text-white rounded-full shadow-lg hover:scale-110 transition-all sketch-border"
        >
          <Sparkles size={24} />
        </button>
      ) : (
        <div className="w-80 sketch-card bg-white animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="text-accent" size={18} />
              AI Inspirer
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-accent">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-60">What are you feeling?</label>
              <textarea 
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. funny alien, spooky forest..."
                className="w-full h-20 p-2 sketch-border resize-none focus:outline-none focus:border-accent text-sm"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !keywords.trim()}
              className="w-full py-2 bg-accent text-white font-bold sketch-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Get Inspired"}
            </button>

            {inspiration && (
              <div className="p-3 bg-background rounded border-2 border-accent/20 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase bg-accent/20 px-2 py-0.5 rounded">
                    {inspiration.inspirationType}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1">{inspiration.title}</h4>
                <p className="text-xs leading-relaxed opacity-80">{inspiration.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
