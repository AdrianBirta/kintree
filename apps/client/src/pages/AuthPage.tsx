import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login',
  );

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
          className="flex items-center gap-2 mb-8 cursor-pointer justify-center w-full"
        >
          <span className="text-2xl font-extrabold text-earbore-700">eArbore</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8">
          {mode === 'login' ? (
            <LoginForm onGoRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onGoLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;