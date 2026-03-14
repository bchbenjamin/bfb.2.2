import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer } from 'react-leaflet';
import { BarChart3, AlertCircle, CheckCircle, Clock, Layers, Users, MapPin, Bell, Filter, Activity } from 'lucide-react';
import L from 'leaflet';
import { apiFetch } from '../api/client.js';
import StatsCard from '../components/dashboard/StatsCard.jsx';
import AlertBanner from '../components/dashboard/AlertBanner.jsx';
import CategoryChart from '../components/dashboard/CategoryChart.jsx';
import HeatmapLayer from '../components/map/HeatmapLayer.jsx';
import StatusMarkers from '../components/map/StatusMarkers.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import Card from '../components/ui/Card.jsx';
import { BENGALURU_CENTER, TILE_URLS, TILE_ATTRIBUTION } from '../utils/constants.js';
import { CATEGORIES } from '../utils/categories.js';
import { getStatusColor, getPriorityColor } from '../utils/statusColors.js';

const WARDS = [
  'Koramangala', 'Indiranagar', 'Jayanagar', 'Malleshwaram', 'Shivajinagar',
  'Chickpete', 'JP Nagar', 'BTM Layout', 'Basavanagudi', 'Whitefield',
  'Yelahanka', 'HSR Layout', 'Rajajinagar', 'Majestic',
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [adminStats, setAdminStats] = useState(null);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [heatData, setHeatData] = useState([]);
  const [mapData, setMapData] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAlertToast, setShowAlertToast] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterCategory, filterWard, filterStatus, filterUrgency]);

  async function fetchData() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ sort: 'impact', limit: '50' });
      if (filterStatus) params.set('status', filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      if (filterWard) params.set('ward', filterWard);

      const [adminStatsData, statsData, alertsData, grievancesData, heatmapData, mapMarkers] = await Promise.all([
        apiFetch('/api/dashboard/admin-stats'),
        apiFetch('/api/dashboard/stats'),
        apiFetch('/api/alerts'),
        apiFetch(`/api/grievances?${params.toString()}`),
        apiFetch('/api/dashboard/heatmap'),
        apiFetch('/api/grievances/map'),
      ]);

      setAdminStats(adminStatsData);
      setStats(statsData);
      setAlerts(alertsData);
      setGrievances(grievancesData.grievances || []);
      setHeatData(heatmapData);
      setMapData(mapMarkers);

      // Show alert toast on first load if there are undismissed alerts
      if (alertsData.length > 0) {
        setShowAlertToast(true);
        setTimeout(() => setShowAlertToast(false), 5000);
      }
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function dismissAlert(alertId) {
    try {
      await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error(err);
    }
  }

  const filteredGrievances = grievances.filter(g => {
    if (filterUrgency && String(g.ai_priority) !== filterUrgency) return false;
    return true;
  });

  const activeFilterCount = [filterCategory, filterWard, filterStatus, filterUrgency].filter(Boolean).length;

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  function timeSince(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 py-6 space-y-6">
      {/* Alert toast notification */}
      {showAlertToast && alerts.length > 0 && (
        <div className="fixed top-20 right-4 z-[2000] animate-in slide-in-from-right">
          <div className="p-4 rounded-2xl shadow-xl border max-w-sm"
            style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)', borderColor: '#dc2626' }}>
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-red-300" />
              <div>
                <p className="font-semibold text-white">⚠️ {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}</p>
                <p className="text-red-200 text-sm mt-0.5">{alerts[0]?.message?.slice(0, 80)}...</p>
              </div>
              <button onClick={() => setShowAlertToast(false)} className="text-red-300 hover:text-white ml-2">✕</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t('dashboard.title')}</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">BBMP Grievance Management</p>
        </div>
        {alerts.length > 0 && (
          <div className="relative">
            <Bell size={24} className="text-on-surface-variant" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {alerts.length}
            </span>
          </div>
        )}
      </div>

      {/* Stats row — using admin-stats endpoint */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard label={t('dashboard.total')} value={adminStats?.total} icon={BarChart3} color="info" />
        <StatsCard label={t('dashboard.open')} value={adminStats?.open_count} icon={AlertCircle} color="warning" />
        <StatsCard label="In Progress" value={adminStats?.in_progress_count} icon={Activity} color="primary" />
        <StatsCard label="Resolved Today" value={adminStats?.resolved_today} icon={CheckCircle} color="success" />
        <StatsCard
          label={t('dashboard.avg_time')}
          value={adminStats?.avg_resolution_hours ? `${adminStats.avg_resolution_hours}h` : '—'}
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
        {/* Map with color-coded markers */}
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
              {showHeatmap ? (
                <HeatmapLayer data={heatData} visible={true} />
              ) : (
                <StatusMarkers grievances={mapData} />
              )}
            </MapContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Unresolved</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> In Progress</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Resolved</span>
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

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant={showFilters ? 'filled' : 'outlined'}
          size="sm"
          onClick={() => setShowFilters(s => !s)}
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 w-5 h-5 bg-primary text-on-primary rounded-full text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setFilterCategory(''); setFilterWard(''); setFilterStatus(''); setFilterUrgency(''); }}
            className="text-sm text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Category</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-variant text-on-surface border border-outline-variant text-sm focus:border-primary focus:outline-none">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.key}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Ward</label>
              <select value={filterWard} onChange={e => setFilterWard(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-variant text-on-surface border border-outline-variant text-sm focus:border-primary focus:outline-none">
                <option value="">All Wards</option>
                {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-variant text-on-surface border border-outline-variant text-sm focus:border-primary focus:outline-none">
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved_pending">Pending Verification</option>
                <option value="resolved_final">Resolved</option>
                <option value="reopened">Reopened</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Urgency</label>
              <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-variant text-on-surface border border-outline-variant text-sm focus:border-primary focus:outline-none">
                <option value="">All Urgency</option>
                <option value="5">Critical (5)</option>
                <option value="4">Urgent (4)</option>
                <option value="3">High (3)</option>
                <option value="2">Moderate (2)</option>
                <option value="1">Low (1)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Impact-sorted grievances */}
      <div>
        <h2 className="font-semibold text-on-surface mb-3">
          Grievances by Impact ({filteredGrievances.length})
        </h2>
        <div className="space-y-3">
          {filteredGrievances.map(g => {
            const status = getStatusColor(g.status);
            const priority = getPriorityColor(g.ai_priority);
            return (
              <div key={g.id}
                onClick={() => navigate(`/grievance/${g.id}`)}
                className="p-4 bg-surface-variant rounded-2xl border border-outline-variant/50 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-medium text-on-surface line-clamp-1 flex-1">
                    {g.title || g.raw_description?.slice(0, 80)}
                  </h3>
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">{timeSince(g.created_at)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className={`${status.bg} ${status.text}`}>{t(`status.${g.status}`)}</Badge>
                  <Badge className={`${priority.bg} ${priority.text}`}>{t(`priority_labels.${g.ai_priority}`)}</Badge>
                  {g.ai_category && <Badge color="primary">{g.ai_category}</Badge>}
                </div>
                <div className="flex items-center justify-between text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1"><MapPin size={14} />{g.ward || g.ai_detected_location || 'Bengaluru'}</span>
                  <span className="flex items-center gap-1 font-semibold text-primary"><Users size={14} />{g.impact_count} affected</span>
                </div>
              </div>
            );
          })}
          {filteredGrievances.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-on-surface-variant">No grievances match the selected filters.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
