import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { LEGAL_CONTENT, LEGAL_LAST_UPDATED } from '../content/legalContent';

interface Props {
  kind: 'privacy' | 'terms';
}

const LegalPage: React.FC<Props> = ({ kind }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { hash } = useLocation();

  // română pentru interfața în română, engleză pentru restul limbilor
  const contentLang = i18n.language?.startsWith('ro') ? 'ro' : 'en';
  const doc = LEGAL_CONTENT[contentLang][kind];

  // titlul tabului (important și pentru SEO la indexare)
  useEffect(() => {
    const previous = document.title;
    document.title = `${doc.title} | eArbore`;
    return () => {
      document.title = previous;
    };
  }, [doc.title]);

  // sare la secțiune dacă linkul are #ancoră (ex. /privacy#data-deletion), altfel la început
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView();
  }, [hash, kind, contentLang]);

  const formattedDate = new Date(LEGAL_LAST_UPDATED).toLocaleDateString(i18n.language || 'en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-earbore-grayLight">
      <header className="border-b border-earbore-border bg-white">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
            <img src="/assets/favicon.svg" alt="" className="h-7 w-7" />
            <span className="text-lg font-extrabold text-earbore-700">eArbore</span>
          </button>
          <LanguageSwitcher variant="icon" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-earbore-gray hover:text-earbore-700 mb-6 cursor-pointer inline-block"
        >
          {t('legal.backHome')}
        </button>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-earbore-ink mb-2">{doc.title}</h1>
        <p className="text-xs text-earbore-gray mb-8">{t('legal.lastUpdated', { date: formattedDate })}</p>

        {doc.intro.map((p, i) => (
          <p key={i} className="text-earbore-ink/90 leading-relaxed mb-4">{p}</p>
        ))}

        {doc.sections.map((section) => (
          <section key={section.heading} id={section.id} className="mt-9 scroll-mt-20">
            <h2 className="text-xl font-bold text-earbore-ink mb-3">{section.heading}</h2>
            {section.paragraphs?.map((p, i) => (
              <p key={i} className="text-earbore-ink/90 leading-relaxed mb-3">{p}</p>
            ))}
            {section.list && (
              <ul className="list-disc pl-6 space-y-2 text-earbore-ink/90 leading-relaxed">
                {section.list.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="mt-14 pt-6 border-t border-earbore-border flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/privacy" className="font-semibold text-earbore-600 hover:text-earbore-700">
            {t('legal.privacyLink')}
          </Link>
          <Link to="/terms" className="font-semibold text-earbore-600 hover:text-earbore-700">
            {t('legal.termsLink')}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LegalPage;