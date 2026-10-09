import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthShell from '../components/auth/AuthShell';
import { useAuthStore } from '../store/authStore';
import BrandedLoader from '../components/common/BrandedLoader';

type Status = 'verifying' | 'invalid' | 'exists' | 'error';

const VerifyEmailPage: React.FC = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const token = params.get('token') ?? '';

  // tokenul e de unică folosință: în StrictMode (dev) efectul rulează de 2 ori,
  // iar al doilea apel ar eșua. Ref-ul garantează o singură confirmare.
  const startedRef = useRef(false);
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'invalid');

  useEffect(() => {
    if (!token || startedRef.current) return;
    startedRef.current = true;

    verifyEmail(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((err) => {
        const code = err.response?.status;
        if (code === 409) setStatus('exists');
        else if (code === 400) setStatus('invalid');
        else setStatus('error');
      });
  }, [token, verifyEmail, navigate]);

  if (status === 'verifying') return <BrandedLoader />;

  if (status === 'exists') {
    return (
      <AuthShell>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-earbore-ink mb-2">{t('emailVerification.existsTitle')}</h2>
          <p className="text-earbore-gray text-sm leading-relaxed mb-8">{t('emailVerification.existsBody')}</p>
          <Link to="/auth?mode=login" className="btn-primary inline-block">
            {t('passwordReset.goToLogin')}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-earbore-ink mb-2">
          {status === 'invalid' ? t('emailVerification.invalidTitle') : t('passwordReset.genericError')}
        </h2>
        {status === 'invalid' && (
          <p className="text-earbore-gray text-sm leading-relaxed">{t('emailVerification.invalidBody')}</p>
        )}
        <p className="mt-8">
          <Link to="/auth?mode=register" className="btn-primary inline-block">
            {t('emailVerification.registerAgain')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default VerifyEmailPage;