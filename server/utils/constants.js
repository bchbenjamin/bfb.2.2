// Spatial buffer check parameters
export const SPATIAL_BUFFER_RADIUS = 500; // meters
export const SPATIAL_THRESHOLD = 5; // number of complaints to trigger alert
export const SPATIAL_WINDOW_HOURS = 3; // time window for clustering

// Verification deadline
export const VERIFICATION_WINDOW_HOURS = 24;

// Grievance statuses
export const STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED_PENDING: 'resolved_pending',
  RESOLVED_FINAL: 'resolved_final',
  REOPENED: 'reopened',
};

// Default AI values (fallback when Gemini fails)
export const AI_DEFAULTS = {
  category: 'Other',
  subcategory: 'Uncategorized',
  priority: 3,
  detected_location: null,
};

// Categories for reference
export const CATEGORIES = [
  'Roads & Footpaths',
  'Water Supply',
  'Sewage & Drainage',
  'Garbage & Waste',
  'Street Lighting',
  'Parks & Open Spaces',
  'Encroachment',
  'Noise Pollution',
  'Traffic & Signals',
  'Public Transport (BMTC/Metro)',
  'Building Violations',
  'Other',
];
