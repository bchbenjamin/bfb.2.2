import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, ArrowUpRight } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { getStatusColor, getPriorityColor } from '../../utils/statusColors.js';
import { getCategoryInfo } from '../../utils/categories.js';

export default function GrievanceCard({ grievance, compact = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = getStatusColor(grievance.status);
  const priority = getPriorityColor(grievance.ai_priority);
  const category = getCategoryInfo(grievance.ai_category);

  if (compact) {
    return (
      <div className="p-2 min-w-[200px]">
        <h4 className="font-medium text-sm text-on-surface mb-1 line-clamp-2">
          {grievance.title || grievance.raw_description?.slice(0, 60)}
        </h4>
        <div className="flex items-center gap-2 mb-2">
          <Badge className={`${status.bg} ${status.text}`}>{t(`status.${grievance.status}`)}</Badge>
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <Users size={12} /> {grievance.impact_count}
          </span>
        </div>
        <button
          onClick={() => navigate(`/grievance/${grievance.id}`)}
          className="text-primary text-xs font-medium flex items-center gap-1 hover:underline"
        >
          View Details <ArrowUpRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/grievance/${grievance.id}`)}
      className="p-4 bg-surface-variant rounded-2xl border border-outline-variant/50 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-medium text-on-surface line-clamp-2 flex-1">
          {grievance.title || grievance.raw_description?.slice(0, 80)}
        </h3>
        <span className="text-lg">{category.icon}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge className={`${status.bg} ${status.text}`}>{t(`status.${grievance.status}`)}</Badge>
        <Badge className={`${priority.bg} ${priority.text}`}>{t(`priority_labels.${grievance.ai_priority}`)}</Badge>
        {grievance.ai_category && (
          <Badge color="primary">{t(`categories.${grievance.ai_category}`)}</Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-on-surface-variant">
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {grievance.ai_detected_location || grievance.ward || 'Bengaluru'}
        </span>
        <span className="flex items-center gap-1 font-medium">
          <Users size={14} />
          {t('grievance.impact_count', { count: grievance.impact_count })}
        </span>
      </div>
    </div>
  );
}
