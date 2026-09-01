import React, { useEffect, useRef } from 'react';
import { ScanStatus } from '../types';

interface FuturisticParticlesProps {
  status: ScanStatus;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  pulseSpeed: number;
  colorType: 'cyan' | 'blue' | 'white' | 'gold' | 'magenta';
  orbitAngle?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  char?: string;
}

const GLYPHS = ['0', '1', '◈', '◇', '▲', '⚡', '⬡', '⬢', '⨁', '⊛', 'ZNT', '2026'];

export const FuturisticParticles: React.FC<FuturisticParticlesProps> = ({ status }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize futuristic particles
    const particleCount = Math.min(80, Math.floor((width * height) / 14000));
    const particles: Particle[] = [];

    const colors = {
      cyan: '0, 229, 255',
      blue: '0, 140, 255',
      white: '235, 250, 255',
      gold: '255, 215, 0',
      magenta: '255, 45, 110',
    };

    for (let i = 0; i < particleCount; i++) {
      const isGlyph = Math.random() < 0.25;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.3 - Math.random() * 0.9, // Gentle upward cyber float
        size: isGlyph ? 10 + Math.random() * 4 : 1.5 + Math.random() * 3.5,
        alpha: Math.random() * 0.7,
        maxAlpha: 0.35 + Math.random() * 0.55,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        colorType: Math.random() < 0.6 ? 'cyan' : Math.random() < 0.85 ? 'blue' : 'white',
        char: isGlyph ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : undefined,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const isScanning = status === 'scanning';
      const isActivated = status === 'activated';

      const speedMultiplier = isScanning ? 2.8 : isActivated ? 1.6 : 1.0;
      const primaryRgb = isActivated ? colors.gold : colors.cyan;

      // Draw constellation links between nearby particles
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = isScanning ? 140 : isActivated ? 120 : 90;
          if (dist < maxDist) {
            const linkAlpha = (1 - dist / maxDist) * 0.25 * (isScanning ? 1.5 : 1);
            ctx.strokeStyle = `rgba(${isActivated ? colors.gold : colors.cyan}, ${linkAlpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Render each particle
      particles.forEach((p) => {
        // Position update
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Pulsing glow alpha
        p.alpha += p.pulseSpeed;
        const currentAlpha =
          (Math.sin(p.alpha) * 0.5 + 0.5) * p.maxAlpha * (isScanning ? 1.3 : isActivated ? 1.2 : 0.9);

        const currentRgb =
          isActivated && Math.random() < 0.3
            ? colors.gold
            : isActivated
            ? colors.magenta
            : p.colorType === 'cyan'
            ? colors.cyan
            : p.colorType === 'blue'
            ? colors.blue
            : colors.white;

        if (p.char) {
          // Cyber Glyph
          ctx.font = `600 ${Math.round(p.size)}px 'Orbitron', monospace`;
          ctx.fillStyle = `rgba(${currentRgb}, ${currentAlpha * 0.85})`;
          ctx.shadowBlur = isScanning ? 12 : 6;
          ctx.shadowColor = `rgba(${currentRgb}, 0.8)`;
          ctx.fillText(p.char, p.x, p.y);
          ctx.shadowBlur = 0;
        } else {
          // Futuristic glowing orb / spark
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${currentRgb}, ${currentAlpha})`;
          ctx.shadowBlur = isScanning ? 16 : isActivated ? 14 : 8;
          ctx.shadowColor = `rgba(${currentRgb}, 0.9)`;
          ctx.fill();

          // Extra bright white center core
          if (p.size > 2.5) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, currentAlpha * 1.5)})`;
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        }
      });

      // Ambient Cyber Corner Light Streaks during activation
      if (isActivated) {
        ctx.fillStyle = `rgba(255, 215, 0, ${0.03 + Math.sin(time * 3) * 0.02})`;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-15 select-none"
    />
  );
};
