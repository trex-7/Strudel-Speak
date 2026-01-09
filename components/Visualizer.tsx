import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface VisualizerProps {
  color?: string;
  isPlaying: boolean;
  isJamming?: boolean; // Added prop to show jamming state
}

export const Visualizer: React.FC<VisualizerProps> = ({ color = '#4ade80', isPlaying, isJamming }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;

      // Fade out effect
      ctx.fillStyle = 'rgba(15, 15, 15, 0.2)';
      ctx.fillRect(0, 0, width, height);

      if (isPlaying) {
        time += 0.05;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Dynamic circles based on "music"
        for (let i = 0; i < 3; i++) {
          const radius = 50 + Math.sin(time + i) * 30 + (i * 20);
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Waveform
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let x = 0; x < width; x+= 10) {
          const y = height / 2 + Math.sin(x * 0.01 + time * 5) * 50 * Math.random();
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color; // Apply color hint from AI
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    // Handle Resize
    const resize = () => {
        if(canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    };
    window.addEventListener('resize', resize);
    resize();
    
    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying, color]);

  return (
    <div className="w-full h-full bg-[#0f0f0f] relative rounded-xl overflow-hidden border border-gray-800">
      <canvas ref={canvasRef} className="absolute inset-0 block" />
      <div className="absolute top-4 right-4 text-xs font-mono text-gray-500 bg-black/50 px-2 py-1 rounded flex items-center gap-2">
        STRUDEL :: VISUALIZER
      </div>
      
      {isJamming && (
        <div className="absolute top-4 left-4">
            <div className="bg-purple-900/40 border border-purple-500/30 text-purple-200 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Sparkles size={12} className="text-purple-300" />
                JAM BUDDY THINKING...
            </div>
        </div>
      )}
    </div>
  );
};
