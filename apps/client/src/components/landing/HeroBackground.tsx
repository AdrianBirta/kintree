import React from 'react';

// Paleta decorativă: violetul brandului + câteva accente moderne care
// se potrivesc cu restul interfeței (info, success, mesagerie).
const VIOLET = '#7c4dd4';
const BLUE = '#2f6fed';
const TEAL = '#0e9aa7';
const PINK = '#ec6b7f';
const AMBER = '#d99a3d';
const WHITE = '#ffffff';

const NODE_FILL = 'rgba(255,255,255,0.82)';
const SKELETON = '#d6c3f2';

// ─────────────────────────────────────────────────────────────
// Linii punctate de fundal (întind tot hero-ul)
// ─────────────────────────────────────────────────────────────
interface LineDef {
  d: string;
  color: string;
  opacity: number;
  width?: number;
  dash: string;
  reverse?: boolean;
}

// Toate perioadele de dash (suma celor două numere) împart exact 360,
// ca animația să se repete fără "salt" vizibil.
const LINES: LineDef[] = [
  // valuri albe (vizibile pe gradientul lavandă din partea de sus)
  { d: 'M-50 180 C250 60, 450 320, 720 200 S1200 80, 1500 240', color: WHITE, opacity: 0.95, width: 1.8, dash: '7 11' },
  { d: 'M-50 520 C300 420, 520 640, 860 520 S1250 400, 1500 560', color: WHITE, opacity: 0.8, width: 1.6, dash: '7 11', reverse: true },
  { d: 'M240 -20 C340 300, 120 520, 260 900 S160 1250, 300 1450', color: WHITE, opacity: 0.7, width: 1.5, dash: '10 10' },

  // valuri colorate, mai discrete
  { d: 'M-60 330 C220 420, 420 150, 760 300 S1180 420, 1500 300', color: VIOLET, opacity: 0.3, width: 1.4, dash: '3 9' },
  { d: 'M-40 760 C260 640, 560 900, 900 760 S1280 640, 1500 800', color: BLUE, opacity: 0.24, width: 1.5, dash: '10 10', reverse: true },
  { d: 'M-50 980 C240 900, 600 1100, 920 980 S1260 900, 1500 1010', color: TEAL, opacity: 0.26, width: 1.5, dash: '6 12' },
  { d: 'M1500 120 C1200 220, 1000 20, 700 110 S200 220, -50 100', color: PINK, opacity: 0.3, width: 1.4, dash: '2 8', reverse: true },
  { d: 'M1200 -20 C1100 260, 1320 520, 1180 880 S1300 1220, 1160 1450', color: VIOLET, opacity: 0.22, width: 1.4, dash: '4 8' },

  // conectori în unghi drept, ca într-o diagramă de flux
  { d: 'M-20 640 H260 Q280 640 280 660 V760 Q280 780 300 780 H520', color: WHITE, opacity: 0.85, width: 1.6, dash: '6 6' },
  { d: 'M1460 420 H1190 Q1170 420 1170 440 V560 Q1170 580 1150 580 H980', color: WHITE, opacity: 0.85, width: 1.6, dash: '6 6', reverse: true },
  { d: 'M-20 1120 H180 Q200 1120 200 1100 V980 Q200 960 220 960 H420', color: VIOLET, opacity: 0.28, width: 1.4, dash: '6 6' },
  { d: 'M1460 900 H1260 Q1240 900 1240 920 V1040 Q1240 1060 1220 1060 H1000', color: BLUE, opacity: 0.26, width: 1.4, dash: '6 6', reverse: true },
];

const FlowLines: React.FC = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 1440 1400"
    preserveAspectRatio="none"
    fill="none"
  >
    {LINES.map((l, i) => (
      <path
        key={i}
        d={l.d}
        stroke={l.color}
        strokeOpacity={l.opacity}
        strokeWidth={l.width ?? 1.5}
        strokeDasharray={l.dash}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className={l.reverse ? 'hero-dash-bwd' : 'hero-dash-fwd'}
      />
    ))}
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Piese mici pentru flow chart-uri
// ─────────────────────────────────────────────────────────────
type Dir = 'down' | 'left' | 'right';
const ROTATION: Record<Dir, number> = { down: 0, left: 90, right: -90 };

