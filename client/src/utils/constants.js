// Bengaluru center coordinates
export const BENGALURU_CENTER = [12.9716, 77.5946];
export const DEFAULT_ZOOM = 12;

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'tcy', label: 'Tulu', nativeLabel: 'ತುಳು' },
  { code: 'kok', label: 'Konkani', nativeLabel: 'कोंकणी' },
];

export const STATUS_ORDER = [
  'open',
  'assigned',
  'in_progress',
  'resolved_pending',
  'resolved_final',
  'reopened',
];

export const TILE_URLS = {
  light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
