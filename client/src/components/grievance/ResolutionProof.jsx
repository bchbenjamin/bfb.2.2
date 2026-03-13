import { useTranslation } from 'react-i18next';
import { Camera, CheckCircle } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

export default function ResolutionProof({ proof }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-outline-variant/50 overflow-hidden">
      <div className="px-4 py-3 bg-surface-container flex items-center justify-between">
        <span className="text-sm font-medium text-on-surface flex items-center gap-2">
          <Camera size={16} />
          Resolution Proof
        </span>
        {proof.ai_match_score != null && (
          <Badge color={proof.ai_match_score > 0.6 ? 'success' : 'warning'}>
            AI Match: {Math.round(proof.ai_match_score * 100)}%
          </Badge>
        )}
      </div>
      <img
        src={proof.photo_url}
        alt="Resolution proof"
        className="w-full max-h-60 object-cover"
      />
      <div className="px-4 py-3 flex items-center justify-between text-sm">
        <span className="text-on-surface-variant">
          By {proof.officer_name} &mdash; {new Date(proof.created_at).toLocaleDateString()}
        </span>
        {proof.citizen_verified && (
          <span className="text-success flex items-center gap-1">
            <CheckCircle size={14} /> Citizen Verified
          </span>
        )}
      </div>
    </div>
  );
}
