import React from 'react';

const TreePreviewSvg: React.FC = () => {
  return (
    <svg
      viewBox="0 0 800 380"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      role="img"
      aria-label="Previzualizare arbore genealogic"
    >
      <defs>
        <linearGradient id="earboreBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8f4fd" />
          <stop offset="100%" stopColor="#ece0fa" />
        </linearGradient>

        <linearGradient id="cardShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fbf9fe" />
        </linearGradient>

        <filter id="cardShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#4f2a8c" floodOpacity="0.14" />
        </filter>

        <radialGradient id="blue" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#6fa0e8" />
          <stop offset="100%" stopColor="#3f6fb0" />
        </radialGradient>
        <radialGradient id="pink" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#e07d92" />
          <stop offset="100%" stopColor="#c14a5f" />
        </radialGradient>
        <radialGradient id="lilac" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#bda3e0" />
          <stop offset="100%" stopColor="#9b7fc4" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="800" height="380" rx="28" fill="url(#earboreBg)" />

      {/* decor discret — cerculețe blânde în fundal */}
      <circle cx="60" cy="330" r="70" fill="#ffffff" opacity="0.25" />
      <circle cx="750" cy="55" r="90" fill="#ffffff" opacity="0.2" />

      {/* ══════════ CONECTORI ══════════ */}
      {/* bunici → părinți (linii punctate, generație → generație) */}
      <path d="M 195 108 C 195 138, 300 138, 300 168" stroke="#b99cea" strokeWidth="2" fill="none" strokeDasharray="1 7" strokeLinecap="round" opacity="0.8" />
      <path d="M 405 108 C 405 138, 300 138, 300 168" stroke="#b99cea" strokeWidth="2" fill="none" strokeDasharray="1 7" strokeLinecap="round" opacity="0.8" />
      <path d="M 600 108 C 600 138, 545 138, 545 168" stroke="#b99cea" strokeWidth="2" fill="none" strokeDasharray="1 7" strokeLinecap="round" opacity="0.8" />

      {/* părinți → copii (linii pline, mov brand) */}
      <path d="M 300 203 C 300 235, 245 235, 245 265" stroke="#7c4dd4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 300 203 C 300 235, 355 235, 355 265" stroke="#7c4dd4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 545 203 C 545 235, 545 235, 545 265" stroke="#7c4dd4" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* linii de parteneriat (maro/auriu, cu unire mică) */}
      <Union x1={155} y1={73} x2={235} y2={73} />
      <Union x1={365} y1={73} x2={445} y2={73} />
      <Union x1={265} y1={185} x2={335} y2={185} />

      {/* ══════════ GENERAȚIA 1 — bunici + străbunic ══════════ */}
      <MemberCard x={120} y={38} label="Bunic" gradient="url(#blue)" />
      <MemberCard x={200} y={38} label="Bunica" gradient="url(#pink)" />

      <MemberCard x={330} y={38} label="Bunic" gradient="url(#blue)" />
      <MemberCard x={410} y={38} label="Bunica" gradient="url(#pink)" />

      <MemberCard x={565} y={38} label="Străbunic" gradient="url(#lilac)" small />

      {/* ══════════ GENERAȚIA 2 — părinți + unchi ══════════ */}
      <MemberCard x={265} y={150} label="Tata" gradient="url(#blue)" />
      <MemberCard x={345} y={150} label="Mama" gradient="url(#pink)" />

      <MemberCard x={565} y={150} label="Unchi" gradient="url(#blue)" />

      {/* ══════════ GENERAȚIA 3 — copii ══════════ */}
      <MemberCard x={210} y={262} label="Fiu" gradient="url(#blue)" />
      <MemberCard x={310} y={262} label="Fiică" gradient="url(#pink)" />
      <MemberCard x={520} y={262} label="Nepot" gradient="url(#blue)" small />

      {/* etichetă discretă */}
      <text x="400" y="358" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="13" fill="#9a8f7a" letterSpacing="0.3">
        strămoși → generația ta → urmași
      </text>
    </svg>
  );
};

interface UnionProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const Union: React.FC<UnionProps> = ({ x1, y1, x2, y2 }) => {
  const midX = (x1 + x2) / 2;
  return (
    <g opacity="0.85">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c2a274" strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" />
      <circle cx={midX} cy={y1} r="3.5" fill="#c2a274" />
    </g>
  );
};

interface MemberCardProps {
  x: number;
  y: number;
  label: string;
  gradient: string;
  small?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ x, y, label, gradient, small }) => {
  const w = small ? 62 : 76;
  const h = small ? 62 : 76;
  const r = small ? 18 : 22;
  const photoR = small ? 13 : 16;

  return (
    <g filter="url(#cardShadow)">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill="url(#cardShine)"
        stroke="#e7e1f0"
        strokeWidth="1.5"
      />
      <circle cx={x + w / 2} cy={y + h / 2 - 8} r={photoR} fill={gradient} />
      <circle cx={x + w / 2} cy={y + h / 2 - 8} r={photoR} fill="none" stroke="#ffffff" strokeWidth="2" />
      <text
        x={x + w / 2}
        y={y + h - 10}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize={small ? 9.5 : 11}
        fontWeight={600}
        fill="#4a4358"
      >
        {label}
      </text>
    </g>
  );
};

export default TreePreviewSvg;