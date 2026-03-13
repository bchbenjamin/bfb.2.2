export const CATEGORIES = [
  { key: 'Roads & Footpaths', icon: '🛣️', color: '#8B4513' },
  { key: 'Water Supply', icon: '💧', color: '#1E90FF' },
  { key: 'Sewage & Drainage', icon: '🚰', color: '#556B2F' },
  { key: 'Garbage & Waste', icon: '🗑️', color: '#8B8000' },
  { key: 'Street Lighting', icon: '💡', color: '#FFD700' },
  { key: 'Parks & Open Spaces', icon: '🌳', color: '#228B22' },
  { key: 'Encroachment', icon: '🏗️', color: '#A0522D' },
  { key: 'Noise Pollution', icon: '🔊', color: '#FF6347' },
  { key: 'Traffic & Signals', icon: '🚦', color: '#DC143C' },
  { key: 'Public Transport (BMTC/Metro)', icon: '🚌', color: '#4169E1' },
  { key: 'Building Violations', icon: '🏢', color: '#696969' },
  { key: 'Other', icon: '📋', color: '#808080' },
];

export function getCategoryInfo(categoryName) {
  return CATEGORIES.find(c => c.key === categoryName) || CATEGORIES[CATEGORIES.length - 1];
}
