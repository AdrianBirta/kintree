import React, { useMemo } from 'react';
import { Box, Typography, Divider, useMediaQuery, useTheme } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import LayersIcon from '@mui/icons-material/Layers';
import type { FamilyTreeData } from '../../types/family';

interface Props {
  memberId: string;
  treeData: FamilyTreeData;
}

interface StatConfig {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorVar: string;
}

const StatCard: React.FC<StatConfig> = ({ icon, label, value, colorVar }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: { xs: 1.25, sm: 1.75 },
      p: { xs: 1.5, sm: 2 },
      borderRadius: 3,
      background: `color-mix(in srgb, var(${colorVar}) 10%, white)`,
      border: '1px solid',
      borderColor: `color-mix(in srgb, var(${colorVar}) 25%, white)`,
    }}
  >
    <Box
      sx={{
        width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, borderRadius: 2.5, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: `var(${colorVar})`,
        color: 'white',
        boxShadow: `0 4px 10px color-mix(in srgb, var(${colorVar}) 40%, transparent)`,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, color: `var(${colorVar})`, fontSize: { xs: 18, sm: 22 } }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

// ─────────────────────────────────────────────────────────────
// DONUT CHART — cercuri concentrice cu stroke-dasharray. Fiecare
// segment primește o felie proporțională cu valoarea lui din total.
// ─────────────────────────────────────────────────────────────
interface DonutSegment {
  label: string;
  value: number;
  color: string;
  description?: string;
  isCurrent?: boolean;
}

function buildDonutSlices(segments: DonutSegment[], radius: number) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const circumference = 2 * Math.PI * radius;
  let offsetAccum = 0;
  return segments.map((seg) => {
    const fraction = seg.value / total;
    const dash = fraction * circumference;
    const slice = { ...seg, fraction, dashArray: `${dash} ${circumference - dash}`, dashOffset: -offsetAccum };
    offsetAccum += dash;
    return slice;
  });
}

