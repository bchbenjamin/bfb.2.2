import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { BENGALURU_CENTER, DEFAULT_ZOOM, TILE_URLS, TILE_ATTRIBUTION } from '../../utils/constants.js';
import { getCategoryInfo } from '../../utils/categories.js';
import GrievanceCard from '../grievance/GrievanceCard.jsx';

// Fix default marker icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createCategoryIcon(category) {
  const info = getCategoryInfo(category);
  return L.divIcon({
    html: `<div style="background:${info.color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${info.icon}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function ClusterLayer({ grievances }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });

    grievances.forEach(g => {
      const icon = createCategoryIcon(g.ai_category);
      const marker = L.marker([g.latitude, g.longitude], { icon });
      const popupContent = `
        <div style="min-width:200px;font-family:'Noto Sans',sans-serif;">
          <h4 style="margin:0 0 4px;font-size:14px;font-weight:600;">${g.title || 'Grievance'}</h4>
          <p style="margin:0 0 4px;font-size:12px;color:#666;">${g.ai_category || 'Uncategorized'}</p>
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#386a1f;">
            👥 ${g.impact_count} people affected
          </p>
          <a href="/grievance/${g.id}" style="color:#386a1f;font-size:12px;text-decoration:none;font-weight:500;">
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

function DarkTileSwapper() {
  const map = useMap();
  const [isDark, setIsDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    L.tileLayer(isDark ? TILE_URLS.dark : TILE_URLS.light, {
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);
  }, [isDark, map]);

  return null;
}

export default function GrievanceMap({ grievances, className = '' }) {
  return (
    <MapContainer
      center={BENGALURU_CENTER}
      zoom={DEFAULT_ZOOM}
      className={`h-full w-full ${className}`}
      zoomControl={true}
    >
      <TileLayer url={TILE_URLS.light} attribution={TILE_ATTRIBUTION} />
      <DarkTileSwapper />
      <ClusterLayer grievances={grievances} />
    </MapContainer>
  );
}
