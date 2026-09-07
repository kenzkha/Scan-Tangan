import React from 'react';
import { motion } from 'motion/react';
import { ScanStatus, ScannerGraphicType } from '../types';
import { Fingerprint, Target, Power } from 'lucide-react';

interface HologramHandProps {
  status: ScanStatus;
  scanProgress: number; // 0 to 100
  handScale?: number;
  handCount?: number;
  handSpacing?: number;
  scannerType?: ScannerGraphicType;
}

export const HologramHand: React.FC<HologramHandProps> = ({
  status,
  scanProgress,
  handScale = 1.0,
  handCount = 1,
  handSpacing = 2.0,
  scannerType = 'hand',
}) => {
  const isScanning = status === 'scanning';
  const isActivated = status === 'activated';

  // Ambient floating holographic particles around the hand
  const particles = [
    { x: '22%', y: '30%', size: 3, dur: 3.2, delay: 0.2 },
    { x: '28%', y: '18%', size: 4, dur: 4.1, delay: 0.8 },
    { x: '18%', y: '48%', size: 3, dur: 3.6, delay: 1.2 },
    { x: '38%', y: '10%', size: 4, dur: 4.5, delay: 0.1 },
    { x: '50%', y: '8%', size: 3, dur: 3.8, delay: 0.5 },
    { x: '62%', y: '12%', size: 4, dur: 4.2, delay: 1.5 },
    { x: '78%', y: '28%', size: 3, dur: 3.4, delay: 0.9 },
    { x: '80%', y: '52%', size: 4, dur: 3.9, delay: 0.4 },
    { x: '25%', y: '68%', size: 4, dur: 4.6, delay: 1.1 },
    { x: '74%', y: '70%', size: 3, dur: 3.5, delay: 1.8 },
    { x: '45%', y: '25%', size: 3, dur: 3.1, delay: 0.7 },
    { x: '55%', y: '28%', size: 4, dur: 4.0, delay: 1.3 },
  ];

  // Array representing the hands based on handCount (1..5)
  const handsArray = Array.from({ length: Math.min(5, Math.max(1, handCount)) }, (_, i) => i);

  // Responsive max height and spacing depending on how many hands are present
  const getHandHeightClass = () => {
    if (handCount === 1) return 'h-[60vh] sm:h-[70vh]';
    if (handCount === 2) return 'h-[50vh] sm:h-[62vh]';
    if (handCount === 3) return 'h-[42vh] sm:h-[54vh]';
    return 'h-[35vh] sm:h-[46vh]';
  };

  const renderScannerGraphic = (index: number) => {
    const heightClass = getHandHeightClass();
    
    if (scannerType === 'fingerprint') {
      return (
        <div className={`relative flex items-center justify-center text-cyan-400 ${heightClass} aspect-square p-8 sm:p-12`}>
           <div className="absolute inset-0 rounded-3xl border border-cyan-500/30 bg-cyan-950/20 shadow-[inset_0_0_20px_rgba(0,229,255,0.1),0_0_15px_rgba(0,229,255,0.15)] flex items-center justify-center">
             {/* Corner brackets for the frame */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl opacity-80" />
             <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl opacity-80" />
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl opacity-80" />
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-xl opacity-80" />
           </div>
           <Fingerprint className="w-[65%] h-[65%] opacity-90 drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]" strokeWidth={1.2} />
        </div>
      );
    }
    
    if (scannerType === 'button') {
      const isPressed = isScanning || isActivated;
      return (
        <div className={`relative flex items-center justify-center ${heightClass} aspect-square p-6`}>
          {/* Outer Metallic Bezel */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-black border border-slate-500/50 shadow-[0_15px_35px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center">
             
             {/* Button Inner Well */}
             <div className="w-[88%] h-[88%] rounded-full bg-black/90 shadow-[inset_0_10px_20px_rgba(0,0,0,1)] flex items-center justify-center">
               
               {/* The Realistic Push Button */}
               <div className={`w-[88%] h-[88%] rounded-full bg-gradient-to-b from-rose-600 to-red-800 flex items-center justify-center relative overflow-hidden transition-all duration-150 ${isPressed ? 'shadow-[inset_0_10px_25px_rgba(0,0,0,0.8),0_1px_2px_rgba(0,0,0,0.9)] scale-[0.96] translate-y-1' : 'shadow-[inset_0_8px_15px_rgba(255,255,255,0.35),inset_0_-15px_25px_rgba(0,0,0,0.5),0_10px_20px_rgba(0,0,0,0.7)]'}`}>
                 {/* Gloss reflection */}
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[55%] h-[25%] bg-gradient-to-b from-white/30 to-transparent rounded-full blur-[1px]" />
                 {/* Power Icon */}
                 <Power className={`w-1/2 h-1/2 transition-colors duration-300 ${isPressed ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]' : 'text-red-200/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'}`} strokeWidth={2.5} />
               </div>
             </div>
          </div>
        </div>
      );
    }

    // Default: Hand image
    return (
      <img
        src="/assets/hologram-hand-cutout.png"
        alt={`Biometric Holographic Hand ${index + 1}`}
        referrerPolicy="no-referrer"
        className={`${heightClass} w-auto max-w-[85vw] object-contain select-none pointer-events-none`}
      />
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none pointer-events-none p-2 sm:p-4">
      {/* Background Holographic Radial Aura Glow behind the hands */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={
            isActivated
              ? { scale: [1, 1.15, 1], opacity: [0.55, 0.9, 0.55] }
              : isScanning
              ? { scale: [1, 1.08, 1], opacity: [0.45, 0.75, 0.45] }
              : { scale: [0.96, 1.04, 0.96], opacity: [0.25, 0.45, 0.25] }
          }
          transition={{ repeat: Infinity, duration: isActivated ? 0.55 : 2.4, ease: 'easeInOut' }}
          className={`w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full blur-[100px] ${
            isActivated ? 'bg-rose-500/40' : 'bg-cyan-500/30'
          }`}
        />
      </div>

      {/* Floating Cyber Dust Particles */}
      <div className="absolute inset-0 max-w-4xl mx-auto h-full pointer-events-none">
        {particles.map((p, idx) => (
          <motion.div
            key={`particle-${idx}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: isActivated ? '#ff3366' : '#00f0ff',
              boxShadow: isActivated ? '0 0 12px #ff3366' : '0 0 12px #00f0ff',
            }}
            animate={{
              y: ['0px', '-24px', '0px'],
              opacity: [0.2, 0.95, 0.2],
            }}
            transition={{
              repeat: Infinity,
              duration: p.dur,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Hands Container - Horizontally aligned for multiple participants */}
      <div 
        className="relative z-10 w-full flex items-center justify-center flex-wrap px-2"
        style={{ gap: `${handSpacing}rem` }}
      >
        {handsArray.map((index) => {
          return (
            <motion.div
              key={`hand-node-${index}`}
              style={{
                transform: `scale(${handScale})`,
              }}
              animate={
                isActivated
                  ? {
                      scale: [handScale, handScale * 1.04, handScale],
                      filter: [
                        'brightness(1.1) drop-shadow(0 0 30px rgba(244,63,94,0.85)) hue-rotate(140deg)',
                        'brightness(1.35) drop-shadow(0 0 60px rgba(244,63,94,1)) hue-rotate(140deg)',
                        'brightness(1.1) drop-shadow(0 0 30px rgba(244,63,94,0.85)) hue-rotate(140deg)',
                      ],
                    }
                  : isScanning
                  ? {
                      scale: [handScale * 0.98, handScale * 1.02, handScale * 0.98],
                      filter: [
                        'brightness(1.1) drop-shadow(0 0 35px rgba(0,229,255,0.7)) drop-shadow(0 0 70px rgba(0,180,255,0.4))',
                        'brightness(1.35) drop-shadow(0 0 45px rgba(0,229,255,0.95)) drop-shadow(0 0 80px rgba(0,180,255,0.7))',
                        'brightness(1.1) drop-shadow(0 0 35px rgba(0,229,255,0.7)) drop-shadow(0 0 70px rgba(0,180,255,0.4))',
                      ],
                    }
                  : {
                      scale: [handScale * 0.985, handScale * 1.015, handScale * 0.985],
                      filter:
                        'brightness(1.05) drop-shadow(0 0 25px rgba(0,229,255,0.55)) drop-shadow(0 0 50px rgba(0,200,255,0.3))',
                    }
              }
              transition={{
                repeat: (isActivated || isScanning) ? Infinity : Infinity,
                duration: isActivated ? 0.45 : isScanning ? 0.4 : 3.0 + index * 0.3,
                ease: 'easeInOut',
              }}
              className="relative flex flex-col items-center justify-center cursor-pointer pointer-events-auto transition-transform duration-300"
            >
              {/* Individual Hand Hologram Image / Graphic */}
              <div className="relative flex items-center justify-center">
                {renderScannerGraphic(index)}

                {/* Laser scan line on this hand */}
                {isScanning && (
                  <div
                    className="absolute inset-x-0 pointer-events-none"
                    style={{
                      top: `${Math.max(5, 95 - scanProgress)}%`,
                      transition: 'top 40ms linear',
                    }}
                  >
                    {/* Laser Core */}
                    <div className="w-full h-[3.5px] bg-gradient-to-r from-transparent via-cyan-100 to-transparent shadow-[0_0_20px_#00f0ff,0_0_40px_#00f0ff,0_0_60px_#ffffff]" />
                    {/* Laser Ambient Flare */}
                    <div className="w-full h-12 -mt-6 bg-gradient-to-b from-cyan-400/25 via-cyan-300/40 to-transparent blur-sm" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
