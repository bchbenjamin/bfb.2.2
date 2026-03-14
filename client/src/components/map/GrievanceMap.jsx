import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet.markercluster';
import { Users, ArrowUpRight, X } from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import { BENGALURU_CENTER, DEFAULT_ZOOM, TILE_URLS, TILE_ATTRIBUTION } from '../../utils/constants.js';
import { getCategoryInfo } from '../../utils/categories.js';
import { getStatusColor } from '../../utils/statusColors.js';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';

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

function ClusterLayer({ grievances, onMarkerClick }) {
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
      marker.on('click', () => onMarkerClick(g));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, grievances, onMarkerClick]);

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

function BottomSheet({ grievance, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [upvoting, setUpvoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [impactCount, setImpactCount] = useState(grievance.impact_count);

  const status = getStatusColor(grievance.status);
  const category = getCategoryInfo(grievance.ai_category);

  async function handleUpvote() {
    setUpvoting(true);
    try {
      const data = await apiFetch(`/api/grievances/${grievance.id}/upvote`, { method: 'POST' });
      setImpactCount(data.impact_count);
      setVoted(true);
      if (data.already_upvoted) setVoted(true);
    } catch (err) {
      console.error('Upvote failed:', err);
    } finally {
      setUpvoting(false);
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] transition-transform">
      <div className="bg-surface rounded-t-3xl shadow-2xl border-t border-outline-variant/50 p-5 max-w-lg mx-auto">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{category.icon}</span>
              <h3 className="font-semibold text-on-surface line-clamp-1 flex-1">
                {grievance.title || 'Grievance'}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge className={`${status.bg} ${status.text}`}>{t(`status.${grievance.status}`)}</Badge>
              <Badge color="primary">{grievance.ai_category}</Badge>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm text-on-surface-variant">
          <Users size={16} />
          <span className="font-semibold text-on-surface">{impactCount}</span> people affected
        </div>

        <div className="flex gap-3">
          <Button
            variant={voted ? 'filled' : 'outlined'}
            onClick={handleUpvote}
            disabled={upvoting || voted}
            className="flex-1"
          >
            <Users size={16} />
            {voted ? "You've reported this" : t('grievance.affected_too')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`/grievance/${grievance.id}`)}
            className="flex-shrink-0"
          >
            Details <ArrowUpRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function GrievanceMap({ grievances, className = '' }) {
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const handleMarkerClick = useCallback((g) => {
    setSelectedGrievance(g);
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={BENGALURU_CENTER}
        zoom={DEFAULT_ZOOM}
        className={`h-full w-full ${className}`}
        zoomControl={true}
      >
        <TileLayer url={TILE_URLS.light} attribution={TILE_ATTRIBUTION} />
        <DarkTileSwapper />
        <ClusterLayer grievances={grievances} onMarkerClick={handleMarkerClick} />
      </MapContainer>

      {selectedGrievance && (
        <BottomSheet
          grievance={selectedGrievance}
          onClose={() => setSelectedGrievance(null)}
        />
      )}
    </div>
  );
}
