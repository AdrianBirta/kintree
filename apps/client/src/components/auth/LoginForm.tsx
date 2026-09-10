import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface Props {
  onGoRegister: () => void;
}

const LoginForm: React.FC<Props> = ({ onGoRegister }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, loginError } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials.email, credentials.password);
    } catch {
      // eroarea e deja în store, afișată mai jos
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-earbore-ink mb-1">Bun venit înapoi!</h2>
      <p className="text-earbore-gray text-sm mb-8">Autentifică-te pentru a-ți continua arborele.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            className="input-base"
            required
            disabled={isLoggingIn}
            placeholder="nume@email.ro"
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">
            Parolă
          </label>
          {/* NOU — wrapper relativ, ca butonul de vizibilitate să se poziționeze
              absolut în dreapta inputului, fără să afecteze layout-ul restului formularului */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="input-base pr-11"
              required
              disabled={isLoggingIn}
              placeholder="Introdu parola"
              autoComplete="current-password"
            />
            <IconButton
              type="button"
              size="small"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isLoggingIn}
              tabIndex={-1}
              aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
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

        <button type="submit" disabled={isLoggingIn} className="btn-primary w-full disabled:opacity-50">
          {isLoggingIn ? 'Se autentifică...' : 'Autentificare →'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-earbore-gray">
        Nu ai cont?{' '}
        <button onClick={onGoRegister} className="font-semibold text-earbore-600 hover:text-earbore-700 cursor-pointer">
          Creează cont
        </button>
      </p>
    </div>
  );
};

export default LoginForm;