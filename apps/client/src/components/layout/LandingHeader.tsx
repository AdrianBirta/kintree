import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';

const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full border-b border-earbore-border bg-white/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
          <span className="text-xl font-extrabold text-earbore-700">eArbore</span>
        </button>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-earbore-gray">
          <a href="#cum-functioneaza" className="hover:text-earbore-700 transition-colors">{t('landingHeader.howItWorks')}</a>
          <a href="#functionalitati" className="hover:text-earbore-700 transition-colors">{t('landingHeader.features')}</a>
          <a href="#sustine" className="hover:text-earbore-700 transition-colors">{t('landingHeader.support')}</a>
          <a href="#intrebari" className="hover:text-earbore-700 transition-colors">{t('landingHeader.faq')}</a>
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <LanguageSwitcher variant="icon" />
          <button onClick={() => navigate('/auth?mode=login')} className="text-sm font-semibold text-earbore-gray hover:text-earbore-700 px-3 py-2 cursor-pointer">
            {t('landingHeader.login')}
          </button>
          <button onClick={() => navigate('/auth?mode=register')} className="btn-primary text-sm py-2.5 px-4">
            {t('landingHeader.startFree')}
          </button>
        </div>

        <button className="sm:hidden p-2 cursor-pointer" onClick={() => setMobileOpen((v) => !v)} aria-label={t('landingHeader.menu')}>
          <span className="text-2xl leading-none">☰</span>
        </button>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-earbore-border px-6 py-4 flex flex-col gap-3 bg-white">
          <a href="#cum-functioneaza" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-earbore-gray">{t('landingHeader.howItWorks')}</a>
          <a href="#functionalitati" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-earbore-gray">{t('landingHeader.features')}</a>
          <a href="#sustine" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-earbore-gray">{t('landingHeader.support')}</a>
          <div className="py-1"><LanguageSwitcher variant="full" /></div>
          <button onClick={() => navigate('/auth?mode=login')} className="btn-outline text-sm py-2.5">{t('landingHeader.login')}</button>
          <button onClick={() => navigate('/auth?mode=register')} className="btn-primary text-sm py-2.5">{t('landingHeader.startFree')}</button>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;