import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import BrandedLoader from '../components/common/BrandedLoader';

const SocialCallbackPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const socialLogin = useAuthStore((s) => s.socialLogin);

  // codul e de unică folosință: în StrictMode (dev) efectul rulează de 2 ori,
  // iar al doilea apel ar eșua. Ref-ul garantează un singur schimb.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const code = params.get('code');
    if (!code) {
      navigate('/auth?error=social_failed', { replace: true });
      return;
    }

    socialLogin(code)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/auth?error=social_failed', { replace: true }));
  }, [params, navigate, socialLogin]);

  return <BrandedLoader />;
};

export default SocialCallbackPage;