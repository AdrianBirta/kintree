import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AuthShell from '../components/auth/AuthShell';
import { passwordResetService } from '../api/passwordResetService';
import { useAuthStore } from '../store/authStore';

const labelClass = 'block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5';

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'invalid'>(token ? 'idle' : 'invalid');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError(t('passwordReset.mismatch'));
      return;
    }

    setStatus('saving');
    try {
      await passwordResetService.reset(token, password);

      // backend-ul a șters toate sesiunile contului: curățăm și local, ca să nu rămână tokenuri moarte
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      useAuthStore.setState({ user: null });

      setStatus('done');
    } catch (err: any) {
      // mesaj de tip string = token invalid/expirat (validările întorc un array)
      if (err.response?.status === 400 && typeof err.response?.data?.message === 'string') {
        setStatus('invalid');
        return;
      }
      setStatus('idle');
      setError(err.response?.status === 429 ? t('passwordReset.tooMany') : t('passwordReset.genericError'));
    }
  };

  if (status === 'invalid') {
    return (
      <AuthShell>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-earbore-ink mb-2">{t('passwordReset.invalidLink')}</h2>
          <p className="mt-6">
            <Link to="/forgot-password" className="btn-primary inline-block">
              {t('passwordReset.requestNewLink')}
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  if (status === 'done') {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-earbore-100 text-earbore-700 flex items-center justify-center mx-auto mb-5 text-2xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-earbore-ink mb-2">{t('passwordReset.resetSuccessTitle')}</h2>
          <p className="text-earbore-gray text-sm leading-relaxed mb-8">{t('passwordReset.resetSuccessBody')}</p>
          <button onClick={() => navigate('/auth?mode=login')} className="btn-primary w-full">
            {t('passwordReset.goToLogin')}
          </button>
        </div>
      </AuthShell>
    );
  }

  const saving = status === 'saving';

  return (
    <AuthShell>
      <h2 className="text-2xl sm:text-3xl font-bold text-earbore-ink mb-1">{t('passwordReset.resetTitle')}</h2>
      <p className="text-earbore-gray text-sm mb-8">{t('passwordReset.resetSubtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className={labelClass}>{t('passwordReset.newPassword')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base pr-11"
              required
              minLength={8}
              maxLength={72}
              disabled={saving}
              placeholder={t('auth.passwordMinPlaceholder')}
              autoComplete="new-password"
            />
            <IconButton
              type="button"
              size="small"
              onClick={() => setShowPassword((v) => !v)}
              onMouseDown={(e) => e.preventDefault()}
              disabled={saving}
              tabIndex={-1}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              sx={{
                position: 'absolute',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-earbore-gray)',
              }}
            >
              {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </IconButton>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className={labelClass}>{t('passwordReset.confirmPassword')}</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirm-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-base"
            required
            minLength={8}
            maxLength={72}
            disabled={saving}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="text-earbore-danger text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">
          {saving ? t('passwordReset.resetting') : t('passwordReset.resetButton')}
        </button>
      </form>
    </AuthShell>
  );
};

export default ResetPasswordPage;