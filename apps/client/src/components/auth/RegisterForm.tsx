import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface Props {
  onGoLogin: () => void;
}

const RegisterForm: React.FC<Props> = ({ onGoLogin }) => {
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
      <h2 className="text-2xl sm:text-3xl font-bold text-earbore-ink mb-1">Creează-ți contul</h2>
      <p className="text-earbore-gray text-sm mb-8">Începe-ți arborele genealogic în câteva secunde.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Prenume</label>
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
            <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Nume</label>
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
          <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-base"
            required
            disabled={isRegistering}
            placeholder="nume@email.ro"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Parolă</label>
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
              placeholder="Minim 8 caractere"
              autoComplete="new-password"
            />
            <IconButton
              type="button"
              size="small"
              onClick={() => setShowPassword((v) => !v)}
              // FIX — la fel ca în LoginForm: preventDefault pe mousedown ca
              // input-ul de parolă să nu-și piardă focusul (și implicit
              // tastatura de pe mobil să nu se închidă) când apeși pe ochi.
              onMouseDown={(e) => e.preventDefault()}
              disabled={isRegistering}
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

        <button type="submit" disabled={isRegistering} className="btn-primary w-full disabled:opacity-50">
          {isRegistering ? 'Se creează contul...' : 'Creează cont →'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-earbore-gray">
        Ai deja cont?{' '}
        <button onClick={onGoLogin} className="font-semibold text-earbore-600 hover:text-earbore-700 cursor-pointer">
          Autentifică-te
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;