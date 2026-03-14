import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../api/client.js';

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      login(data.token, data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0d2137 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="BengaluruDuru Logo" className="w-24 h-24 mx-auto mb-4 object-contain drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white">{t('app.name')}</h1>
          <p className="text-blue-300 mt-1 text-sm">Government Officer Portal</p>
        </div>

        <div className="rounded-3xl p-6 shadow-2xl border"
          style={{
            background: 'rgba(15, 25, 50, 0.85)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(16px)',
          }}>
          <div className="flex items-center gap-3 mb-6 pb-4"
            style={{ borderBottom: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
              <Shield size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">BBMP Officer Login</h2>
              <p className="text-xs text-blue-300/70 mt-0.5 px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                Demo: officer@bbmp.gov.in / bbmp123
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-blue-200 mb-1.5 block">
                <Mail size={14} className="inline mr-1.5" />
                Email Address
              </label>
              <input
                type="email"
                placeholder="officer@bbmp.gov.in"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{
                  background: 'rgba(30, 58, 95, 0.5)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-blue-200 mb-1.5 block">
                <Lock size={14} className="inline mr-1.5" />
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{
                  background: 'rgba(30, 58, 95, 0.5)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In as Officer'}
            </button>
          </form>

          <div className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <a href="/login" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              ← Citizen Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
