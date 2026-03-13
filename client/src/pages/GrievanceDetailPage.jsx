import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { ArrowLeft, MapPin, Clock, User } from 'lucide-react';
import { apiFetch } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import GrievanceTimeline from '../components/grievance/GrievanceTimeline.jsx';
import UpvoteButton from '../components/grievance/UpvoteButton.jsx';
import MediaViewer from '../components/grievance/MediaViewer.jsx';
import ResolutionProof from '../components/grievance/ResolutionProof.jsx';
import TextToSpeech from '../components/tts/TextToSpeech.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getStatusColor, getPriorityColor } from '../utils/statusColors.js';
import { getCategoryInfo } from '../utils/categories.js';
import { TILE_URLS, TILE_ATTRIBUTION } from '../utils/constants.js';

export default function GrievanceDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    apiFetch(`/api/grievances/${id}`)
      .then(setGrievance)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleVerify(verified) {
    setActionLoading(true);
    try {
      const updated = await apiFetch(`/api/grievances/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ verified }),
      });
      setGrievance(prev => ({ ...prev, ...updated }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!grievance) return <div className="text-center py-20 text-on-surface-variant">Grievance not found</div>;

  const status = getStatusColor(grievance.status);
  const priority = getPriorityColor(grievance.ai_priority);
  const category = getCategoryInfo(grievance.ai_category);
  const isOwner = user?.id === grievance.user_id;
  const canVerify = isOwner && grievance.status === 'resolved_pending';
  const deadline = grievance.verification_deadline ? new Date(grievance.verification_deadline) : null;
  const hoursLeft = deadline ? Math.max(0, Math.round((deadline - new Date()) / 3600000)) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-4 text-sm">
        <ArrowLeft size={18} /> {t('common.back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-2xl font-bold text-on-surface">{grievance.title || 'Grievance'}</h1>
              <span className="text-2xl">{category.icon}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={`${status.bg} ${status.text}`}>{t(`status.${grievance.status}`)}</Badge>
              <Badge className={`${priority.bg} ${priority.text}`}>{t(`priority_labels.${grievance.ai_priority}`)}</Badge>
              <Badge color="primary">{t(`categories.${grievance.ai_category}`)}</Badge>
              {grievance.ai_subcategory && <Badge>{grievance.ai_subcategory}</Badge>}
            </div>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-on-surface">Description</h3>
              <TextToSpeech text={grievance.raw_description} />
            </div>
            <p className="text-on-surface-variant leading-relaxed">{grievance.raw_description}</p>
          </Card>

          {grievance.media_url && (
            <MediaViewer url={grievance.media_url} verified={grievance.media_verified} />
          )}

          {/* Mini map */}
          <Card className="overflow-hidden">
            <div className="h-48">
              <MapContainer
                center={[grievance.latitude, grievance.longitude]}
                zoom={15}
                className="h-full w-full"
                scrollWheelZoom={false}
              >
                <TileLayer url={TILE_URLS.light} attribution={TILE_ATTRIBUTION} />
                <Marker position={[grievance.latitude, grievance.longitude]} />
              </MapContainer>
            </div>
            <div className="px-4 py-2 flex items-center gap-2 text-sm text-on-surface-variant">
              <MapPin size={14} />
              {grievance.ai_detected_location || grievance.ward || `${grievance.latitude.toFixed(4)}, ${grievance.longitude.toFixed(4)}`}
            </div>
          </Card>

          {/* Resolution proofs */}
          {grievance.proofs?.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-on-surface">Resolution Proof</h3>
              {grievance.proofs.map(proof => (
                <ResolutionProof key={proof.id} proof={proof} />
              ))}
            </div>
          )}

          {/* Verify/Reopen buttons */}
          {canVerify && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 text-sm text-on-surface-variant">
                <Clock size={16} />
                {t('grievance.verification_window', { hours: hoursLeft })}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => handleVerify(true)} disabled={actionLoading} className="flex-1">
                  {t('grievance.verify')}
                </Button>
                <Button variant="danger" onClick={() => handleVerify(false)} disabled={actionLoading} className="flex-1">
                  {t('grievance.reopen')}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-5">
            <GrievanceTimeline currentStatus={grievance.status} />
          </Card>

          <Card className="p-5">
            <UpvoteButton
              grievanceId={grievance.id}
              impactCount={grievance.impact_count}
              onUpdate={(count) => setGrievance(prev => ({ ...prev, impact_count: count }))}
            />
          </Card>

          <Card className="p-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <User size={16} />
              <span>{t('grievance.filed_by')}:</span>
              <span className="font-medium text-on-surface">{grievance.user_name}</span>
            </div>
            <div className="text-on-surface-variant">
              <Clock size={14} className="inline mr-1" />
              {new Date(grievance.created_at).toLocaleString()}
            </div>
            {grievance.ward && (
              <div className="text-on-surface-variant">
                <MapPin size={14} className="inline mr-1" />
                Ward: {grievance.ward}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
