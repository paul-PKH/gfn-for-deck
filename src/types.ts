export interface GFNAvailability {
  available: boolean;
  cached: boolean;
  error?: string;
}

export interface GFNSettings {
  logoSize: number; // Size in pixels (default: 64)
  glowIntensity: number; // 0-100 (default: 50)
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'center-left' | 'center-right' | 'custom';
  customX?: number; // Custom X position in pixels (when position is 'custom')
  customY?: number; // Custom Y position in pixels (when position is 'custom')
  enabled: boolean;
  hideUnavailable: boolean; // Hide badge entirely when game is not on GFN
}

export const DEFAULT_SETTINGS: GFNSettings = {
  logoSize: 64,
  glowIntensity: 50,
  position: 'top-right',
  customX: 16,
  customY: 16,
  enabled: true,
  hideUnavailable: false,
};
