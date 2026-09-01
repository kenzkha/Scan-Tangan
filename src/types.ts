export type ScanStatus = 'idle' | 'scanning' | 'activated';

export type SirenSoundType = 
  | 'school_alarm' 
  | 'cyber_scifi' 
  | 'euro_twotone' 
  | 'nuclear_pulsar' 
  | 'majestic_chime'
  | 'custom_upload';

export interface AppCustomConfig {
  // 1. Hand scale (0.5 to 2.0)
  handScale: number;
  
  // 2. Text font scales (0.5 to 2.5)
  topTextScale: number;
  bottomTextScale: number;
  
  // 3. Background image & overlay
  bgType: 'default' | 'matrix' | 'space' | 'grid' | 'custom';
  customBgUrl: string;
  bgDarkness: number; // 0 to 90%
  
  // 4. Siren Sound
  sirenType: SirenSoundType;
  customAudioUrl?: string;
  customAudioName?: string;
  
  // 5. Number of hands (1 to 5)
  handCount: number;
  
  // 6. Siren duration (seconds: 3 to 60)
  sirenDuration: number;
  
  // 7. Scan duration (seconds: 0.2 to 6.0)
  scanDuration: number;
  
  // 8. Custom text labels
  topTitle: string;
  topBadge: string;
  bottomIdleText: string;
  bottomScanningText: string;
  stopButtonText: string;
}

export const DEFAULT_CONFIG: AppCustomConfig = {
  handScale: 1.0,
  topTextScale: 1.0,
  bottomTextScale: 1.0,
  bgType: 'default',
  customBgUrl: '',
  bgDarkness: 30,
  sirenType: 'school_alarm',
  handCount: 1,
  sirenDuration: 10,
  scanDuration: 0.6,
  topTitle: 'INSERT YOUR TEXT',
  topBadge: 'INSERT YOUR TEXT',
  bottomIdleText: 'insert your text',
  bottomScanningText: 'insert your text',
  stopButtonText: 'insert your text',
};
