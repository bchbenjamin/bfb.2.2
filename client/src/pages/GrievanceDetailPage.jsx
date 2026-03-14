import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { ArrowLeft, MapPin, Clock, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const now = Date.now();
      const end = new Date(deadline).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hours}h ${minutes}m remaining`);
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className="flex items-center gap-1.5 text-sm font-medium">
      <Clock size={16} className="text-warning" />
      {timeLeft}
    </span>
  );
}

export default function GrievanceDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenInput, setShowReopenInput] = useState(false);

  useEffect(() => {
    apiFetch(`/api/grievances/${id}`)
      .then(setGrievance)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleVerify(verified) {
    setActionLoading(true);
    try {
      const body = { verified };
      if (!verified && reopenReason) {
        body.reason = reopenReason;
      }
      const updated = await apiFetch(`/api/grievances/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setGrievance(prev => ({ ...prev, ...updated }));
      setShowReopenInput(false);
      setReopenReason('');
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
  const canVerify = user && grievance.status === 'resolved_pending';
  const deadline = grievance.verification_deadline ? new Date(grievance.verification_deadline) : null;
  const latestProof = grievance.proofs?.[0];

  return (
    <div className="max-w-4xl mx-auto p-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-4 text-sm">
        <ArrowLeft size={18} /> {t('common.back')}
      </button>

      {/* Pending verification banner */}
      {grievance.status === 'resolved_pending' && (
        <div className="mb-6 p-4 rounded-2xl border-2"
          style={{
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(234, 179, 8, 0.15))',
            borderColor: 'rgba(234, 179, 8, 0.4)',
          }}>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={24} className="text-warning" />
            <div>
              <h3 className="font-semibold text-on-surface">
                {isOwner ? 'Officer has uploaded proof — Please verify!' : 'Pending Citizen Verification'}
              </h3>
              {deadline && <CountdownTimer deadline={deadline} />}
            </div>
          </div>
        </div>
      )}

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

          {/* Before/After Photo Comparison */}
          {grievance.status === 'resolved_pending' && latestProof && (
            <Card className="p-5">
              <h3 className="font-semibold text-on-surface mb-4">📸 Before & After Comparison</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">Before (Filed)</p>
                  {grievance.media_url ? (
                    <img src={grievance.media_url} alt="Before" className="w-full rounded-xl border border-outline-variant/50 object-cover max-h-56" />
                  ) : (
                    <div className="w-full h-48 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant text-sm border border-outline-variant/50">
                      No photo submitted
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">After (Officer Proof)</p>
                  <img src={latestProof.photo_url} alt="After" className="w-full rounded-xl border border-outline-variant/50 object-cover max-h-56" />
                  {latestProof.ai_match_score != null && (
                    <Badge color={latestProof.ai_match_score > 0.6 ? 'success' : 'warning'} className="mt-2">
                      AI Match: {Math.round(latestProof.ai_match_score * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          )}

          {grievance.media_url && grievance.status !== 'resolved_pending' && (
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

          {/* Resolution proofs (when NOT in pending verification — those are shown in before/after) */}
          {grievance.proofs?.length > 0 && grievance.status !== 'resolved_pending' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-on-surface">Resolution Proof</h3>
              {grievance.proofs.map(proof => (
                <ResolutionProof key={proof.id} proof={proof} />
              ))}
            </div>
          )}

          {/* Verify/Reopen buttons for citizen */}
          {canVerify && (
            <Card className="p-5">
              <h3 className="font-semibold text-on-surface mb-3">Verify Resolution</h3>
              {deadline && (
                <div className="mb-4">
                  <CountdownTimer deadline={deadline} />
                </div>
              )}

              {showReopenInput ? (
                <div className="space-y-3">
                  <p className="text-sm text-on-surface-variant">What's still wrong? Help the officer understand:</p>
                  <textarea
                    value={reopenReason}
                    onChange={e => setReopenReason(e.target.value)}
                    placeholder="Describe why the issue is not fixed..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-surface-variant text-on-surface border border-outline-variant focus:border-primary focus:outline-none text-sm"
                  />
                  <div className="flex gap-3">
                    <Button variant="outlined" onClick={() => setShowReopenInput(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button variant="danger" onClick={() => handleVerify(false)} disabled={actionLoading || !reopenReason.trim()} className="flex-1">
                      <XCircle size={16} /> Reopen Issue
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={() => handleVerify(true)} disabled={actionLoading} className="flex-1">
                    <CheckCircle size={16} /> Fix Looks Good
                  </Button>
                  <Button variant="danger" onClick={() => setShowReopenInput(true)} disabled={actionLoading} className="flex-1">
                    <XCircle size={16} /> Issue Not Fixed
                  </Button>
                </div>
              )}
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
              <span>{t('grievance.filed_anonymously')}</span>
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
