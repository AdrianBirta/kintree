import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from '../components/layout/LandingHeader';
import TreePreviewSvg from '../components/landing/TreePreviewSvg';

const DONATE_URL = 'https://buymeacoffee.com/earbore'; // TODO: înlocuiește cu link-ul tău real (Stripe Payment Link / BMC / Ko-fi)

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

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
            100% gratuit · fără card · pentru totdeauna
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-earbore-ink mb-6 leading-tight">
            Poveștile familiei tale nu ar trebui <span className="text-earbore-600">să dispară</span>
          </h1>

          <p className="text-earbore-gray text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Adaugă bunici, părinți, copii — cu poze și povești — și vezi întreaga familie
            prinzând viață într-un arbore genealogic pe care îl poți construi în câteva minute,
            nu în câteva weekenduri.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/auth?mode=register')} className="btn-primary text-base px-7 py-3.5 w-full sm:w-auto">
              Construiește-ți arborele gratuit →
            </button>
            <a href="#cum-functioneaza" className="btn-outline text-base px-7 py-3.5 w-full sm:w-auto text-center">
              Vezi cum funcționează
            </a>
          </div>

          <p className="text-earbore-gray text-xs mt-4">
            Fără abonament. Fără card la înregistrare. Poți susține proiectul opțional, cu o donație.
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
            Câte povești din familia ta s-au pierdut deja?
          </h2>
          <p className="text-earbore-gray text-base sm:text-lg leading-relaxed">
            Poze uitate în telefoane vechi. Nume de străbunici pe care nimeni nu și le mai amintește.
            Povești pe care doar bunica ta le mai știe — și pe care nimeni nu le-a scris nicăieri.
            Cu fiecare generație care trece, o parte din istoria familiei dispare pentru totdeauna.
          </p>
        </div>
      </section>

      {/* ───────────── VALUE STACK / FUNCȚIONALITĂȚI ───────────── */}
      <section id="functionalitati" className="py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-earbore-ink mb-3">
              Tot ce ai nevoie ca să salvezi istoria familiei
            </h2>
            <p className="text-earbore-gray">Fără curbă de învățare. Fără complicații tehnice.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Adaugi un membru în 30 de secunde"
              desc="Nume, poză, dată de naștere — și îl legi de familie printr-un simplu click. Nu ai nevoie de tutorial."
              emoji="⚡"
            />
            <FeatureCard
              title="Arbore genealogic vizual, în 2D și 3D"
              desc="Vezi generații întregi dintr-o privire, cu drag & drop pentru reorganizare rapidă."
              emoji="🌳"
            />
            <FeatureCard
              title="Poveștile prind viață"
              desc="Fiecare membru are propria pagină cu biografie, ca un mic articol despre viața lui."
              emoji="📖"
            />
            <FeatureCard
              title="Poze salvate în siguranță"
              desc="Fotografiile sunt încărcate și securizate automat, nu se pierd niciodată."
              emoji="🔒"
            />
            <FeatureCard
              title="Parteneri, cuscri, generații"
              desc="Nu doar părinte-copil — legi și parteneriate, cât și legăturile dintre familii."
              emoji="🤝"
            />
            <FeatureCard
              title="Acces de oriunde"
              desc="Din telefon sau laptop, arborele familiei tale e mereu la un click distanță."
              emoji="📱"
            />
          </div>
        </div>
      </section>

      {/* ───────────── CUM FUNCȚIONEAZĂ ───────────── */}
      <section id="cum-functioneaza" className="bg-white border-y border-earbore-border py-20 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-earbore-ink text-center mb-14">
            Trei pași. Câteva minute. Gata.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <Step number="1" title="Creezi cont gratuit" desc="Fără card, fără angajamente. Doar email și parolă." />
            <Step number="2" title="Adaugi primii membri" desc="Tu, părinții tăi, bunicii — apoi extinzi treptat spre restul familiei." />
            <Step number="3" title="Vezi familia prinzând viață" desc="Arborele se construiește singur, vizual, pe măsură ce adaugi legături." />
          </div>
        </div>
      </section>

      {/* ───────────── SOCIAL PROOF ───────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-earbore-gray text-sm uppercase tracking-wider font-semibold mb-8">
            Oameni care își păstrează deja povestea familiei
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Testimonial
              quote="Am reușit să adun în două seri toată istoria pe care bunica mi-o povestea de ani de zile. Acum nu se mai pierde."
              name="Ana M."
            />
            <Testimonial
              quote="Am descoperit rude despre care nu știam nimic, doar reconstruind arborele împreună cu părinții."
              name="Radu B."
            />
            <Testimonial
              quote="Interfața e atât de simplă încât și bunicul meu de 78 de ani a reușit să-și adauge singur poza."
              name="Ioana T."
            />
          </div>
        </div>
      </section>

      {/* ───────────── SUSȚINE PROIECTUL (donații) ───────────── */}
      <section id="sustine" className="py-20 bg-earbore-ink scroll-mt-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            eArbore rămâne gratuit — mereu
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Nu vindem abonamente. Nu blocăm funcționalități.
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            eArbore e gratuit pentru toată lumea, pentru totdeauna. Serverele, stocarea pozelor
            și dezvoltarea continuă costă bani — dacă platforma te ajută, o donație (oricât de mică)
            ne ține online pentru încă o familie.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <DonateTier label="O cafea" amount="10 lei" impact="Susține serverele o zi" href={DONATE_URL} />
            <DonateTier label="Susținător" amount="25 lei" impact="Stochează pozele a 3 familii" href={DONATE_URL} highlighted />
            <DonateTier label="Erou al familiei" amount="50 lei" impact="Ține platforma online o lună" href={DONATE_URL} />
          </div>

          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="inline-block text-white/60 text-sm underline hover:text-white transition-colors">
            sau donează o sumă personalizată →
          </a>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="intrebari" className="py-20 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-earbore-ink text-center mb-12">Întrebări frecvente</h2>
          <div className="flex flex-col gap-4">
            <FaqItem q="Chiar e gratuit, fără costuri ascunse?" a="Da. Nu cerem card la înregistrare și nu blocăm funcționalități în spatele unui abonament. Donațiile sunt 100% opționale." />
            <FaqItem q="Ce se întâmplă cu pozele și datele familiei mele?" a="Sunt stocate securizat și nu sunt vândute sau partajate cu terți. Arborele tău este privat, vizibil doar pentru tine." />
            <FaqItem q="Pot să adaug rude decedate?" a="Da, poți marca un membru ca decedat și îi poți păstra povestea, pozele și datele — exact ca pentru orice alt membru." />
            <FaqItem q="Cât de mare poate fi arborele?" a="Nu există o limită artificială — poți adăuga câte generații și rude ai nevoie." />
          </div>
        </div>
      </section>

      {/* ───────────── CTA FINAL ───────────── */}
      <section className="bg-white border-t border-earbore-border py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-earbore-ink mb-4">
            Începe astăzi. Familia ta merită să fie ținută minte.
          </h2>
          <p className="text-earbore-gray text-base mb-8">
            Fără card. Fără abonament. Gata în mai puțin de un minut.
          </p>
          <button onClick={() => navigate('/auth?mode=register')} className="btn-primary text-base px-8 py-3.5">
            Construiește-ți arborele gratuit →
          </button>
        </div>
      </section>

      <footer className="border-t border-earbore-border py-6 text-center text-sm text-earbore-gray bg-earbore-grayLight">
        © {new Date().getFullYear()} eArbore. Toate drepturile rezervate.
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