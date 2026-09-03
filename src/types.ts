export type ScanStatus = 'idle' | 'pressing' | 'scanning' | 'activated';

export type SirenSoundType = 
  | 'school_alarm' 
  | 'cyber_scifi' 
  | 'euro_twotone' 
  | 'nuclear_pulsar' 
  | 'majestic_chime'
  | 'custom_upload';

export type ScannerGraphicType = 'hand' | 'fingerprint' | 'button';

export interface AppCustomConfig {
  // 1. Scanner Graphic Type
  scannerType: ScannerGraphicType;
  
  // 2. Scanner Scale (0.5 to 2.0)
  handScale: number;
  
  // 3. Number of scanners (1 to 5)
  handCount: number;
  
  // 4. Spacing between scanners
  handSpacing: number;

  // 5. Text font scales (0.5 to 2.5)
  topTextScale: number;
  bottomTextScale: number;
  
  // 6. Background image & overlay
  bgType: 'default' | 'matrix' | 'space' | 'grid' | 'custom';
  customBgUrl: string;
  bgDarkness: number; // 0 to 90%
  
  // 7. Siren Sound
  sirenType: SirenSoundType;
  customAudioUrl?: string;
  customAudioName?: string;
  
  // 8. Siren duration (seconds: 3 to 60)
  sirenDuration: number;
  
  // 9. Scan duration (seconds: 0.2 to 6.0)
  scanDuration: number;
  
  // 10. Custom text labels
  topTitle: string;
  topBadge: string;
  bottomIdleText: string;
  bottomScanningText: string;
  stopButtonText: string;
}

export const DEFAULT_CONFIG: AppCustomConfig = {
  scannerType: 'hand',
  handScale: 1.0,
  handCount: 1,
  handSpacing: 2.0, // default spacing in rem
  topTextScale: 1.0,
  bottomTextScale: 1.0,
  bgType: 'default',
  customBgUrl: '',
  bgDarkness: 30,
  sirenType: 'school_alarm',
  sirenDuration: 10,
  scanDuration: 0.6,
  topTitle: 'INSERT YOUR TEXT',
  topBadge: 'INSERT YOUR TEXT',
  bottomIdleText: 'insert your text',
  bottomScanningText: 'insert your text',
  stopButtonText: 'insert your text',
};
