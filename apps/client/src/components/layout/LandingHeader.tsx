import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconButton, Fade } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LanguageSwitcher from '../common/LanguageSwitcher';

const NAV_LINKS = [
  { href: '#cum-functioneaza', key: 'howItWorks' },
  { href: '#functionalitati', key: 'features' },
  { href: '#sustine', key: 'support' },
  { href: '#intrebari', key: 'faq' },
] as const;

const SCROLL_TOP_THRESHOLD = 480;

const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // urmărim scroll-ul pentru umbra "pill"-ului mobil ȘI pentru afișarea
  // butonului "scroll to top" — un singur listener, două praguri diferite
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
      setShowScrollTop(window.scrollY > SCROLL_TOP_THRESHOLD);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // închidem meniul mobil automat dacă ecranul crește peste breakpoint-ul sm
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const handleChange = () => { if (mq.matches) setMobileOpen(false); };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const handleNavClick = () => setMobileOpen(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      {/* Pe mobil: header plutitor tip "pill", cu offset de sus și colțuri rotunjite.
          Pe desktop (sm+): aspectul vechi — bară sticky lipită sus, colțuri drepte,
          fără gap lateral, doar border-bottom. */}
      <header className="sticky top-3 sm:top-0 z-40 px-3 sm:px-0">
        <div
          className={`max-w-5xl sm:max-w-none mx-auto sm:mx-0 flex items-center justify-between gap-2 rounded-2xl sm:rounded-none border sm:border-0 sm:border-b transition-shadow duration-200 ${scrolled
            ? 'border-earbore-border shadow-[0_8px_28px_-8px_rgba(20,10,40,0.18)] sm:shadow-none'
            : 'border-earbore-border/70 shadow-[0_2px_10px_-4px_rgba(20,10,40,0.08)] sm:shadow-none'
            } sm:border-earbore-border bg-white/80 sm:bg-white/90 backdrop-blur-md sm:backdrop-blur-sm px-4 sm:px-6 py-2.5 sm:py-4`}
        >
          {/* ÎNLOCUIT — logo-ul e acum înfășurat într-un container flex-1, ca să
      aibă aceeași "greutate" ca grupul din dreapta. Fără asta, nav-ul din
      mijloc nu era centrat pe bara întreagă, ci doar înghesuit între cele
      două grupuri de lățimi diferite (logo mai îngust decât zona de
      autentificare+limbă+buton). */}
          <div className="flex-1 flex items-center">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <span className="text-lg sm:text-xl font-extrabold text-earbore-700">eArbore</span>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-earbore-gray flex-shrink-0">
            {NAV_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="px-3 py-1.5 rounded-lg hover:text-earbore-700 hover:bg-earbore-50 transition-colors"
              >
                {t(`landingHeader.${link.key}`)}
              </a>
            ))}
          </nav>

          {/* ÎNLOCUIT — la fel, flex-1 și justify-end, ca să oglindească exact
      lățimea containerului de logo din stânga */}
          <div className="hidden sm:flex flex-1 items-center justify-end gap-3">
            <LanguageSwitcher variant="icon" />
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="text-sm font-semibold text-earbore-gray hover:text-earbore-700 px-3 py-2 cursor-pointer"
            >
              {t('landingHeader.login')}
            </button>
            <button onClick={() => navigate('/auth?mode=register')} className="btn-primary text-sm py-2.5 px-4">
              {t('landingHeader.startFree')}
            </button>
          </div>

          <IconButton
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t('landingHeader.menu')}
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              color: 'var(--color-earbore-ink)',
            }}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </div>

        {/* meniul mobil — panou absolut, plutește peste conținut, nu mai
            împinge restul paginii în jos. Doar pe mobil. */}
        <div
          className={`sm:hidden absolute left-3 right-3 mt-2 origin-top transition-all duration-200 ${mobileOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`}
        >
          <div className="rounded-2xl border border-earbore-border bg-white/95 backdrop-blur-md shadow-[0_16px_40px_-12px_rgba(20,10,40,0.25)] px-5 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={handleNavClick}
                className="text-sm font-medium text-earbore-ink px-2 py-2.5 rounded-lg hover:bg-earbore-50"
              >
                {t(`landingHeader.${link.key}`)}
              </a>
            ))}

            <div className="h-px bg-earbore-border my-2" />

            <div className="px-2 py-1"><LanguageSwitcher variant="full" /></div>

            <button
              onClick={() => { handleNavClick(); navigate('/auth?mode=login'); }}
              className="btn-outline text-sm py-2.5 mt-1"
            >
              {t('landingHeader.login')}
            </button>
            <button
              onClick={() => { handleNavClick(); navigate('/auth?mode=register'); }}
              className="btn-primary text-sm py-2.5"
            >
              {t('landingHeader.startFree')}
            </button>
          </div>
        </div>
      </header>

      {/* backdrop — doar pe mobil, click în afara meniului îl închide */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-30"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* NOU — buton "scroll to top", apare după ce s-a derulat suficient */}
      <Fade in={showScrollTop}>
        <IconButton
          onClick={scrollToTop}
          aria-label={t('landingHeader.scrollToTop', 'Înapoi sus')}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 40,
            width: 44,
            height: 44,
            bgcolor: 'var(--color-earbore-600)',
            color: 'white',
            boxShadow: '0 8px 20px -6px rgba(98,54,173,0.55)',
            transition: 'background-color 0.15s, transform 0.15s',
            '&:hover': {
              bgcolor: 'var(--color-earbore-700)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </IconButton>
      </Fade>
    </>
  );
};

export default LandingHeader;