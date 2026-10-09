import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthShell from '../components/auth/AuthShell';
import { passwordResetService } from '../api/passwordResetService';

const ForgotPasswordPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      await passwordResetService.requestReset(email.trim(), i18n.language?.slice(0, 2) || 'en');
      setStatus('sent');
    } catch (err: any) {
      setStatus('idle');
      setError(err.response?.status === 429 ? t('passwordReset.tooMany') : t('passwordReset.genericError'));
    }
  };

  if (status === 'sent') {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-earbore-100 text-earbore-700 flex items-center justify-center mx-auto mb-5 text-2xl">
            ✉️
          </div>
          <h2 className="text-2xl font-bold text-earbore-ink mb-2">{t('passwordReset.sentTitle')}</h2>
          <p className="text-earbore-gray text-sm leading-relaxed mb-8">
            {t('passwordReset.sentBody', { email })}
          </p>
          <Link to="/auth?mode=login" className="text-sm font-semibold text-earbore-600 hover:text-earbore-700">
            {t('passwordReset.backToLogin')}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h2 className="text-2xl sm:text-3xl font-bold text-earbore-ink mb-1">{t('passwordReset.forgotTitle')}</h2>
      <p className="text-earbore-gray text-sm mb-8">{t('passwordReset.forgotSubtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5"
          >
            {t('auth.email')}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            required
            disabled={status === 'sending'}
            placeholder={t('auth.emailPlaceholder')}
            autoComplete="email"
          />
        </div>

        {error && (
          <p className="text-earbore-danger text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100">
            {error}
          </p>
        )}

        <button type="submit" disabled={status === 'sending'} className="btn-primary w-full disabled:opacity-50">
          {status === 'sending' ? t('passwordReset.sending') : t('passwordReset.sendLink')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link to="/auth?mode=login" className="font-semibold text-earbore-600 hover:text-earbore-700">
          {t('passwordReset.backToLogin')}
        </Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;