const DonutChart: React.FC<{
  segments: DonutSegment[];
  size: number;
  strokeWidth: number;
  centerValue?: React.ReactNode;
  centerLabel?: string;
}> = ({ segments, size, strokeWidth, centerValue, centerLabel }) => {
  const radius = (size - strokeWidth) / 2;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const slices = useMemo(() => buildDonutSlices(segments, radius), [segments, radius]);
  const visibleSlices = slices.filter((s) => s.value > 0);

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-earbore-grayLight)" strokeWidth={strokeWidth} />
        {total > 0 && (
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {visibleSlices.map((s, i) => (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={s.isCurrent ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={s.dashArray}
                strokeDashoffset={s.dashOffset}
                strokeLinecap={visibleSlices.length > 1 ? 'butt' : 'round'}
                opacity={s.isCurrent || !segments.some((seg) => seg.isCurrent) ? 1 : 0.55}
              />
            ))}
          </g>
        )}
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 1 }}>
        {centerValue !== undefined && (
          <Typography sx={{ fontWeight: 800, color: 'var(--color-earbore-700)', lineHeight: 1, fontSize: size < 145 ? 18 : 22 }}>
            {centerValue}
          </Typography>
        )}
        {centerLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.2, mt: 0.3, fontSize: size < 145 ? 10 : 12 }}>
            {centerLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const DonutLegend: React.FC<{ segments: DonutSegment[] }> = ({ segments }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const visible = segments.filter((s) => s.value > 0);

  if (visible.length === 0) {
    return <Typography variant="body2" color="text.secondary">Încă nu sunt suficiente date.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1, flex: 1, width: '100%' }}>
      {visible.map((seg) => (
        <Box key={seg.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: seg.color, mt: 0.5, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
              {seg.label}
              <Box component="span" sx={{ color: 'var(--color-earbore-gray)', fontWeight: 500 }}>
                · {seg.value} {total > 0 ? `(${Math.round((seg.value / total) * 100)}%)` : ''}
              </Box>
              {seg.isCurrent && (
                <Box
                  component="span"
                  sx={{
                    fontSize: 10, fontWeight: 800, color: 'white', bgcolor: 'var(--color-earbore-600)',
                    px: 0.9, py: 0.1, borderRadius: 999, letterSpacing: '0.03em',
                  }}
                >
                  *
                </Box>
              )}
            </Typography>
            {seg.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.35 }}>
                {seg.description}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

function lerpColor(hexA: string, hexB: string, t: number): string {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`;
}

const MemberStatsPanel: React.FC<Props> = ({ memberId, treeData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // NOU — controlează layout-ul donut+legendă

  const stats = useMemo(() => {
    const { relations, partnerships, members } = treeData;

    const parentsByChild = new Map<string, string[]>();
    const childrenByParent = new Map<string, string[]>();
    relations.forEach((r) => {
      const p = parentsByChild.get(r.childId) ?? [];
      p.push(r.parentId);
      parentsByChild.set(r.childId, p);
      const c = childrenByParent.get(r.parentId) ?? [];
      c.push(r.childId);
      childrenByParent.set(r.parentId, c);
    });

    const ancestors = new Set<string>();
    let frontier = [memberId];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const p of parentsByChild.get(id) ?? []) {
          if (!ancestors.has(p)) {
            ancestors.add(p);
            next.push(p);
          }
        }
      }
      frontier = next;
    }

    const descendants = new Set<string>();
    frontier = [memberId];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const c of childrenByParent.get(id) ?? []) {
          if (!descendants.has(c)) {
            descendants.add(c);
            next.push(c);
          }
        }
      }
      frontier = next;
    }

    const myParents = new Set(parentsByChild.get(memberId) ?? []);
    const siblings = new Set<string>();
    if (myParents.size > 0) {
      relations.forEach((r) => {
        if (r.childId !== memberId && myParents.has(r.parentId)) siblings.add(r.childId);
      });
    }

    const partners = new Set<string>();
    partnerships.forEach((p) => {
      if (p.partnerAId === memberId) partners.add(p.partnerBId);
      if (p.partnerBId === memberId) partners.add(p.partnerAId);
    });

    const relatedIds = new Set<string>([...ancestors, ...descendants, ...siblings, ...partners]);
    const othersCount = Math.max(0, members.length - 1 - relatedIds.size);

    const rankOf = new Map<string, number>();
    const computeRank = (id: string): number => {
      if (rankOf.has(id)) return rankOf.get(id)!;
      const parents = parentsByChild.get(id) ?? [];
      if (parents.length === 0) {
        rankOf.set(id, 0);
        return 0;
      }
      rankOf.set(id, 0);
      const maxParentRank = Math.max(...parents.map((p) => computeRank(p)));
      const rank = maxParentRank + 1;
      rankOf.set(id, rank);
      return rank;
    };
    members.forEach((m) => computeRank(m.id));

    const maxRank = members.length > 0 ? Math.max(...members.map((m) => rankOf.get(m.id) ?? 0)) : 0;
    const generationCounts = new Array(maxRank + 1).fill(0);
    members.forEach((m) => {
      generationCounts[rankOf.get(m.id) ?? 0]++;
    });

    return {
      ancestorsCount: ancestors.size,
      descendantsCount: descendants.size,
      siblingsCount: siblings.size,
      partnersCount: partners.size,
      othersCount,
      generation: rankOf.get(memberId) ?? 0,
      generationCounts,
      totalMembers: members.length,
    };
  }, [memberId, treeData]);

  const compositionSegments: DonutSegment[] = useMemo(() => [
    { label: 'Persoana', value: 1, color: '#6236ad', description: 'Punctul de plecare al acestei statistici.' },
    { label: 'Strămoși', value: stats.ancestorsCount, color: '#2f6fed', description: 'Părinți, bunici și înaintașii lor, pe linia ascendentă.' },
    { label: 'Descendenți', value: stats.descendantsCount, color: '#2f9e6a', description: 'Copii, nepoți și urmașii lor, pe linia descendentă.' },
    { label: 'Frați / surori', value: stats.siblingsCount, color: '#d99a3d', description: 'Persoane cu cel puțin un părinte comun.' },
    { label: 'Parteneri', value: stats.partnersCount, color: '#d3324a', description: 'Persoane legate direct printr-un parteneriat.' },
    { label: 'Alte rude', value: stats.othersCount, color: '#9a94a8', description: 'Restul membrilor din arbore, fără o legătură directă (ex. cuscri, rude ale partenerilor).' },
  ], [stats]);

  const generationSegments: DonutSegment[] = useMemo(() => {
    const count = stats.generationCounts.length;
    return stats.generationCounts.map((value, i) => {
      const isCurrent = i === stats.generation;
      const t = count > 1 ? i / (count - 1) : 0;
      return {
        label: `Generația ${i + 1}`,
        value,
        color: isCurrent ? '#4f2a8c' : lerpColor('#ece0fa', '#9b72e0', t),
        isCurrent,
        description: isCurrent
          ? 'Generația în care se află această persoană.'
          : i < stats.generation
            ? 'O generație mai veche.'
            : 'O generație mai tânără.',
      };
    });
  }, [stats]);

  // dimensiuni responsive pentru donut — mai mic pe mobil, ca să nu
  // forțeze scroll orizontal sau să înghesuie legenda alături
  const chartSize = isMobile ? 138 : 156;
  const strokeWidth = isMobile ? 18 : 22;

  const renderDonutBlock = (
    icon: React.ReactNode,
    title: string,
    explanation: string,
    segments: DonutSegment[],
    centerValue: React.ReactNode,
    centerLabel: string,
  ) => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {icon}
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5, lineHeight: 1.4 }}>
        {explanation}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 },
          alignItems: { xs: 'center', sm: 'center' },
        }}
      >
        <DonutChart
          segments={segments}
          size={chartSize}
          strokeWidth={strokeWidth}
          centerValue={centerValue}
          centerLabel={centerLabel}
        />
        <DonutLegend segments={segments} />
      </Box>
    </Box>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-xs font-semibold text-earbore-500 uppercase tracking-wider">
          Statistici din arbore
        </h2>
        <span className="text-xs text-earbore-gray">{stats.totalMembers} membri în total</span>
      </div>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: { xs: 1.25, sm: 2 } }}>
        <StatCard icon={<AccountTreeIcon fontSize="small" />} label="Strămoși" value={stats.ancestorsCount} colorVar="--color-earbore-info" />
        <StatCard icon={<FamilyRestroomIcon fontSize="small" />} label="Descendenți" value={stats.descendantsCount} colorVar="--color-earbore-success" />
        <StatCard icon={<Diversity3Icon fontSize="small" />} label="Frați / surori" value={stats.siblingsCount} colorVar="--color-earbore-warning" />
        <StatCard icon={<FavoriteIcon fontSize="small" />} label="Parteneri" value={stats.partnersCount} colorVar="--color-earbore-danger" />
      </Box>

      <Divider sx={{ my: { xs: 2.5, sm: 3.5 } }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 3.5, lg: 5 } }}>
        {renderDonutBlock(
          <DonutLargeIcon sx={{ fontSize: 18, color: 'var(--color-earbore-600)' }} />,
          'Cum se raportează la ceilalți membri',
          'Fiecare felie arată câți membri din arbore se află în fiecare tip de relație.',
          compositionSegments,
          stats.totalMembers,
          'membri în arbore',
        )}
        {renderDonutBlock(
          <LayersIcon sx={{ fontSize: 18, color: 'var(--color-earbore-600)' }} />,
          'Generația în arbore',
          'Fiecare felie e o generație — G1 e cea mai veche cunoscută. Felia mov intens, marcată „*", e generația curentă.',
          generationSegments,
          `G${stats.generation + 1}`,
          'generația',
        )}
      </Box>
    </div>
  );
};

export default MemberStatsPanel;