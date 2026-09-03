/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HologramHand } from './components/HologramHand';
import { ScanningOverlay } from './components/ScanningOverlay';
import { FuturisticParticles } from './components/FuturisticParticles';
import { CustomizationModal } from './components/CustomizationModal';
import { ScanStatus, AppCustomConfig, DEFAULT_CONFIG } from './types';
import { soundEngine } from './utils/audio';
import { Volume2, VolumeX, RotateCcw, Sparkles, CheckCircle2, SlidersHorizontal, Maximize, Minimize } from 'lucide-react';

const STORAGE_KEY = 'biometric_scanner_config_v2';

export default function App() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(10);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Configuration state with local persistence
  const [config, setConfig] = useState<AppCustomConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CONFIG;
  });

  // Save config changes to localStorage
  const handleUpdateConfig = (newConfig: AppCustomConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  const handleResetDefault = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const scanIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const activePointers = useRef<Set<number>>(new Set());

  // Trigger scan on touch / tap / click
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    activePointers.current.add(e.pointerId);

    if (isSettingsOpen) return;

    if (status === 'activated') {
      // If alarm is currently sounding, pressing resets / silences it
      soundEngine.playButtonClick();
      soundEngine.stopAlarmAudio();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setStatus('idle');
      setScanProgress(0);
      return;
    }

    if (status === 'idle') {
      // Start scanning sequence ONLY on the first touch point
      if (activePointers.current.size === 1) {
        setStatus('scanning');
        setScanProgress(0);
        soundEngine.startScanHum();
      }
    }
  }, [status, isSettingsOpen]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    if (status === 'scanning') {
      // Only cancel if ALL touch points (the whole hand) have been lifted
      if (activePointers.current.size === 0) {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        soundEngine.stopScanHum();
        setStatus('idle');
        setScanProgress(0);
      }
    }
  }, [status]);

  // Automated scanning progression based on config.scanDuration
  useEffect(() => {
    if (status === 'scanning') {
      const totalScanMs = Math.max(200, config.scanDuration * 1000);
      const stepIntervalMs = 30;
      const totalSteps = totalScanMs / stepIntervalMs;
      const stepIncrement = 100 / totalSteps;

      scanIntervalRef.current = window.setInterval(() => {
        setScanProgress((prev) => {
          const next = prev + stepIncrement;
          if (next >= 100) {
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }
            soundEngine.stopScanHum();

            // Trigger activated alarm & announcement for configured sirenDuration
            const sirenSeconds = Math.max(3, config.sirenDuration || 10);
            setStatus('activated');
            setCountdown(sirenSeconds);

            soundEngine.startAlarmAudio(
              sirenSeconds,
              config.sirenType,
              config.customAudioUrl,
              () => {
                // Automatically return to idle once playback finishes
                setStatus('idle');
                setScanProgress(0);
              }
            );

            return 100;
          }
          if (Math.floor(next) % 20 === 0) {
            soundEngine.playScanTick(next / 100);
          }
          return next;
        });
      }, stepIntervalMs);
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [status, config.scanDuration, config.sirenDuration, config.sirenType, config.customAudioUrl]);

  // Active countdown timer during alarm playback
  useEffect(() => {
    if (status === 'activated') {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [status]);

  // Reset or Silence Siren Button
  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playButtonClick();
    soundEngine.stopAlarmAudio();
    soundEngine.stopScanHum();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setStatus('idle');
    setScanProgress(0);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  const handleOpenSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playButtonClick();
    setIsSettingsOpen(true);
  };

  const handleToggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Render Background Style
  const renderBackgroundLayer = () => {
    if (config.bgType === 'custom' && config.customBgUrl) {
      return (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: `url(${config.customBgUrl})` }}
        />
      );
    }

    if (config.bgType === 'matrix') {
      return (
        <div className="absolute inset-0 bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      );
    }

    if (config.bgType === 'space') {
      return (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black" />
      );
    }

    if (config.bgType === 'grid') {
      return (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,229,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,229,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
      );
    }

    return null;
  };

  return (
    <main
      id="main-screen-scanner"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-screen h-screen overflow-hidden bg-black text-slate-100 flex flex-col items-center justify-center select-none touch-none cursor-pointer transition-colors duration-700 ${
        status === 'activated' ? 'bg-[#0a0208]' : 'bg-[#010811]'
      }`}
    >
      {/* Dynamic Background Image & Texture Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {renderBackgroundLayer()}

        {/* Dimmer Darkness Overlay */}
        <div
          className="absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none"
          style={{ opacity: (config.bgDarkness || 30) / 100 }}
        />

        {/* Dynamic Sci-Fi Radial Ambient Aura */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] rounded-full blur-[160px] transition-colors duration-700 pointer-events-none ${
            status === 'activated' ? 'bg-amber-500/15' : 'bg-cyan-500/15'
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] rounded-full blur-[130px] transition-colors duration-700 pointer-events-none ${
            status === 'activated' ? 'bg-rose-600/15' : 'bg-blue-600/15'
          }`}
        />
      </div>

      {/* Futuristic Particle Simulation System */}
      <FuturisticParticles status={status} />

      {/* Top Left Menu: Customization Settings Button & Fullscreen */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        <button
          id="btn-open-settings"
          onClick={handleOpenSettings}
          className="p-2.5 sm:px-3.5 sm:py-2 rounded-full sm:rounded-xl border border-cyan-500/40 bg-black/70 backdrop-blur-md text-cyan-300 hover:text-white hover:border-cyan-400 hover:bg-cyan-950/80 transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] flex items-center gap-2 cursor-pointer"
          title="Buka Menu Kustomisasi"
        >
          <SlidersHorizontal className="w-4 h-4 sm:w-4 sm:h-4 text-cyan-400" />
          <span className="hidden sm:inline font-['Orbitron'] font-bold text-xs tracking-wider uppercase">
            Pengaturan
          </span>
        </button>
        <button
          onClick={handleToggleFullscreen}
          className="p-2.5 rounded-full sm:rounded-xl border border-cyan-500/40 bg-black/70 backdrop-blur-md text-cyan-300 hover:text-white hover:border-cyan-400 hover:bg-cyan-950/80 transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] flex items-center cursor-pointer"
          title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>

      {/* Sound Mute Toggle in top-right corner */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <button
          id="btn-toggle-sound"
          onClick={handleToggleMute}
          className="p-2.5 rounded-full border border-cyan-500/40 bg-black/70 backdrop-blur-md text-cyan-400 hover:text-cyan-300 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] cursor-pointer"
          title={isMuted ? "Aktifkan Suara" : "Bisukan Suara"}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Holographic Hands Display */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-2 sm:p-6 pointer-events-none">
        <HologramHand
          status={status}
          scanProgress={scanProgress}
          handScale={config.handScale}
          handCount={config.handCount}
          handSpacing={config.handSpacing}
          scannerType={config.scannerType}
        />
      </div>

      {/* Fullscreen Vertical Scanning Laser Line Overlay */}
      <ScanningOverlay isScanning={status === 'scanning'} />

      {/* Grand Event Title Banner (Customizable Text & Size) */}
      <AnimatePresence>
        {status === 'activated' && (
          <motion.div
            key="event-announcement-banner"
            initial={{ opacity: 0, scale: 0.7, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
            className="absolute top-8 sm:top-14 z-35 flex flex-col items-center pointer-events-none px-4 max-w-5xl w-full text-center"
          >
            {/* Top Glowing Status Badge */}
            {config.topBadge && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/60 bg-amber-950/70 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.5)] mb-2.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="font-['Orbitron'] font-bold text-xs sm:text-sm text-amber-300 tracking-[0.3em] uppercase">
                  {config.topBadge}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </motion.div>
            )}

            {/* Main Grand Title with Scalable Font Size */}
            <div className="relative px-6 py-3 sm:px-10 sm:py-4 rounded-2xl bg-black/85 backdrop-blur-2xl border-2 border-amber-400/80 shadow-[0_0_55px_rgba(245,158,11,0.5),inset_0_0_30px_rgba(245,158,11,0.2)]">
              {/* Corner Cyber Accents */}
              <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-300" />
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-300" />
              <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-300" />
              <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-300" />

              <motion.h1
                style={{
                  fontSize: `clamp(1.5rem, ${2.5 * config.topTextScale}vw + 1rem, ${4.5 * config.topTextScale}rem)`,
                }}
                animate={{
                  textShadow: [
                    '0 0 20px #f59e0b, 0 0 40px #f59e0b, 0 0 60px #fbbf24',
                    '0 0 35px #fbbf24, 0 0 60px #f59e0b, 0 0 90px #ffffff',
                    '0 0 20px #f59e0b, 0 0 40px #f59e0b, 0 0 60px #fbbf24',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="font-['Orbitron'] font-black text-amber-200 tracking-[0.12em] sm:tracking-[0.18em] uppercase leading-tight"
              >
                {config.topTitle || 'INSERT YOUR TEXT'}
              </motion.h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center / Bottom Floating Interactive Text Controller (Scalable & Customizable) */}
      <div className="absolute bottom-8 sm:bottom-12 z-30 flex flex-col items-center pointer-events-auto px-4">
        <AnimatePresence mode="wait">
          {/* Customizable Idle & Scanning Bottom Text */}
          {(status === 'idle' || status === 'scanning') && (
            <motion.div
              key="prompt-tempelkan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={
                  status === 'idle'
                    ? { opacity: [0.8, 1, 0.8], scale: [0.98, 1.02, 0.98] }
                    : status === 'pressing'
                      ? { opacity: [1, 0.7, 1], scale: [1, 1.05, 1], filter: ['drop-shadow(0 0 15px rgba(0,229,255,0.8))', 'drop-shadow(0 0 35px rgba(251,191,36,0.8))', 'drop-shadow(0 0 15px rgba(0,229,255,0.8))'] }
                      : { opacity: 1, scale: 1.05 }
                }
                transition={
                  status === 'pressing' 
                    ? { repeat: Infinity, duration: 0.5, ease: "easeInOut" } 
                    : { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
                }
                className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-full border-2 border-cyan-400/80 bg-black/80 backdrop-blur-xl shadow-[0_0_35px_rgba(0,229,255,0.5),inset_0_0_20px_rgba(0,229,255,0.2)] cursor-pointer"
              >
                <span
                  style={{
                    fontSize: `clamp(1.0rem, ${1.25 * config.bottomTextScale}vw + 0.5rem, ${2.2 * config.bottomTextScale}rem)`,
                  }}
                  className={`font-['Orbitron'] font-extrabold tracking-[0.25em] uppercase transition-colors duration-300 text-cyan-300 drop-shadow-[0_0_12px_rgba(0,229,255,0.9)]`}
                >
                  {status === 'scanning'
                    ? config.bottomScanningText || 'MEMINDAI...'
                    : config.bottomIdleText || 'insert your text'}
                </span>
              </motion.div>

              {/* Progress bar and Percentage during scan */}
              {status === 'scanning' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-48 sm:w-64 h-2 bg-slate-900/90 rounded-full border border-cyan-500/40 overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-sky-300 to-blue-500 transition-all duration-75"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="font-['Orbitron'] font-bold text-cyan-400 tracking-wider text-sm sm:text-base animate-pulse">
                    {Math.floor(scanProgress)}%
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Alarm Active Controller with Countdown & Customizable Stop Text */}
          {status === 'activated' && (
            <motion.div
              key="prompt-activated"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                id="btn-reset-siren"
                onClick={handleReset}
                style={{
                  fontSize: `clamp(0.9rem, ${1.1 * config.bottomTextScale}vw + 0.4rem, ${1.6 * config.bottomTextScale}rem)`,
                }}
                className="px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl border-2 border-rose-500 bg-rose-950/85 hover:bg-rose-900 text-rose-200 font-['Orbitron'] font-bold tracking-widest uppercase shadow-[0_0_45px_rgba(244,63,94,0.85)] transition-all duration-200 flex items-center gap-3 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 text-rose-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span>
                  {config.stopButtonText || 'insert your text'} ({countdown}s)
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alarm Screen Flashing Effect when Activated */}
      {status === 'activated' && (
        <motion.div
          animate={{ opacity: [0.15, 0.45, 0.15] }}
          transition={{ repeat: Infinity, duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 border-4 sm:border-8 border-rose-500 pointer-events-none z-20 shadow-[inset_0_0_80px_rgba(244,63,94,0.6)] mix-blend-screen"
        />
      )}

      {/* Full Customization Control Modal */}
      <CustomizationModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onResetDefault={handleResetDefault}
      />
    </main>
  );
}
