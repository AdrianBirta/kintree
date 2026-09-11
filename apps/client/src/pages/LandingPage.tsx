import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LandingHeader from '../components/layout/LandingHeader';
import TreePreviewSvg from '../components/landing/TreePreviewSvg';

const DONATE_URL = 'https://buymeacoffee.com/earbore'; // TODO: înlocuiește cu link-ul tău real (Stripe Payment Link / BMC / Ko-fi)

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-earbore-grayLight flex flex-col">
      <LandingHeader />

      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ background: 'radial-gradient(circle at 30% 20%, var(--color-earbore-600), transparent 55%)' }}
        />
        <div className="max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-16 text-center relative">
          <span className="inline-block bg-earbore-100 text-earbore-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            {t('landing.badge')}
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-earbore-ink mb-6 leading-tight">
            {t('landing.heroTitle1')} <span className="text-earbore-600">{t('landing.heroTitleHighlight')}</span>
          </h1>

          <p className="text-earbore-gray text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/auth?mode=register')} className="btn-primary text-base px-7 py-3.5 w-full sm:w-auto">
              {t('landing.ctaBuildFree')}
            </button>
            <a href="#cum-functioneaza" className="btn-outline text-base px-7 py-3.5 w-full sm:w-auto text-center">
              {t('landing.ctaSeeHowItWorks')}
            </a>
          </div>

          <p className="text-earbore-gray text-xs mt-4">
            {t('landing.heroFootnote')}
          </p>

          {/* mockup vizual simplu */}
          <div className="mt-14 max-w-3xl mx-auto rounded-3xl border border-earbore-border bg-white shadow-xl p-3 sm:p-4">
            <div className="rounded-2xl h-64 sm:h-80 overflow-hidden">
              <TreePreviewSvg />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── AGITATE — problema reală ───────────── */}
      <section className="bg-white border-y border-earbore-border py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-earbore-ink mb-4">
            {t('landing.agitateTitle')}
          </h2>
          <p className="text-earbore-gray text-base sm:text-lg leading-relaxed">
            {t('landing.agitateBody')}
          </p>
        </div>
      </section>

      {/* ───────────── VALUE STACK / FUNCȚIONALITĂȚI ───────────── */}
      <section id="functionalitati" className="py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-earbore-ink mb-3">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-earbore-gray">{t('landing.featuresSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard title={t('landing.feature1Title')} desc={t('landing.feature1Desc')} emoji="⚡" />
            <FeatureCard title={t('landing.feature2Title')} desc={t('landing.feature2Desc')} emoji="🌳" />
            <FeatureCard title={t('landing.feature3Title')} desc={t('landing.feature3Desc')} emoji="📖" />
            <FeatureCard title={t('landing.feature4Title')} desc={t('landing.feature4Desc')} emoji="🔒" />
            <FeatureCard title={t('landing.feature5Title')} desc={t('landing.feature5Desc')} emoji="🤝" />
            <FeatureCard title={t('landing.feature6Title')} desc={t('landing.feature6Desc')} emoji="📱" />
          </div>
        </div>
      </section>

      {/* ───────────── CUM FUNCȚIONEAZĂ ───────────── */}
      <section id="cum-functioneaza" className="bg-white border-y border-earbore-border py-20 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-earbore-ink text-center mb-14">
            {t('landing.howTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <Step number="1" title={t('landing.step1Title')} desc={t('landing.step1Desc')} />
            <Step number="2" title={t('landing.step2Title')} desc={t('landing.step2Desc')} />
            <Step number="3" title={t('landing.step3Title')} desc={t('landing.step3Desc')} />
          </div>
        </div>
      </section>

      {/* ───────────── SOCIAL PROOF ───────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-earbore-gray text-sm uppercase tracking-wider font-semibold mb-8">
            {t('landing.socialProofLabel')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Testimonial quote={t('landing.testimonial1')} name="Ana M." />
            <Testimonial quote={t('landing.testimonial2')} name="Radu B." />
            <Testimonial quote={t('landing.testimonial3')} name="Ioana T." />
          </div>
        </div>
      </section>

      {/* ───────────── SUSȚINE PROIECTUL (donații) ───────────── */}
      <section id="sustine" className="py-20 bg-earbore-ink scroll-mt-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            {t('landing.supportBadge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            {t('landing.supportTitle')}
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.supportBody')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <DonateTier label={t('landing.donateTier1Label')} amount="10 lei" impact={t('landing.donateTier1Impact')} href={DONATE_URL} />
            <DonateTier label={t('landing.donateTier2Label')} amount="25 lei" impact={t('landing.donateTier2Impact')} href={DONATE_URL} highlighted />
            <DonateTier label={t('landing.donateTier3Label')} amount="50 lei" impact={t('landing.donateTier3Impact')} href={DONATE_URL} />
          </div>

          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="inline-block text-white/60 text-sm underline hover:text-white transition-colors">
            {t('landing.donateCustom')}
          </a>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="intrebari" className="py-20 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-earbore-ink text-center mb-12">{t('landing.faqTitle')}</h2>
          <div className="flex flex-col gap-4">
            <FaqItem q={t('landing.faq1Q')} a={t('landing.faq1A')} />
            <FaqItem q={t('landing.faq2Q')} a={t('landing.faq2A')} />
            <FaqItem q={t('landing.faq3Q')} a={t('landing.faq3A')} />
            <FaqItem q={t('landing.faq4Q')} a={t('landing.faq4A')} />
          </div>
        </div>
      </section>

      {/* ───────────── CTA FINAL ───────────── */}
      <section className="bg-white border-t border-earbore-border py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-earbore-ink mb-4">
            {t('landing.finalCtaTitle')}
          </h2>
          <p className="text-earbore-gray text-base mb-8">
            {t('landing.finalCtaSubtitle')}
          </p>
          <button onClick={() => navigate('/auth?mode=register')} className="btn-primary text-base px-8 py-3.5">
            {t('landing.ctaBuildFree')}
          </button>
        </div>
      </section>

      <footer className="border-t border-earbore-border py-6 text-center text-sm text-earbore-gray bg-earbore-grayLight">
        © {new Date().getFullYear()} eArbore. {t('landing.footer')}
      </footer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Componente mici, locale — doar pentru landing page
// ─────────────────────────────────────────────────────────────
const FeatureCard: React.FC<{ title: string; desc: string; emoji: string }> = ({ title, desc, emoji }) => (
  <div className="bg-white rounded-2xl border border-earbore-border p-6 hover:shadow-md transition-shadow">
    <div className="text-3xl mb-3">{emoji}</div>
    <h3 className="font-bold text-earbore-ink mb-1.5">{title}</h3>
    <p className="text-sm text-earbore-gray leading-relaxed">{desc}</p>
  </div>
);

const Step: React.FC<{ number: string; title: string; desc: string }> = ({ number, title, desc }) => (
  <div className="flex flex-col items-center text-center">
    <div className="w-12 h-12 rounded-full bg-earbore-600 text-white flex items-center justify-center font-extrabold text-lg mb-4">
      {number}
    </div>
    <h3 className="font-bold text-earbore-ink mb-1.5">{title}</h3>
    <p className="text-sm text-earbore-gray leading-relaxed">{desc}</p>
  </div>
);

const Testimonial: React.FC<{ quote: string; name: string }> = ({ quote, name }) => (
  <div className="bg-white rounded-2xl border border-earbore-border p-6 text-left">
    <p className="text-sm text-earbore-ink/90 leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
    <p className="text-xs font-semibold text-earbore-gray">— {name}</p>
  </div>
);

const DonateTier: React.FC<{ label: string; amount: string; impact: string; href: string; highlighted?: boolean }> = ({
  label, amount, impact, href, highlighted,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`rounded-2xl p-5 text-center transition-transform hover:-translate-y-0.5 ${highlighted ? 'bg-earbore-600 text-white' : 'bg-white/5 text-white border border-white/15'
      }`}
  >
    <p className="text-xs uppercase tracking-wider font-semibold opacity-80 mb-1">{label}</p>
    <p className="text-2xl font-extrabold mb-1">{amount}</p>
    <p className="text-xs opacity-70">{impact}</p>
  </a>
);

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => (
  <details className="bg-white rounded-2xl border border-earbore-border p-5 group">
    <summary className="font-semibold text-earbore-ink cursor-pointer list-none flex items-center justify-between">
      {q}
      <span className="text-earbore-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
    </summary>
    <p className="text-sm text-earbore-gray leading-relaxed mt-3">{a}</p>
  </details>
);

export default LandingPage;