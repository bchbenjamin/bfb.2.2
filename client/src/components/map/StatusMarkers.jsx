import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

const STATUS_COLORS = {
  open: '#ef4444',
  assigned: '#ef4444',
  reopened: '#ef4444',
  in_progress: '#eab308',
  resolved_pending: '#22c55e',
  resolved_final: '#22c55e',
};

function createStatusIcon(status) {
  const color = STATUS_COLORS[status] || '#ef4444';
  return L.divIcon({
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

export default function StatusMarkers({ grievances }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });

    grievances.forEach(g => {
      const icon = createStatusIcon(g.status);
      const marker = L.marker([g.latitude, g.longitude], { icon });
      const popupContent = `
        <div style="min-width:180px;font-family:'Noto Sans',sans-serif;">
          <h4 style="margin:0 0 4px;font-size:13px;font-weight:600;">${g.title || 'Grievance'}</h4>
          <p style="margin:0 0 4px;font-size:11px;color:#888;">${g.ai_category || 'Uncategorized'}</p>
          <p style="margin:0 0 4px;font-size:12px;">Status: <b>${g.status?.replace('_', ' ')}</b></p>
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;">👥 ${g.impact_count} affected</p>
          <a href="/grievance/${g.id}" style="color:#2563eb;font-size:11px;text-decoration:none;font-weight:500;">
            View Details →
          </a>
        </div>
      `;
      marker.bindPopup(popupContent);
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, grievances]);

  return null;
}
