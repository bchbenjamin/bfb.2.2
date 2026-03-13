import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer } from 'react-leaflet';
import { BarChart3, AlertCircle, CheckCircle, Clock, Layers } from 'lucide-react';
import { apiFetch } from '../api/client.js';
import StatsCard from '../components/dashboard/StatsCard.jsx';
import AlertBanner from '../components/dashboard/AlertBanner.jsx';
import CategoryChart from '../components/dashboard/CategoryChart.jsx';
import HeatmapLayer from '../components/map/HeatmapLayer.jsx';
import GrievanceCard from '../components/grievance/GrievanceCard.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { BENGALURU_CENTER, TILE_URLS, TILE_ATTRIBUTION } from '../utils/constants.js';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [heatData, setHeatData] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/dashboard/stats'),
      apiFetch('/api/alerts'),
      apiFetch('/api/grievances?sort=impact&limit=20'),
      apiFetch('/api/dashboard/heatmap'),
    ])
      .then(([s, a, g, h]) => {
        setStats(s);
        setAlerts(a);
        setGrievances(g.grievances);
        setHeatData(h);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function dismissAlert(alertId) {
    try {
      await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">{t('dashboard.title')}</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label={t('dashboard.total')} value={stats?.total} icon={BarChart3} color="info" />
        <StatsCard label={t('dashboard.open')} value={stats?.open} icon={AlertCircle} color="warning" />
        <StatsCard label={t('dashboard.resolved')} value={stats?.resolved} icon={CheckCircle} color="success" />
        <StatsCard
          label={t('dashboard.avg_time')}
          value={stats?.avg_hours_to_resolve ? `${stats.avg_hours_to_resolve}h` : '—'}
          icon={Clock}
          color="primary"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-on-surface flex items-center gap-2">
            <AlertCircle size={20} className="text-warning" />
            {t('dashboard.alerts')} ({alerts.length})
          </h2>
          {alerts.map(alert => (
            <AlertBanner key={alert.id} alert={alert} onDismiss={dismissAlert} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap / Map */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-on-surface">Bengaluru Overview</h2>
            <Button
              variant={showHeatmap ? 'filled' : 'outlined'}
              size="sm"
              onClick={() => setShowHeatmap(s => !s)}
            >
              <Layers size={16} />
              {showHeatmap ? t('dashboard.markers') : t('dashboard.heatmap')}
            </Button>
          </div>
          <div className="h-80 rounded-2xl overflow-hidden border border-outline-variant/50">
            <MapContainer center={BENGALURU_CENTER} zoom={12} className="h-full w-full">
              <TileLayer url={TILE_URLS.light} attribution={TILE_ATTRIBUTION} />
              <HeatmapLayer data={heatData} visible={showHeatmap} />
            </MapContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div>
          <h2 className="font-semibold text-on-surface mb-3">Category Breakdown</h2>
          <div className="bg-surface-variant rounded-2xl border border-outline-variant/50 p-5">
            <CategoryChart categories={stats?.categories} />
          </div>
        </div>
      </div>

      {/* Impact-sorted grievances */}
      <div>
        <h2 className="font-semibold text-on-surface mb-3">Top Issues by Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grievances.map(g => (
            <GrievanceCard key={g.id} grievance={g} />
          ))}
        </div>
      </div>
    </div>
  );
}
