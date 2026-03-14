import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Upload, Send, MapPin, CheckCircle, Search } from 'lucide-react';
import { apiFetch } from '../api/client.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import Button from '../components/ui/Button.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Card from '../components/ui/Card.jsx';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
      setError('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) { setError('Please describe the issue'); return; }
    const loc = pin || geoPos;
    if (!loc) { setError('Please pin a location on the map'); return; }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('raw_description', description);
      formData.append('latitude', loc.lat);
      formData.append('longitude', loc.lng);
      if (media) formData.append('media', media);

      // Submit directly. The backend runs AI categorization and media verification internally.
      await apiFetch('/api/grievances', {
        method: 'POST',
        body: formData,
        headers: {},
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const mapCenter = pin ? [pin.lat, pin.lng] : geoPos ? [geoPos.lat, geoPos.lng] : BENGALURU_CENTER;

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-128px)] gap-4">
        <Spinner size="lg" />
        <p className="text-on-surface-variant text-lg">
          Submitting grievance and running AI analysis...
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">Grievance Filed Successfully!</h2>
          <p className="text-on-surface-variant">
            Our AI has automatically categorized your issue and routed it to the correct department.
          </p>
        </div>

        <Card className="p-6 text-center space-y-6">
          <p className="text-sm text-on-surface-variant">
            You can track the resolution status from your dashboard.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outlined" onClick={() => navigate('/')} className="w-full sm:w-auto">
              {t('nav.home')}
            </Button>
            <Button onClick={() => { setSuccess(false); setDescription(''); setMedia(null); setMediaPreview(null); }} className="w-full sm:w-auto">
              File Another Issue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold text-on-surface mb-2">{t('nav.file')}</h1>
      <p className="text-on-surface-variant mb-8 text-lg">{t('grievance.describe_hint')}</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-error rounded-2xl text-sm border border-red-200 dark:border-red-800/30 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="p-6 shadow-md border-0">
          <label className="text-sm font-semibold text-on-surface mb-3 block">
            What's the issue?
          </label>
          <Textarea
            placeholder={t('grievance.describe')}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            required
            className="text-lg bg-surface placeholder:text-outline/60"
          />
        </Card>

        {/* Photo upload */}
        <Card className="p-6 shadow-md border-0">
          <label className="text-sm font-semibold text-on-surface mb-3 flex justify-between items-center">
            <span>{t('grievance.upload_photo')}</span>
            <span className="text-xs font-normal text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">Optional</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/10 transition-all group"
          >
            {mediaPreview ? (
              <img src={mediaPreview} alt="Preview" className="max-h-56 mx-auto rounded-xl shadow-lg border border-outline-variant/30" />
            ) : (
              <div className="text-primary/80 group-hover:text-primary transition-colors">
                <Upload size={40} className="mx-auto mb-3" />
                <p className="font-medium">{t('grievance.drop_photo')}</p>
                <p className="text-xs mt-1 text-on-surface-variant">JPG, PNG, WEBP (Max 5MB)</p>
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
        </Card>

        {/* Map pin */}
        <Card className="p-6 shadow-md border-0">
          <label className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-primary" /> {t('grievance.pin_location')}
          </label>
          <p className="text-xs text-on-surface-variant mb-3">
            Tap the map or use your current location to pinpoint the issue exactly.
          </p>
          <div className="h-72 rounded-2xl overflow-hidden border border-outline-variant/50 shadow-inner">
            <MapContainer center={mapCenter} zoom={14} className="h-full w-full">
              <TileLayer url={TILE_URLS.light} attribution={TILE_ATTRIBUTION} />
              <LocationPicker position={pin || geoPos} onPositionChange={setPin} />
            </MapContainer>
          </div>
          {(pin || geoPos) && (
            <p className="text-sm font-medium text-on-surface mt-3 flex items-center justify-center gap-2 bg-surface-container py-2 rounded-xl">
              📍 {(pin || geoPos).lat.toFixed(5)}, {(pin || geoPos).lng.toFixed(5)}
            </p>
          )}
        </Card>

        <Button type="submit" size="lg" className="w-full shadow-lg text-lg py-4">
          <Send size={20} />
          Submit Grievance
        </Button>
      </form>
    </div>
  );
}
