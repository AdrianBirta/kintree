import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SocialAuthButtons from './SocialAuthButtons';
import { emailVerificationService } from '../../api/emailVerificationService';

interface Props {
  onGoLogin: () => void;
  inviteToken?: string;
}

const RESEND_COOLDOWN_SECONDS = 60;

const RegisterForm: React.FC<Props> = ({ onGoLogin, inviteToken }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { register, isRegistering, loginError, clearError } = useAuth();

  // adresa la care s-a trimis emailul de confirmare (null = formularul normal)
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const lang = i18n.language?.slice(0, 2) || 'en';

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ ...formData, inviteToken, lang });
      setSentTo(formData.email.trim());
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setResendState('idle');
    } catch {
      // eroarea e deja în store
    }
  };

  const handleResend = async () => {
    if (!sentTo || cooldown > 0 || resendState === 'sending') return;
    setResendState('sending');
    try {
      await emailVerificationService.resend(sentTo, lang);
      setResendState('sent');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setResendState('error');
    }
  };

  const handleBackToForm = () => {
    setSentTo(null);
    setResendState('idle');
    setCooldown(0);
    clearError();
  };

  // ───────── ecranul "Verifică-ți emailul" ─────────
  if (sentTo) {
    return (
      <div className="w-full text-center">
        <div className="w-14 h-14 rounded-full bg-earbore-100 text-earbore-700 flex items-center justify-center mx-auto mb-5 text-2xl">
          ✉️
        </div>
        <h2 className="text-2xl font-bold text-earbore-ink mb-2">{t('emailVerification.checkTitle')}</h2>
        <p className="text-earbore-gray text-sm leading-relaxed mb-6">
          {t('emailVerification.checkBody', { email: sentTo })}
        </p>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resendState === 'sending'}
          className="btn-outline w-full text-sm disabled:opacity-50"
        >
          {cooldown > 0
            ? t('emailVerification.resendWait', { seconds: cooldown })
            : t('emailVerification.resend')}
        </button>

        {resendState === 'sent' && (
          <p className="text-earbore-success text-sm mt-3">{t('emailVerification.resent')}</p>
        )}
        {resendState === 'error' && (
          <p className="text-earbore-danger text-sm mt-3">{t('passwordReset.genericError')}</p>
        )}

        <button
          type="button"
          onClick={handleBackToForm}
          className="mt-6 text-sm font-semibold text-earbore-600 hover:text-earbore-700 cursor-pointer"
        >
          {t('emailVerification.wrongEmail')}
        </button>
      </div>
    );
  }

  // ───────── formularul normal ─────────
  return (
    <div className="w-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-earbore-ink mb-1">{t('auth.registerTitle')}</h2>
      <p className="text-earbore-gray text-sm mb-8">{t('auth.registerSubtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">{t('auth.firstName')}</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="input-base"
              required
              disabled={isRegistering}
              placeholder="Adrian"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">{t('auth.lastName')}</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="input-base"
              required
              disabled={isRegistering}
              placeholder="Birta"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">{t('auth.email')}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-base"
            required
            disabled={isRegistering}
            placeholder={t('auth.emailPlaceholder')}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">{t('auth.password')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-base pr-11"
              required
              minLength={8}
              maxLength={72}
              disabled={isRegistering}
              placeholder={t('auth.passwordMinPlaceholder')}
              autoComplete="new-password"
            />
            <IconButton
              type="button"
              size="small"
              onClick={() => setShowPassword((v) => !v)}
              onMouseDown={(e) => e.preventDefault()}
              disabled={isRegistering}
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

        {loginError && (
          <p className="text-earbore-danger text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100">
            {loginError}
          </p>
        )}

        <button type="submit" disabled={isRegistering} className="btn-primary w-full disabled:opacity-50">
          {isRegistering ? t('auth.registering') : t('auth.registerButton')}
        </button>
      </form>

      {/* invitația trece prin tot fluxul OAuth și se consumă pentru contul nou */}
      <SocialAuthButtons inviteToken={inviteToken} />

      <p className="mt-6 text-center text-sm text-earbore-gray">
        {t('auth.haveAccount')}{' '}
        <button onClick={onGoLogin} className="font-semibold text-earbore-600 hover:text-earbore-700 cursor-pointer">
          {t('auth.login')}
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;