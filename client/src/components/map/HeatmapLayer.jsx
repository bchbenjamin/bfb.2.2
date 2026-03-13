import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ data, visible }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }

    if (visible && data?.length) {
      const points = data.map(d => [d.latitude, d.longitude, (d.intensity || 3) / 5]);
      heatRef.current = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.2: '#afe67c',
          0.4: '#e5e7bb',
          0.6: '#fcd34d',
          0.8: '#f97316',
          1.0: '#dc2626',
        },
      }).addTo(map);
    }

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
      }
    };
  }, [map, data, visible]);

  return null;
}
