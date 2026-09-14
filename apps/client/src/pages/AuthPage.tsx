import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';
import { invitesService } from '../api/invitesService';
import { t } from 'i18next';

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login',
  );

  const inviteToken = searchParams.get('invite') || undefined;
  const [invitePreview, setInvitePreview] = useState<{ inviterName: string } | null>(null);

  useEffect(() => {
    if (!inviteToken) return;
    invitesService.preview(inviteToken).then((data) => setInvitePreview(data)).catch(() => setInvitePreview(null));
  }, [inviteToken]);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-earbore-grayLight flex items-center justify-center px-6 py-12 relative">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher variant="full" />
      </div>

      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 mb-8 cursor-pointer justify-center w-full"
        >
          <img src="/assets/favicon.svg" alt="" className="h-8 w-8" />
          <span className="text-2xl font-extrabold text-earbore-700">eArbore</span>
        </button>

        {mode === 'register' && invitePreview && (
          <div className="mb-4 bg-earbore-50 border border-earbore-200 rounded-xl p-3 text-sm text-earbore-700">
            {t('auth.invitedBy', { name: invitePreview.inviterName })}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8">
          {mode === 'login' ? (
            <LoginForm onGoRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onGoLogin={() => setMode('login')} inviteToken={inviteToken} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;