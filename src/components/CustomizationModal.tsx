import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  Maximize2,
  Type,
  Image as ImageIcon,
  Volume2,
  Users,
  Timer,
  RotateCcw,
  Upload,
  Play,
  Square,
  Sparkles,
  Check,
  Zap,
} from 'lucide-react';
import { AppCustomConfig, SirenSoundType, DEFAULT_CONFIG } from '../types';
import { soundEngine } from '../utils/audio';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppCustomConfig;
  onUpdateConfig: (newConfig: AppCustomConfig) => void;
  onResetDefault: () => void;
}

type TabType = 'display' | 'text' | 'sound' | 'timing' | 'background';

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetDefault,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('display');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Handle local state updates
  const updateField = <K extends keyof AppCustomConfig>(field: K, value: AppCustomConfig[K]) => {
    onUpdateConfig({
      ...config,
      [field]: value,
    });
  };

  // Background Image Upload
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateConfig({
          ...config,
          bgType: 'custom',
          customBgUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Custom Siren Audio Upload
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await soundEngine.loadCustomAudioFromDataUrl(dataUrl);
        onUpdateConfig({
          ...config,
          sirenType: 'custom_upload',
          customAudioUrl: dataUrl,
          customAudioName: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Test play current siren
  const handleTogglePreviewSound = () => {
    if (isPlayingPreview) {
      soundEngine.stopAlarmAudio();
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      soundEngine.startAlarmAudio(4, config.sirenType, config.customAudioUrl, () => {
        setIsPlayingPreview(false);
      });
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'display', label: 'Tangan & Jumlah', icon: <Users className="w-4 h-4" /> },
    { id: 'text', label: 'Teks & Ukuran', icon: <Type className="w-4 h-4" /> },
    { id: 'background', label: 'Background', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'sound', label: 'Suara Sirine', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'timing', label: 'Durasi Scan & Alarm', icon: <Timer className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#070e18] border border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(0,229,255,0.25)] overflow-hidden text-slate-100"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/25 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-['Orbitron'] font-bold text-lg sm:text-xl text-cyan-300 tracking-wider uppercase">
                    Pengaturan Kustomisasi
                  </h2>
                  <p className="text-xs text-cyan-400/60">
                    Sesuaikan ukuran tangan, teks, latar belakang, suara, dan durasi acara
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onResetDefault}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 bg-slate-900/80 text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Kembalikan semua ke default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Default</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg border border-slate-700 hover:border-rose-500/60 bg-slate-900/80 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-cyan-500/20 bg-black/25 overflow-x-auto no-scrollbar px-3 pt-2 gap-1.5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-['Orbitron'] text-xs sm:text-sm tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950/60 border-t-2 border-x-2 border-cyan-400 text-cyan-300 shadow-[0_-5px_15px_rgba(0,229,255,0.15)] font-bold'
                        : 'border-b-2 border-transparent text-slate-400 hover:text-cyan-300 hover:bg-white/5'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm">
              {/* TAB 1: TANGAN & JUMLAH TANGAN */}
              {activeTab === 'display' && (
                <div className="space-y-6">
                  {/* Pilihan Grafis Scanner */}
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                    <label className="font-['Orbitron'] font-semibold text-cyan-300 block">
                      Bentuk Grafis Pemindai (Scanner Type)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'hand', label: 'Telapak Tangan', desc: 'Pemindai biometrik tangan' },
                        { id: 'fingerprint', label: 'Sidik Jari', desc: 'Pemindai biometrik sidik jari' },
                        { id: 'button', label: 'Tombol Futuristik', desc: 'Tombol siber bundar' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => updateField('scannerType', item.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            config.scannerType === item.id
                              ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-semibold text-xs sm:text-sm text-cyan-300 flex items-center justify-between">
                            <span>{item.label}</span>
                            {config.scannerType === item.id && <Check className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jumlah Tangan (1 - 5) */}
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-['Orbitron'] font-semibold text-cyan-300 flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        Jumlah Pemindai: <span className="text-amber-300 font-bold">{config.handCount}</span>
                      </label>
                      <span className="text-xs text-cyan-400/60">Untuk peresmian bersama / VIP</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((count) => (
                        <button
                          key={count}
                          onClick={() => updateField('handCount', count)}
                          className={`py-2.5 rounded-lg border font-['Orbitron'] font-bold text-center transition-all cursor-pointer ${
                            config.handCount === count
                              ? 'border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-105'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'
                          }`}
                        >
                          <div className="text-base sm:text-lg">{count}</div>
                          <div className="text-[10px] text-cyan-400/70">{count === 1 ? 'Tunggal' : `${count} Orang`}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jarak Antar Pemindai */}
                  {config.handCount > 1 && (
                    <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-['Orbitron'] font-semibold text-cyan-300 flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-cyan-400" />
                          Jarak Antar Pemindai: <span className="text-amber-300 font-bold">{config.handSpacing}rem</span>
                        </label>
                        <div className="flex gap-1.5">
                          {[1.0, 2.0, 3.0, 4.0].map((s) => (
                            <button
                              key={s}
                              onClick={() => updateField('handSpacing', s)}
                              className={`px-2 py-1 text-[11px] rounded border ${
                                config.handSpacing === s
                                  ? 'border-cyan-400 bg-cyan-900/60 text-cyan-200'
                                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-300'
                              }`}
                            >
                              {s}r
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={config.handSpacing}
                        onChange={(e) => updateField('handSpacing', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Rapat (0)</span>
                        <span>Standar (2)</span>
                        <span>Lebar (8)</span>
                      </div>
                    </div>
                  )}

                  {/* Skala Ukuran Tangan */}
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-['Orbitron'] font-semibold text-cyan-300 flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-cyan-400" />
                        Ukuran Pemindai: <span className="text-amber-300 font-bold">{Math.round(config.handScale * 100)}%</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[0.7, 1.0, 1.25, 1.5, 1.8].map((s) => (
                          <button
                            key={s}
                            onClick={() => updateField('handScale', s)}
                            className={`px-2 py-1 text-[11px] rounded border ${
                              config.handScale === s
                                ? 'border-cyan-400 bg-cyan-900/60 text-cyan-200'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-300'
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={config.handScale}
                      onChange={(e) => updateField('handScale', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Kecil (50%)</span>
                      <span>Standar (100%)</span>
                      <span>Besar (200%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TEKS & UKURAN TEKS */}
              {activeTab === 'text' && (
                <div className="space-y-5">
                  {/* Tulisan Atas (Judul Peresmian) */}
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                    <label className="font-['Orbitron'] font-semibold text-cyan-300 block">
                      Tulisan Utama Atas (Setelah Scan Selesai)
                    </label>
                    <input
                      type="text"
                      value={config.topTitle}
                      onChange={(e) => updateField('topTitle', e.target.value)}
                      placeholder="insert your text"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-cyan-500/40 bg-black/70 text-amber-300 font-['Orbitron'] font-bold text-base focus:outline-none focus:border-amber-400 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                    />

                    <div className="flex items-center gap-3 pt-1">
                      <label className="text-xs text-slate-400 whitespace-nowrap">Badge Atas:</label>
                      <input
                        type="text"
                        value={config.topBadge}
                        onChange={(e) => updateField('topBadge', e.target.value)}
                        placeholder="insert your text"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-black/50 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Skala Ukuran Tulisan Atas */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">Ukuran Huruf Tulisan Atas:</span>
                        <span className="text-amber-300 font-mono font-bold">
                          {Math.round(config.topTextScale * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="2.0"
                        step="0.05"
                        value={config.topTextScale}
                        onChange={(e) => updateField('topTextScale', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                  </div>

                  {/* Tulisan Bawah (Tombol / Prompt) */}
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                    <label className="font-['Orbitron'] font-semibold text-cyan-300 block">
                      Tulisan Bawah (Saat Siaga & Memindai)
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Saat Siaga (Idle):</label>
                        <input
                          type="text"
                          value={config.bottomIdleText}
                          onChange={(e) => updateField('bottomIdleText', e.target.value)}
                          placeholder="insert your text"
                          className="w-full px-3 py-2 rounded-lg border border-cyan-500/30 bg-black/60 text-cyan-300 font-['Orbitron'] text-sm focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Saat Memindai (Scanning):</label>
                        <input
                          type="text"
                          value={config.bottomScanningText}
                          onChange={(e) => updateField('bottomScanningText', e.target.value)}
                          placeholder="insert your text"
                          className="w-full px-3 py-2 rounded-lg border border-cyan-500/30 bg-black/60 text-sky-300 font-['Orbitron'] text-sm focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs text-slate-400 block mb-1">Teks Tombol Matikan Alarm:</label>
                      <input
                        type="text"
                        value={config.stopButtonText}
                        onChange={(e) => updateField('stopButtonText', e.target.value)}
                        placeholder="insert your text"
                        className="w-full px-3 py-2 rounded-lg border border-rose-500/30 bg-black/60 text-rose-300 font-['Orbitron'] text-sm focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    {/* Skala Ukuran Tulisan Bawah */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">Ukuran Huruf Tulisan Bawah:</span>
                        <span className="text-cyan-300 font-mono font-bold">
                          {Math.round(config.bottomTextScale * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="2.0"
                        step="0.05"
                        value={config.bottomTextScale}
                        onChange={(e) => updateField('bottomTextScale', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BACKGROUND */}
              {activeTab === 'background' && (
                <div className="space-y-5">
                  {/* Preset Backgrounds */}
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                    <label className="font-['Orbitron'] font-semibold text-cyan-300 block">
                      Pilihan Tema Background
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'default', label: 'Cyber Lab Cyan', desc: 'Aura pendaran neon lab' },
                        { id: 'matrix', label: 'Matrix Grid', desc: 'Jaringan kisi futuristik' },
                        { id: 'space', label: 'Deep Space Nebula', desc: 'Bintang & galaksi kosmik' },
                        { id: 'grid', label: 'Dark Hexagon Mesh', desc: 'Panel sarang lebah hi-tech' },
                        { id: 'custom', label: 'Gambar Kustom', desc: 'Upload foto / masukkan URL' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => updateField('bgType', item.id as AppCustomConfig['bgType'])}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            config.bgType === item.id
                              ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-semibold text-xs sm:text-sm text-cyan-300 flex items-center justify-between">
                            <span>{item.label}</span>
                            {config.bgType === item.id && <Check className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Background Upload & URL */}
                  {config.bgType === 'custom' && (
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 space-y-3">
                      <label className="font-['Orbitron'] font-semibold text-amber-300 block">
                        Upload atau Masukkan URL Gambar Latar Belakang
                      </label>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-lg border border-amber-400/50 bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 flex items-center justify-center gap-2 font-medium text-xs transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Pilih File Gambar</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBgImageUpload}
                          className="hidden"
                        />

                        <input
                          type="text"
                          placeholder="Atau tempel URL gambar (https://...)"
                          value={config.customBgUrl}
                          onChange={(e) => updateField('customBgUrl', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-cyan-500/30 bg-black/70 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {config.customBgUrl && (
                        <div className="relative h-28 rounded-lg overflow-hidden border border-slate-700">
                          <img
                            src={config.customBgUrl}
                            alt="Custom Background Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs text-slate-200 font-mono">
                            Preview Background Terpasang
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Background Darkness Slider */}
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Tingkat Kegelapan / Dimmer Background:</span>
                      <span className="text-cyan-300 font-mono font-bold">{config.bgDarkness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={config.bgDarkness}
                      onChange={(e) => updateField('bgDarkness', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Terang (0%)</span>
                      <span>Seimbang (30%)</span>
                      <span>Gelap Pekat (90%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SUARA SIRINE */}
              {activeTab === 'sound' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-['Orbitron'] font-semibold text-cyan-300 block">
                        Pilihan Suara Sirine Alarm
                      </label>
                      <button
                        onClick={handleTogglePreviewSound}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isPlayingPreview
                            ? 'border-rose-400 bg-rose-950 text-rose-200 animate-pulse'
                            : 'border-cyan-400 bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900'
                        }`}
                      >
                        {isPlayingPreview ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>Stop Tes</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Tes Suara</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Siren Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          id: 'school_alarm',
                          name: 'Sirene Resmi / Sekolah',
                          desc: 'Suara sirine alarm audio asli berkualitas tinggi',
                          badge: 'Audio File',
                        },
                        {
                          id: 'cyber_scifi',
                          name: 'Sirine Cyber Sci-Fi',
                          desc: 'Dual oscillator sweep synth futuristik berfrekuensi tinggi',
                          badge: 'Synthesizer',
                        },
                        {
                          id: 'euro_twotone',
                          name: 'Sirine Euro Two-Tone',
                          desc: 'Alarm darurat bergantian nada tinggi & rendah',
                          badge: 'Klaxon',
                        },
                        {
                          id: 'nuclear_pulsar',
                          name: 'Sirine Nuklir Pulsar',
                          desc: 'Dentuman bass rendah berdenyut cepat yang mendalam',
                          badge: 'Sub-Bass',
                        },
                        {
                          id: 'majestic_chime',
                          name: 'Chime Peresmian Megah',
                          desc: 'Kombinasi akord nada megah untuk seremoni resmi',
                          badge: 'Grand Chime',
                        },
                        {
                          id: 'custom_upload',
                          name: 'Upload Suara Sendiri',
                          desc: config.customAudioName
                            ? `File aktif: ${config.customAudioName}`
                            : 'Pilih file audio MP3 / WAV dari perangkat Anda',
                          badge: 'Custom',
                        },
                      ].map((item) => {
                        const isSelected = config.sirenType === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              updateField('sirenType', item.id as SirenSoundType);
                              if (isPlayingPreview) {
                                soundEngine.stopAlarmAudio();
                                setIsPlayingPreview(false);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-950/80 text-cyan-100 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs sm:text-sm text-cyan-300">
                                {item.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 bg-black/40 text-cyan-400 font-mono">
                                {item.badge}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">{item.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Audio Upload Button */}
                  {config.sirenType === 'custom_upload' && (
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 space-y-3">
                      <label className="font-['Orbitron'] font-semibold text-amber-300 block">
                        Upload File Audio Sirine Kustom (MP3 / WAV)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => audioInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-lg border border-amber-400/60 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Pilih File Suara (MP3/WAV)</span>
                        </button>
                        <input
                          ref={audioInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioUpload}
                          className="hidden"
                        />
                        {config.customAudioName && (
                          <span className="text-xs text-emerald-400 font-mono">
                            ✓ {config.customAudioName}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: DURASI SCAN & DURASI SIRINE */}
              {activeTab === 'timing' && (
                <div className="space-y-5">
                  {/* Durasi Suara Sirine (detik) */}
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-['Orbitron'] font-semibold text-cyan-300 flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                        Durasi Suara Sirine: <span className="text-rose-400 font-bold">{config.sirenDuration} Detik</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[5, 10, 15, 20, 30].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => updateField('sirenDuration', sec)}
                            className={`px-2 py-1 text-[11px] rounded border font-mono ${
                              config.sirenDuration === sec
                                ? 'border-rose-400 bg-rose-950/80 text-rose-200'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-300'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="3"
                      max="60"
                      step="1"
                      value={config.sirenDuration}
                      onChange={(e) => updateField('sirenDuration', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Singkat (3s)</span>
                      <span>Standar (10s)</span>
                      <span>Panjang (60s)</span>
                    </div>
                  </div>

                  {/* Durasi Scan Tangan (detik) */}
                  <div className="p-4 rounded-xl border border-cyan-500/25 bg-black/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-['Orbitron'] font-semibold text-cyan-300 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-cyan-400" />
                        Kecepatan Pemindaian Tangan: <span className="text-amber-300 font-bold">{config.scanDuration}s</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[
                          { label: 'Kilat (0.3s)', val: 0.3 },
                          { label: 'Cepat (0.6s)', val: 0.6 },
                          { label: 'Normal (1.2s)', val: 1.2 },
                          { label: 'Dramatis (2.5s)', val: 2.5 },
                        ].map((item) => (
                          <button
                            key={item.val}
                            onClick={() => updateField('scanDuration', item.val)}
                            className={`px-2 py-1 text-[11px] rounded border ${
                              config.scanDuration === item.val
                                ? 'border-amber-400 bg-amber-950/80 text-amber-200'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-300'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0.2"
                      max="5.0"
                      step="0.1"
                      value={config.scanDuration}
                      onChange={(e) => updateField('scanDuration', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Instan (0.2s)</span>
                      <span>Cepat (0.6s)</span>
                      <span>Dramatis (5.0s)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-500/25 bg-black/40">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Pengaturan otomatis disimpan langsung</span>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-cyan-400/80 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-['Orbitron'] font-bold text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
