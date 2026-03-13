import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import GrievanceCard from '../components/grievance/GrievanceCard.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';

export default function OfficerView() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    apiFetch('/api/grievances?sort=impact&limit=50')
      .then(data => {
        const mine = data.grievances.filter(g =>
          g.officer_id === user?.id ||
          ['open', 'assigned'].includes(g.status)
        );
        setGrievances(mine);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmitProof() {
    if (!proofFile || !selectedId) return;
    setSubmitting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('proof', proofFile);
      const data = await apiFetch(`/api/grievances/${selectedId}/resolve`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
      setResult(data);
      setGrievances(prev => prev.map(g =>
        g.id === selectedId ? { ...g, status: 'resolved_pending' } : g
      ));
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    setSelectedId(null);
    setProofFile(null);
    setProofPreview(null);
    setResult(null);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const assigned = grievances.filter(g => ['assigned', 'in_progress'].includes(g.status));
  const pending = grievances.filter(g => g.status === 'resolved_pending');
  const open = grievances.filter(g => g.status === 'open');

  return (
    <div className="max-w-4xl mx-auto p-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">{t('officer.title')}</h1>

      {assigned.length === 0 && open.length === 0 && (
        <Card className="p-8 text-center">
          <CheckCircle size={48} className="mx-auto mb-4 text-success opacity-50" />
          <p className="text-on-surface-variant">{t('officer.no_assignments')}</p>
        </Card>
      )}

      {/* My assigned grievances */}
      {assigned.length > 0 && (
        <div>
          <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
            <AlertCircle size={18} /> Assigned to Me ({assigned.length})
          </h2>
          <div className="space-y-3">
            {assigned.map(g => (
              <div key={g.id} className="flex items-center gap-3">
                <div className="flex-1"><GrievanceCard grievance={g} /></div>
                <Button size="sm" onClick={() => setSelectedId(g.id)}>
                  <Camera size={16} /> Resolve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open grievances that need attention */}
      {open.length > 0 && (
        <div>
          <h2 className="font-semibold text-on-surface mb-3">Open Issues ({open.length})</h2>
          <div className="space-y-3">
            {open.map(g => (
              <div key={g.id} className="flex items-center gap-3">
                <div className="flex-1"><GrievanceCard grievance={g} /></div>
                <Button size="sm" onClick={() => setSelectedId(g.id)}>
                  <Camera size={16} /> Resolve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending verification */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-semibold text-on-surface mb-3">Pending Citizen Verification ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(g => <GrievanceCard key={g.id} grievance={g} />)}
          </div>
        </div>
      )}

      {/* Upload proof modal */}
      <Modal open={!!selectedId} onClose={closeModal} title={t('officer.upload_proof')}>
        {result ? (
          <div className="text-center py-4">
            {result.error ? (
              <>
                <AlertCircle size={48} className="mx-auto mb-4 text-error" />
                <p className="text-error">{result.error}</p>
              </>
            ) : (
              <>
                <CheckCircle size={48} className="mx-auto mb-4 text-success" />
                <p className="font-medium text-on-surface mb-2">Proof submitted!</p>
                {result.ai_match_score != null && (
                  <Badge color={result.ai_match_score > 0.6 ? 'success' : 'warning'}>
                    AI Match Score: {Math.round(result.ai_match_score * 100)}%
                  </Badge>
                )}
                <p className="text-sm text-on-surface-variant mt-3">Waiting for citizen verification (24h window)</p>
              </>
            )}
            <Button onClick={closeModal} className="mt-4">{t('common.back')}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-outline-variant rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all"
            >
              {proofPreview ? (
                <img src={proofPreview} alt="Proof" className="max-h-48 mx-auto rounded-xl" />
              ) : (
                <div className="text-on-surface-variant">
                  <Upload size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('officer.select_photo')}</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <Button
              onClick={handleSubmitProof}
              disabled={!proofFile || submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? <Spinner size="sm" /> : <Upload size={18} />}
              {t('officer.submit_proof')}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
