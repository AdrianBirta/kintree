import React from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../common/LanguageSwitcher';

const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

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

        <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8">{children}</div>
      </div>
    </div>
  );
};

export default AuthShell;