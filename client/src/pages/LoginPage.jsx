import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../api/client.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Card from '../components/ui/Card.jsx';
import LanguageSwitcher from '../components/ui/LanguageSwitcher.jsx';
import { LANGUAGES } from '../utils/constants.js';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('aadhaar'); // aadhaar -> otp
  const [form, setForm] = useState({ aadhaar_id: '', name: '', email: '', phone: '', otp: '', language_pref: 'en' });
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  function handleSendOtp(e) {
    e.preventDefault();
    if (!/^\d{12}$/.test(form.aadhaar_id)) {
      setError('Aadhaar must be 12 digits');
      return;
    }
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setStep('otp');
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (form.otp !== '123456') {
      setError('Invalid OTP. Use: 123456');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const maskedAadhaar = form.aadhaar_id
    ? form.aadhaar_id.slice(0, -4).replace(/./g, '•') + form.aadhaar_id.slice(-4)
    : '';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <img src="/logo.png" alt="BengaluruDuru Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-on-surface">{t('app.name')}</h1>
          <p className="text-on-surface-variant mt-1">{t('app.tagline')}</p>
          <div className="mt-3 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/50">
            <Shield size={24} className="text-primary" />
            <div>
              <h2 className="font-semibold text-on-surface">{t('auth.title')}</h2>
              <p className="text-xs text-on-surface-variant mt-0.5 bg-primary-container/50 px-2 py-1 rounded-lg">
                {t('auth.simulated_notice')}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-error rounded-xl text-sm">
              {error}
            </div>
          )}

          {step === 'aadhaar' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative">
                <Input
                  label={t('auth.aadhaar')}
                  type={showAadhaar ? 'text' : 'password'}
                  placeholder={t('auth.aadhaar_placeholder')}
                  value={form.aadhaar_id}
                  onChange={e => update('aadhaar_id', e.target.value.replace(/\D/g, '').slice(0, 12))}
                  maxLength={12}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAadhaar(s => !s)}
                  className="absolute right-3 top-9 text-on-surface-variant p-1"
                >
                  {showAadhaar ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Input
                label={t('auth.name')}
                placeholder={t('auth.name_placeholder')}
                value={form.name}
                onChange={e => update('name', e.target.value)}
                required
              />

              <Input
                label={t('auth.email')}
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
              />

              <Input
                label={t('auth.phone')}
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              />



              <Button type="submit" className="w-full" size="lg">
                {t('auth.send_otp')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-3 bg-surface-container rounded-xl text-sm text-on-surface-variant">
                Aadhaar: <span className="font-mono">{showAadhaar ? form.aadhaar_id : maskedAadhaar}</span>
                <br />Name: {form.name}
              </div>

              <Input
                label={t('auth.otp')}
                placeholder={t('auth.otp_placeholder')}
                value={form.otp}
                onChange={e => update('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
                required
              />

              <div className="flex gap-3">
                <Button type="button" variant="outlined" onClick={() => setStep('aadhaar')} className="flex-1">
                  {t('common.back')}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1" size="lg">
                  {loading ? t('auth.signing_in') : t('auth.verify_otp')}
                </Button>
              </div>
            </form>
          )}
        </Card>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-sm font-medium text-primary hover:underline"
          >
            Government Official / Admin Access
          </button>
        </div>
      </div>
    </div>
  );
}
