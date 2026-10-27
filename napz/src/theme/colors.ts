export const COLORS = {
  primary: '#002FA7',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  alarm: '#FF2A2A',
  success: '#22C55E',
};

export const BUILT_IN_SOUNDS = [
  { id: 'classic', name: 'Classic', icon: 'alarm-outline' },
  { id: 'radar', name: 'Radar', icon: 'radio-outline' },
  { id: 'beacon', name: 'Beacon', icon: 'navigate-outline' },
  { id: 'gentle', name: 'Gentle', icon: 'musical-note-outline' },
  { id: 'urgent', name: 'Urgent', icon: 'warning-outline' },
];

export const SOUND_NAMES: Record<string, string> = {
  classic: 'Classic Alarm',
  radar: 'Radar Sound',
  beacon: 'Beacon',
  gentle: 'Gentle Alarm',
  urgent: 'Urgent Alarm',
  custom: 'Custom Sound',
};
