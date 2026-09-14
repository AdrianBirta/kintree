import React from 'react';
import { useTranslation } from 'react-i18next';

// Mockup vizual al unui arbore genealogic — pur decorativ, dar cu etichetele
// traduse prin i18n, ca să nu mai rămână blocat în română indiferent de limba
// aleasă de vizitator. Nu afișează nume reale, ci roluri generice
// (bunic, părinte, tu, copil), exact ca să funcționeze în orice limbă.
const TreePreviewSvg: React.FC = () => {
  const { t } = useTranslation();

  const nodes = [
    { x: 150, y: 50, r: 26, label: t('landingPreview.grandparent'), fill: 'var(--color-earbore-300)' },
    { x: 230, y: 50, r: 26, label: t('landingPreview.grandparent'), fill: 'var(--color-earbore-300)' },
    { x: 190, y: 140, r: 28, label: t('landingPreview.parent'), fill: 'var(--color-earbore-400)' },
    { x: 190, y: 230, r: 32, label: t('landingPreview.you'), fill: 'var(--color-earbore-600)', isSelf: true },
    { x: 330, y: 230, r: 26, label: t('landingPreview.child'), fill: 'var(--color-earbore-400)' },
  ];

  const personIcon = (cx: number, cy: number, r: number, fill: string) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx} cy={cy - r * 0.28} r={r * 0.32} fill="white" opacity={0.9} />
      <path
        d={`M ${cx - r * 0.5} ${cy + r * 0.55} Q ${cx} ${cy + r * 0.05} ${cx + r * 0.5} ${cy + r * 0.55}`}
        stroke="white"
        strokeWidth={r * 0.28}
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
    </g>
  );

  return (
    <svg viewBox="0 0 480 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="480" height="300" fill="var(--color-earbore-grayLight)" />

      {/* conectori */}
      <path d="M 150 76 L 190 112" stroke="var(--color-earbore-300)" strokeWidth="3" fill="none" />
      <path d="M 230 76 L 190 112" stroke="var(--color-earbore-300)" strokeWidth="3" fill="none" />
      <path d="M 190 168 L 190 198" stroke="var(--color-earbore-400)" strokeWidth="3" fill="none" />
      <path d="M 190 230 L 330 230" stroke="var(--color-earbore-400)" strokeWidth="3" strokeDasharray="5 5" fill="none" />

      {nodes.map((n, i) => (
        <g key={i}>
          {personIcon(n.x, n.y, n.r, n.fill)}
          {n.isSelf && (
            <circle cx={n.x} cy={n.y} r={n.r + 5} fill="none" stroke="var(--color-earbore-600)" strokeWidth="2.5" />
          )}
          <text
            x={n.x}
            y={n.y + n.r + 18}
            textAnchor="middle"
            fontSize="13"
            fontWeight={n.isSelf ? 700 : 500}
            fill={n.isSelf ? 'var(--color-earbore-700)' : 'var(--color-earbore-gray)'}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default TreePreviewSvg;