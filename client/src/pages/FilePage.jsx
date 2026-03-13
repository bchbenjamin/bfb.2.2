import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Upload, Send, Loader2, MapPin, CheckCircle, Edit3 } from 'lucide-react';
import { apiFetch } from '../api/client.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import Button from '../components/ui/Button.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { BENGALURU_CENTER, TILE_URLS, TILE_ATTRIBUTION } from '../utils/constants.js';

function LocationPicker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export default function FilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position: geoPos } = useGeolocation();
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [pin, setPin] = useState(null);
  const [step, setStep] = useState('input'); // input -> analyzing -> confirm -> submitting -> done
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!description.trim()) { setError('Please describe the issue'); return; }
    const loc = pin || geoPos;
    if (!loc) { setError('Please pin a location on the map'); return; }

    setStep('analyzing');
    setError('');

    try {
      const formData = new FormData();
      formData.append('raw_description', description);
      formData.append('latitude', loc.lat);
      formData.append('longitude', loc.lng);
      if (media) formData.append('media', media);

      const data = await apiFetch('/api/grievances', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set multipart boundary
      });

      setAiResult(data);
      setStep('done');
    } catch (err) {
      setError(err.message);
      setStep('input');
    }
  }

  const mapCenter = pin ? [pin.lat, pin.lng] : geoPos ? [geoPos.lat, geoPos.lng] : BENGALURU_CENTER;

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-128px)] gap-4">
        <Spinner size="lg" />
        <p className="text-on-surface-variant text-lg">{t('grievance.analyzing')}</p>
      </div>
    );
  }

  if (step === 'done' && aiResult) {
    const g = aiResult.grievance;
    const ai = aiResult.ai_analysis;
    return (
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface">Grievance Filed Successfully</h2>
        </div>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg text-on-surface">{g.title}</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-on-surface-variant">{t('grievance.category')}</span>
              <p className="font-medium text-on-surface">{ai.category}</p>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant">{t('grievance.subcategory')}</span>
              <p className="font-medium text-on-surface">{ai.subcategory}</p>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant">{t('grievance.priority')}</span>
              <Badge color={ai.priority >= 4 ? 'error' : ai.priority >= 3 ? 'warning' : 'info'}>
                {t(`priority_labels.${ai.priority}`)} ({ai.priority}/5)
              </Badge>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant">{t('grievance.detected_location')}</span>
              <p className="font-medium text-on-surface">{ai.detected_location || 'N/A'}</p>
            </div>
          </div>

          {aiResult.media_verified !== undefined && (
            <p className={`text-sm ${aiResult.media_verified ? 'text-success' : 'text-warning'}`}>
              {aiResult.media_verified ? t('grievance.media_verified') : t('grievance.media_unverified')}
            </p>
          )}

          {aiResult.spatial_alert && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ {aiResult.spatial_alert.message}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outlined" onClick={() => navigate('/')} className="flex-1">
              {t('nav.home')}
            </Button>
            <Button onClick={() => navigate(`/grievance/${g.id}`)} className="flex-1">
              View Grievance
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold text-on-surface mb-2">{t('nav.file')}</h1>
      <p className="text-on-surface-variant mb-6">{t('grievance.describe_hint')}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-error rounded-xl text-sm">{error}</div>
      )}

      <form onSubmit={handleAnalyze} className="space-y-6">
        <Textarea
          label={t('grievance.describe').replace('...', '')}
          placeholder={t('grievance.describe')}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={5}
          required
        />

        {/* Photo upload */}
        <div>
          <label className="text-sm font-medium text-on-surface-variant mb-2 block">
            {t('grievance.upload_photo')}
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-outline-variant rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            {mediaPreview ? (
              <img src={mediaPreview} alt="Preview" className="max-h-48 mx-auto rounded-xl" />
            ) : (
              <div className="text-on-surface-variant">
                <Upload size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('grievance.drop_photo')}</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Map pin */}
        <div>
          <label className="text-sm font-medium text-on-surface-variant mb-2 flex items-center gap-2">
            <MapPin size={16} /> {t('grievance.pin_location')}
          </label>
          <div className="h-64 rounded-2xl overflow-hidden border border-outline-variant/50">
            <MapContainer center={mapCenter} zoom={14} className="h-full w-full">
              <TileLayer url={TILE_URLS.light} attribution={TILE_ATTRIBUTION} />
              <LocationPicker position={pin || geoPos} onPositionChange={setPin} />
            </MapContainer>
          </div>
          {(pin || geoPos) && (
            <p className="text-xs text-on-surface-variant mt-1">
              📍 {(pin || geoPos).lat.toFixed(5)}, {(pin || geoPos).lng.toFixed(5)}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full">
          <Send size={18} />
          {t('grievance.submit')}
        </Button>
      </form>
    </div>
  );
}
