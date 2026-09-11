import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface Props {
  onGoLogin: () => void;
}

const RegisterForm: React.FC<Props> = ({ onGoLogin }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { register, isRegistering, loginError } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
    } catch {
      // eroarea e deja în store
    }
  };

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