import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Filter } from 'lucide-react';
import { apiFetch } from '../api/client.js';
import GrievanceMap from '../components/map/GrievanceMap.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { CATEGORIES } from '../utils/categories.js';

export default function HomePage() {
  const { t } = useTranslation();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    apiFetch('/api/grievances/map')
      .then(setGrievances)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? grievances.filter(g => g.ai_category === filter)
    : grievances;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] relative">
      <GrievanceMap grievances={filtered} />

      {/* Floating filter controls */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Button
          variant={showFilters ? 'filled' : 'outlined'}
          size="sm"
          onClick={() => setShowFilters(s => !s)}
          className="bg-surface shadow-lg"
        >
          <Filter size={16} />
          {t('common.filter')}
          {filter && <span className="ml-1 text-xs bg-primary text-on-primary rounded-full px-1.5">{1}</span>}
        </Button>

        {showFilters && (
          <div className="mt-2 bg-surface rounded-2xl shadow-lg border border-outline-variant/50 p-3 max-h-80 overflow-y-auto w-56">
            <button
              onClick={() => { setFilter(''); setShowFilters(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                !filter ? 'bg-primary-container text-primary font-medium' : 'hover:bg-on-surface/5 text-on-surface'
              }`}
            >
              {t('common.all')}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => { setFilter(cat.key); setShowFilters(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${
                  filter === cat.key ? 'bg-primary-container text-primary font-medium' : 'hover:bg-on-surface/5 text-on-surface'
                }`}
              >
                <span>{cat.icon}</span>
                {t(`categories.${cat.key}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grievance count badge */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="bg-surface rounded-full shadow-lg px-4 py-2 border border-outline-variant/50 text-sm font-medium text-on-surface">
          {filtered.length} {t('common.filter').toLowerCase() === 'filter' ? 'issues' : ''}
        </div>
      </div>

      {/* FAB to file new grievance */}
      <Link to="/file" className="absolute bottom-6 right-6 z-[1000]">
        <Button variant="filled" size="lg" className="shadow-xl">
          <Plus size={20} />
          {t('nav.file')}
        </Button>
      </Link>
    </div>
  );
}