const Chevron: React.FC<{ x: number; y: number; dir?: Dir; color: string }> = ({ x, y, dir = 'down', color }) => (
  <path
    d="M -4.5 -6 L 0 0 L 4.5 -6"
    transform={`translate(${x} ${y}) rotate(${ROTATION[dir]})`}
    fill="none"
    stroke={color}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const Link: React.FC<{ d: string; color: string }> = ({ d, color }) => (
  <path
    d={d}
    fill="none"
    stroke={color}
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeDasharray="4 5"
    className="hero-dash-fwd"
  />
);

const Bar: React.FC<{ x: number; y: number; w: number; h?: number; color?: string }> = ({
  x, y, w, h = 5, color = SKELETON,
}) => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={color} />;

const Node: React.FC<{ x: number; y: number; w: number; h: number; rx?: number; color: string }> = ({
  x, y, w, h, rx = 10, color,
}) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={NODE_FILL} stroke={color} strokeWidth={1.5} />;

// ─────────────────────────────────────────────────────────────
// Flow chart A — pornire → proces → decizie → două ramuri → final
// ─────────────────────────────────────────────────────────────
const FlowChartA: React.FC = () => (
  <svg viewBox="0 0 260 340" className="h-auto w-full" fill="none">
    <Link d="M130 44 V76" color={VIOLET} />
    <Link d="M130 124 V158" color={VIOLET} />
    <Link d="M70 196 H40 V254" color={BLUE} />
    <Link d="M190 196 H220 V254" color={BLUE} />
    <Link d="M40 296 V322 H121" color={TEAL} />
    <Link d="M220 296 V322 H139" color={TEAL} />

    <Chevron x={130} y={78} color={VIOLET} />
    <Chevron x={130} y={160} color={VIOLET} />
    <Chevron x={40} y={256} color={BLUE} />
    <Chevron x={220} y={256} color={BLUE} />
    <Chevron x={121} y={322} dir="right" color={TEAL} />
    <Chevron x={139} y={322} dir="left" color={TEAL} />

    {/* start */}
    <Node x={70} y={10} w={120} h={34} rx={17} color={VIOLET} />
    <circle cx={90} cy={27} r={5} fill={VIOLET} />
    <Bar x={102} y={24} w={62} />

    {/* proces */}
    <Node x={60} y={80} w={140} h={44} color={VIOLET} />
    <Bar x={74} y={94} w={80} />
    <Bar x={74} y={106} w={50} color="#ece0fa" />

    {/* decizie */}
    <path d="M130 160 L190 196 L130 232 L70 196 Z" fill={NODE_FILL} stroke={BLUE} strokeWidth={1.5} strokeLinejoin="round" />
    <Bar x={112} y={193} w={36} />

    {/* ramuri */}
    <Node x={0} y={256} w={80} h={40} color={PINK} />
    <Bar x={12} y={268} w={44} />
    <Bar x={12} y={278} w={28} color="#ece0fa" />

    <Node x={180} y={256} w={80} h={40} color={AMBER} />
    <Bar x={192} y={268} w={44} />
    <Bar x={192} y={278} w={28} color="#ece0fa" />

    {/* final */}
    <circle cx={130} cy={322} r={8} fill={WHITE} stroke={TEAL} strokeWidth={1.5} />
    <circle cx={130} cy={322} r={3} fill={TEAL} />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Flow chart B — organigramă → proces → bază de date
// ─────────────────────────────────────────────────────────────
const FlowChartB: React.FC = () => (
  <svg viewBox="0 0 280 304" className="h-auto w-full" fill="none">
    <Link d="M140 46 V72 H40 V96" color={VIOLET} />
    <Link d="M140 46 V96" color={VIOLET} />
    <Link d="M140 46 V72 H240 V96" color={VIOLET} />
    <Link d="M140 136 V166" color={PINK} />
    <Link d="M40 136 V190 H88" color={BLUE} />
    <Link d="M240 136 V190 H192" color={TEAL} />
    <Link d="M140 210 V238" color={AMBER} />

    <Chevron x={40} y={98} color={VIOLET} />
    <Chevron x={140} y={98} color={VIOLET} />
    <Chevron x={240} y={98} color={VIOLET} />
    <Chevron x={140} y={168} color={PINK} />
    <Chevron x={90} y={190} dir="right" color={BLUE} />
    <Chevron x={190} y={190} dir="left" color={TEAL} />
    <Chevron x={140} y={241} color={AMBER} />

    {/* rădăcină */}
    <Node x={95} y={10} w={90} h={36} rx={18} color={VIOLET} />
    <circle cx={115} cy={28} r={7} fill={VIOLET} />
    <Bar x={128} y={25} w={44} />

    {/* copii */}
    <Node x={4} y={100} w={72} h={36} color={BLUE} />
    <circle cx={18} cy={118} r={6} fill={BLUE} fillOpacity={0.35} />
    <Bar x={30} y={113} w={34} />
    <Bar x={30} y={122} w={22} h={4} color="#ece0fa" />

    <Node x={104} y={100} w={72} h={36} color={PINK} />
    <circle cx={118} cy={118} r={6} fill={PINK} fillOpacity={0.4} />
    <Bar x={130} y={113} w={34} />
    <Bar x={130} y={122} w={22} h={4} color="#ece0fa" />

    <Node x={204} y={100} w={72} h={36} color={TEAL} />
    <circle cx={218} cy={118} r={6} fill={TEAL} fillOpacity={0.4} />
    <Bar x={230} y={113} w={34} />
    <Bar x={230} y={122} w={22} h={4} color="#ece0fa" />

    {/* proces */}
    <Node x={90} y={170} w={100} h={40} color={AMBER} />
    <Bar x={104} y={183} w={60} />
    <Bar x={104} y={193} w={38} color="#ece0fa" />

    {/* bază de date (cilindru) */}
    <path d="M106 252 V286 A34 9 0 0 0 174 286 V252" fill={NODE_FILL} stroke={VIOLET} strokeWidth={1.5} />
    <path d="M106 269 A34 9 0 0 0 174 269" stroke={VIOLET} strokeWidth={1.2} strokeOpacity={0.6} />
    <ellipse cx={140} cy={252} rx={34} ry={9} fill={NODE_FILL} stroke={VIOLET} strokeWidth={1.5} />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Componenta principală
// ─────────────────────────────────────────────────────────────
const HeroBackground: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    {/* 1. gradient de bază + "strălucire" albă în spatele titlului */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(60% 38% at 50% 20%, rgba(255,255,255,0.55), transparent 70%), ' +
          'linear-gradient(180deg, #e4d7f7 0%, #ece0fa 30%, #f4eefc 65%, #f8f6fb 100%)',
      }}
    />

    {/* 2. blob-uri colorate, difuze */}
    <div className="absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full bg-earbore-400/25 blur-3xl" />
    <div className="absolute -right-20 -top-24 h-[380px] w-[380px] rounded-full bg-[#2f6fed]/15 blur-3xl" />
    <div className="absolute left-1/2 top-[36%] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#ec6b7f]/10 blur-3xl" />
    <div className="absolute -left-24 bottom-[12%] h-[320px] w-[320px] rounded-full bg-[#0e9aa7]/10 blur-3xl" />

    {/* 3. grilă de puncte, care se estompează spre jos */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: 'radial-gradient(rgba(98,54,173,0.16) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
      }}
    />

    {/* 4. linii punctate */}
    <FlowLines />

    {/* 5. flow chart-uri decorative — doar pe ecrane late, ca să nu stea peste text */}
    <div className="hero-float absolute -left-5 top-24 hidden w-[150px] opacity-75 drop-shadow-[0_8px_18px_rgba(98,54,173,0.14)] xl:block 2xl:left-6 2xl:w-[230px]">
      <FlowChartA />
    </div>
    <div
      className="hero-float absolute -right-5 top-40 hidden w-[160px] opacity-75 drop-shadow-[0_8px_18px_rgba(98,54,173,0.14)] xl:block 2xl:right-6 2xl:w-[240px]"
      style={{ animationDelay: '-4.5s' }}
    >
      <FlowChartB />
    </div>
  </div>
);

export default HeroBackground;