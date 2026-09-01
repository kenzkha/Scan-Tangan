import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanningOverlayProps {
  isScanning: boolean;
}

export const ScanningOverlay: React.FC<ScanningOverlayProps> = ({ isScanning }) => {
  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          key="fullscreen-scanning-beam-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 pointer-events-none z-25 overflow-hidden"
        >
          {/* Vertical Ambient Sweep Plane (Ambient translucent electric cyan gradient cone) */}
          <motion.div
            className="absolute left-0 right-0 w-full"
            initial={{ top: '-15%' }}
            animate={{ top: ['-10%', '105%', '-10%'] }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: 'easeInOut',
            }}
          >
            {/* Soft Ambient Upward Flare */}
            <div className="w-full h-36 bg-gradient-to-t from-cyan-400/30 via-cyan-500/10 to-transparent blur-md" />

            {/* Glowing Laser Lightbar */}
            <div className="relative w-full h-[3.5px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_20px_#00e5ff,0_0_40px_#00e5ff,0_0_80px_rgba(0,229,255,0.9)]">
              {/* Intense Center White Core */}
              <div className="absolute inset-x-[12%] top-0 h-[2.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95 shadow-[0_0_12px_#ffffff]" />
            </div>

            {/* Soft Ambient Downward Flare */}
            <div className="w-full h-28 bg-gradient-to-b from-cyan-400/25 via-cyan-500/5 to-transparent blur-sm" />
          </motion.div>

          {/* Secondary Fast Pulse Scanline (High-frequency cyber pulse) */}
          <motion.div
            className="absolute left-0 right-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_15px_#00e5ff]"
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{
              repeat: Infinity,
              duration: 1.3,
              ease: 'linear',
            }}
          />

          {/* Holographic CRT scan raster mesh when scanning */}
          <div
            className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.04)_1px,transparent_1px)] bg-[size:100%_4px] opacity-80 mix-blend-screen"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
