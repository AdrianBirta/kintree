import React, { useId, useMemo } from 'react';
import { Box, Typography, Divider, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import LayersIcon from '@mui/icons-material/Layers';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CakeIcon from '@mui/icons-material/Cake';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { FamilyTreeData } from '../../types/family';
import { getGenderAccent } from './memberOptionUtils';
import { calculateAge, isDeceased } from '../../utils/age';

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

interface HighlightFactCardProps {
  icon: React.ReactNode;
  overline: string;
  headline: string;
  detail: string;
  colorVar: string;
}

const HighlightFactCard: React.FC<HighlightFactCardProps> = ({ icon, overline, headline, detail, colorVar }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.75,
      p: { xs: 1.5, sm: 2 },
      height: '100%',
      borderRadius: 3,
      boxSizing: 'border-box',
      background: `color-mix(in srgb, var(${colorVar}) 10%, white)`,
      border: '1px solid',
      borderColor: `color-mix(in srgb, var(${colorVar}) 25%, white)`,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
    }}
  >
    <Box
      sx={{
        width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, borderRadius: 2.5, flexShrink: 0, mt: 0.25,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: `var(${colorVar})`,
        color: 'white',
        boxShadow: `0 4px 10px color-mix(in srgb, var(${colorVar}) 40%, transparent)`,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 10.5 }}
      >
        {overline}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: `var(${colorVar})`, lineHeight: 1.25, mt: 0.25 }} noWrap>
        {headline}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, lineHeight: 1.35 }}>
        {detail}
      </Typography>
    </Box>
  </Box>
);

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
    const { t } = useTranslation();
    return <Typography variant="body2" color="text.secondary">{t('stats.generationAgeEmpty')}</Typography>;
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

interface TimelineEntry {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  ageYears: number;
  deceased: boolean;
  isCurrent: boolean;
  generation: number;
  gender?: string | null;
}

const TIMELINE_ROW_HEIGHT = 30;

function computeYearStep(span: number): number {
  if (span <= 30) return 5;
  if (span <= 60) return 10;
  if (span <= 120) return 20;
  return 25;
}

const LegendDot: React.FC<{ color: string; label: string; hollow?: boolean }> = ({ color, label, hollow }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
    <Box
      sx={{
        width: 9,
        height: 9,
        borderRadius: '50%',
        boxSizing: 'border-box',
        bgcolor: hollow ? 'white' : color,
        border: hollow ? `2px solid ${color}` : 'none',
      }}
    />
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Box>
);

const LifespanTimelineChart: React.FC<{ entries: TimelineEntry[]; isMobile: boolean }> = ({ entries, isMobile }) => {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('stats.timelineEmpty')}
      </Typography>
    );
  }

  const rawMin = Math.min(...entries.map((e) => e.startYear));
  const rawMax = Math.max(...entries.map((e) => e.endYear));
  const span = Math.max(rawMax - rawMin, 10);
  const pad = Math.max(2, Math.round(span * 0.06));
  const minYear = rawMin - pad;
  const maxYear = rawMax + pad;
  const totalSpan = Math.max(maxYear - minYear, 1);

  const percentForYear = (year: number) => ((year - minYear) / totalSpan) * 100;

  const step = computeYearStep(rawMax - rawMin);
  const firstTick = Math.ceil(minYear / step) * step;
  const ticks: number[] = [];
  for (let y = firstTick; y <= maxYear; y += step) ticks.push(y);

  const labelWidth = isMobile ? 82 : 108;
  const yearColWidth = 78;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ position: 'relative', height: 18, ml: `${labelWidth + 10}px`, mr: isMobile ? 0 : `${yearColWidth + 10}px` }}>
        {ticks.map((tick) => (
          <Typography
            key={tick}
            variant="caption"
            sx={{ position: 'absolute', left: `${percentForYear(tick)}%`, transform: 'translateX(-50%)', color: 'text.secondary', fontSize: 10.5 }}
          >
            {tick}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
        {entries.map((entry) => {
          const left = percentForYear(entry.startYear);
          const right = percentForYear(entry.endYear);
          const barColor = entry.deceased ? 'var(--color-earbore-gray)' : getGenderAccent(entry.gender);
          const endLabel = entry.deceased ? String(entry.endYear) : t('stats.present');

          return (
            <Box
              key={entry.id}
              title={t('stats.personTooltip', { name: entry.name, start: entry.startYear, end: endLabel, age: entry.ageYears })}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                height: TIMELINE_ROW_HEIGHT,
                borderRadius: 2,
                bgcolor: entry.isCurrent ? 'var(--color-earbore-50)' : 'transparent',
                px: entry.isCurrent ? 0.75 : 0,
              }}
            >
              <Typography
                noWrap
                variant="body2"
                sx={{
                  width: labelWidth,
                  flexShrink: 0,
                  fontSize: 12.5,
                  fontWeight: entry.isCurrent ? 800 : 500,
                  color: entry.isCurrent ? 'var(--color-earbore-700)' : 'text.primary',
                }}
              >
                {entry.name}
              </Typography>

              <Box sx={{ position: 'relative', flex: 1, height: 12 }}>
                <Box sx={{ position: 'absolute', inset: 0, borderRadius: 999, bgcolor: 'var(--color-earbore-grayLight)' }} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${left}%`,
                    width: `${Math.max(right - left, 1.5)}%`,
                    borderRadius: 999,
                    bgcolor: barColor,
                    outline: entry.isCurrent ? '2px solid var(--color-earbore-600)' : 'none',
                    outlineOffset: 1,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: `${right}%`,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxSizing: 'border-box',
                    bgcolor: entry.deceased ? barColor : 'white',
                    border: `2px solid ${barColor}`,
                  }}
                />
              </Box>

              {!isMobile && (
                <Typography variant="caption" sx={{ width: yearColWidth, textAlign: 'right', flexShrink: 0, color: 'text.secondary', fontSize: 11 }}>
                  {entry.startYear}–{entry.deceased ? entry.endYear : t('stats.present')}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, pt: 1.5, borderTop: '1px solid var(--color-earbore-border)' }}>
        <LegendDot color="var(--color-earbore-info)" label={t('stats.legendMale')} />
        <LegendDot color="var(--color-earbore-danger)" label={t('stats.legendFemale')} />
        <LegendDot color="var(--color-earbore-gray)" label={t('stats.legendDeceased')} />
        <LegendDot color="var(--color-earbore-gray)" label={t('stats.legendAlive')} hollow />
      </Box>
    </Box>
  );
};

interface GenerationAgePoint {
  generation: number;
  averageAge: number | null;
  sampleSize: number;
}

function smoothLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = p0.x + (p1.x - p0.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function smoothAreaPath(points: { x: number; y: number }[], baselineY: number): string {
  if (points.length === 0) return '';
  const linePath = smoothLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

const GenerationAgeChart: React.FC<{ points: GenerationAgePoint[]; currentGeneration: number }> = ({ points, currentGeneration }) => {
  const { t } = useTranslation();
  const gradientId = useId();
  const validPoints = points.filter(
    (p): p is GenerationAgePoint & { averageAge: number } => p.sampleSize > 0 && p.averageAge !== null,
  );

  if (validPoints.length < 2) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('stats.generationAgeEmpty')}
      </Typography>
    );
  }

  const width = 560;
  const height = 190;
  const paddingX = 26;
  const paddingTop = 30;
  const paddingBottom = 32;

  const values = validPoints.map((p) => p.averageAge);
  const minVal = Math.max(0, Math.min(...values) - 8);
  const maxVal = Math.max(...values) + 8;
  const valueRange = Math.max(maxVal - minVal, 1);

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;
  const baselineY = height - paddingBottom;

  const xForIndex = (i: number) => (validPoints.length > 1 ? paddingX + (i / (validPoints.length - 1)) * innerWidth : paddingX + innerWidth / 2);
  const yForValue = (v: number) => paddingTop + (1 - (v - minVal) / valueRange) * innerHeight;

  const coords = validPoints.map((p, i) => ({ x: xForIndex(i), y: yForValue(p.averageAge) }));

  return (
    <Box sx={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-earbore-500)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-earbore-500)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <line x1={paddingX} y1={baselineY} x2={width - paddingX} y2={baselineY} stroke="var(--color-earbore-border)" strokeWidth={1} />

        <path d={smoothAreaPath(coords, baselineY)} fill={`url(#${gradientId})`} stroke="none" />
        <path d={smoothLinePath(coords)} fill="none" stroke="var(--color-earbore-600)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {validPoints.map((p, i) => {
          const isCurrent = p.generation === currentGeneration;
          const { x, y } = coords[i];
          return (
            <g key={p.generation}>
              <circle
                cx={x}
                cy={y}
                r={isCurrent ? 7 : 5}
                fill={isCurrent ? 'var(--color-earbore-700)' : 'white'}
                stroke="var(--color-earbore-600)"
                strokeWidth={isCurrent ? 0 : 2}
              >
                <title>{`${t('stats.generationLabel', { n: p.generation + 1 })}: ${p.averageAge} ${t('common.years')} (${p.sampleSize})`}</title>
              </circle>
              <text x={x} y={y - 14} textAnchor="middle" fontSize={12} fontWeight={isCurrent ? 800 : 600} fill={isCurrent ? 'var(--color-earbore-700)' : 'var(--color-earbore-gray)'}>
                {p.averageAge}
              </text>
              <text x={x} y={baselineY + 20} textAnchor="middle" fontSize={11} fontWeight={isCurrent ? 800 : 500} fill={isCurrent ? 'var(--color-earbore-700)' : 'var(--color-earbore-gray)'}>
                {`G${p.generation + 1}`}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

const BIRTH_MONTH_TRACK_HEIGHT = 84;

const BirthMonthChart: React.FC<{ counts: number[]; currentMonth: number | null }> = ({ counts, currentMonth }) => {
  const { t } = useTranslation();
  const monthLabels = t('stats.months', { returnObjects: true }) as string[];
  const totalWithData = counts.reduce((a, b) => a + b, 0);

  if (totalWithData === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('stats.birthMonthEmpty')}
      </Typography>
    );
  }

  const maxCount = Math.max(...counts);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 0.5, sm: 1 }, height: BIRTH_MONTH_TRACK_HEIGHT }}>
        {counts.map((count, i) => {
          const isMine = i === currentMonth;
          const barHeight = count > 0 ? Math.max(5, Math.round((count / maxCount) * BIRTH_MONTH_TRACK_HEIGHT)) : 0;
          return (
            <Box key={i} sx={{ position: 'relative', flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              {count > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: barHeight + 4,
                    fontSize: 10.5,
                    fontWeight: isMine ? 800 : 600,
                    color: isMine ? 'var(--color-earbore-700)' : 'text.secondary',
                  }}
                >
                  {count}
                </Typography>
              )}
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 26,
                  height: barHeight,
                  borderRadius: '8px 8px 3px 3px',
                  bgcolor: isMine ? 'var(--color-earbore-600)' : 'var(--color-earbore-200)',
                  transition: 'height 0.2s ease',
                }}
              />
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, mt: 0.75 }}>
        {monthLabels.map((label, i) => (
          <Typography
            key={label}
            variant="caption"
            sx={{
              flex: 1,
              textAlign: 'center',
              fontSize: 10.5,
              fontWeight: i === currentMonth ? 800 : 500,
              color: i === currentMonth ? 'var(--color-earbore-700)' : 'text.secondary',
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

const MemberStatsPanel: React.FC<Props> = ({ memberId, treeData }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    members.forEach((m) => rankOf.set(m.id, 0));

    let changed = true;
    for (let iter = 0; iter < members.length + 5 && changed; iter++) {
      changed = false;

      relations.forEach((r) => {
        const parentRank = rankOf.get(r.parentId) ?? 0;
        const childRank = rankOf.get(r.childId) ?? 0;
        if (childRank < parentRank + 1) {
          rankOf.set(r.childId, parentRank + 1);
          changed = true;
        }
      });

      relations.forEach((r) => {
        const parentRank = rankOf.get(r.parentId) ?? 0;
        const childRank = rankOf.get(r.childId) ?? 0;
        if (parentRank < childRank - 1) {
          rankOf.set(r.parentId, childRank - 1);
          changed = true;
        }
      });

      partnerships.forEach((p) => {
        const rankA = rankOf.get(p.partnerAId) ?? 0;
        const rankB = rankOf.get(p.partnerBId) ?? 0;
        const maxRank = Math.max(rankA, rankB);
        if (rankA !== maxRank) { rankOf.set(p.partnerAId, maxRank); changed = true; }
        if (rankB !== maxRank) { rankOf.set(p.partnerBId, maxRank); changed = true; }
      });

      parentsByChild.forEach((parentIds) => {
        if (parentIds.length < 2) return;
        const maxRank = Math.max(...parentIds.map((pid) => rankOf.get(pid) ?? 0));
        parentIds.forEach((pid) => {
          if ((rankOf.get(pid) ?? 0) !== maxRank) {
            rankOf.set(pid, maxRank);
            changed = true;
          }
        });
      });
    }

    const maxRank = members.length > 0 ? Math.max(...members.map((m) => rankOf.get(m.id) ?? 0)) : 0;
    const generationCounts = new Array(maxRank + 1).fill(0);
    members.forEach((m) => {
      generationCounts[rankOf.get(m.id) ?? 0]++;
    });

    const currentYear = new Date().getFullYear();
    const lineageIds = new Set<string>([memberId, ...ancestors, ...descendants, ...siblings, ...partners]);

    let timelineEntries: TimelineEntry[] = members
      .filter((m) => lineageIds.has(m.id) && !!m.birthDate)
      .map((m) => {
        const startYear = new Date(m.birthDate as string).getFullYear();
        const deceased = isDeceased(m.deathDate);
        const endYear = deceased ? new Date(m.deathDate as string).getFullYear() : currentYear;
        const ageYears = calculateAge(m.birthDate, m.deathDate) ?? Math.max(0, endYear - startYear);
        return {
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          startYear,
          endYear: Math.max(endYear, startYear),
          ageYears,
          deceased,
          isCurrent: m.id === memberId,
          generation: rankOf.get(m.id) ?? 0,
          gender: m.gender,
        };
      });

    const MAX_TIMELINE_ENTRIES = 18;
    if (timelineEntries.length > MAX_TIMELINE_ENTRIES) {
      const myGeneration = rankOf.get(memberId) ?? 0;
      timelineEntries = [...timelineEntries]
        .sort((a, b) => Math.abs(a.generation - myGeneration) - Math.abs(b.generation - myGeneration))
        .slice(0, MAX_TIMELINE_ENTRIES);
    }
    timelineEntries.sort((a, b) => a.startYear - b.startYear || a.generation - b.generation);

    const ageSumByRank = new Array(maxRank + 1).fill(0);
    const ageCountByRank = new Array(maxRank + 1).fill(0);
    members.forEach((m) => {
      const age = calculateAge(m.birthDate, m.deathDate);
      if (age === null) return;
      const r = rankOf.get(m.id) ?? 0;
      ageSumByRank[r] += age;
      ageCountByRank[r] += 1;
    });
    const generationAgeSeries: GenerationAgePoint[] = ageSumByRank.map((sum, i) => ({
      generation: i,
      averageAge: ageCountByRank[i] > 0 ? Math.round(sum / ageCountByRank[i]) : null,
      sampleSize: ageCountByRank[i],
    }));

    const birthMonthCounts = new Array(12).fill(0);
    members.forEach((m) => {
      if (!m.birthDate) return;
      birthMonthCounts[new Date(m.birthDate).getMonth()] += 1;
    });
    const selfData = members.find((m) => m.id === memberId);
    const memberBirthMonth = selfData?.birthDate ? new Date(selfData.birthDate).getMonth() : null;

    let treeSpanStart: number | null = null;
    let treeSpanEnd: number | null = null;
    const longestLife = members.reduce<{ name: string; age: number } | null>((longest, m) => {
      if (!m.birthDate) return longest;
      const startYear = new Date(m.birthDate).getFullYear();
      const endYear = m.deathDate ? new Date(m.deathDate).getFullYear() : currentYear;
      treeSpanStart = treeSpanStart === null ? startYear : Math.min(treeSpanStart, startYear);
      treeSpanEnd = treeSpanEnd === null ? endYear : Math.max(treeSpanEnd, endYear);

      const age = calculateAge(m.birthDate, m.deathDate);
      return age !== null && (!longest || age > longest.age)
        ? { name: `${m.firstName} ${m.lastName}`, age }
        : longest;
    }, null);

    return {
      ancestorsCount: ancestors.size,
      descendantsCount: descendants.size,
      siblingsCount: siblings.size,
      partnersCount: partners.size,
      othersCount,
      generation: rankOf.get(memberId) ?? 0,
      generationCounts,
      totalMembers: members.length,
      timelineEntries,
      generationAgeSeries,
      birthMonthCounts,
      memberBirthMonth,
      treeSpanStart,
      treeSpanEnd,
      longestLife,
      currentYear,
    };
  }, [memberId, treeData]);

  const { treeSpanStart, treeSpanEnd, longestLife, currentYear } = stats;

  const compositionSegments: DonutSegment[] = useMemo(() => [
    { label: t('stats.personLabel'), value: 1, color: '#6236ad', description: t('stats.personDesc') },
    { label: t('stats.ancestors'), value: stats.ancestorsCount, color: '#2f6fed', description: t('stats.ancestorsDesc') },
    { label: t('stats.descendants'), value: stats.descendantsCount, color: '#2f9e6a', description: t('stats.descendantsDesc') },
    { label: t('stats.siblings'), value: stats.siblingsCount, color: '#d99a3d', description: t('stats.siblingsDesc') },
    { label: t('stats.partners'), value: stats.partnersCount, color: '#d3324a', description: t('stats.partnersDesc') },
    { label: t('stats.othersLabel'), value: stats.othersCount, color: '#9a94a8', description: t('stats.othersDesc') },
  ], [stats, t]);

  const generationSegments: DonutSegment[] = useMemo(() => {
    const count = stats.generationCounts.length;
    return stats.generationCounts.map((value, i) => {
      const isCurrent = i === stats.generation;
      const segT = count > 1 ? i / (count - 1) : 0;
      return {
        label: t('stats.generationLabel', { n: i + 1 }),
        value,
        color: isCurrent ? '#4f2a8c' : lerpColor('#ece0fa', '#9b72e0', segT),
        isCurrent,
        description: isCurrent
          ? t('stats.generationCurrentDesc')
          : i < stats.generation
            ? t('stats.generationOlderDesc')
            : t('stats.generationYoungerDesc'),
      };
    });
  }, [stats, t]);

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

  const renderSectionHeader = (icon: React.ReactNode, title: string, explanation: string) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {icon}
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
        {explanation}
      </Typography>
    </Box>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-xs font-semibold text-earbore-500 uppercase tracking-wider">
          {t('stats.panelTitle')}
        </h2>
        <span className="text-xs text-earbore-gray">{t('stats.totalMembers', { count: stats.totalMembers })}</span>
      </div>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: { xs: 1.25, sm: 2 } }}>
        <StatCard icon={<AccountTreeIcon fontSize="small" />} label={t('stats.ancestors')} value={stats.ancestorsCount} colorVar="--color-earbore-info" />
        <StatCard icon={<FamilyRestroomIcon fontSize="small" />} label={t('stats.descendants')} value={stats.descendantsCount} colorVar="--color-earbore-success" />
        <StatCard icon={<Diversity3Icon fontSize="small" />} label={t('stats.siblings')} value={stats.siblingsCount} colorVar="--color-earbore-warning" />
        <StatCard icon={<FavoriteIcon fontSize="small" />} label={t('stats.partners')} value={stats.partnersCount} colorVar="--color-earbore-danger" />
      </Box>

      <Divider sx={{ my: { xs: 2.5, sm: 3.5 } }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 3.5, lg: 5 } }}>
        {renderDonutBlock(
          <DonutLargeIcon sx={{ fontSize: 18, color: 'var(--color-earbore-600)' }} />,
          t('stats.compositionTitle'),
          t('stats.compositionDesc'),
          compositionSegments,
          stats.totalMembers,
          t('stats.compositionCenterLabel'),
        )}
        {renderDonutBlock(
          <LayersIcon sx={{ fontSize: 18, color: 'var(--color-earbore-600)' }} />,
          t('stats.generationTitle'),
          t('stats.generationDesc'),
          generationSegments,
          `G${stats.generation + 1}`,
          t('stats.generationCenterLabel'),
        )}
      </Box>

      {(treeSpanStart !== null || longestLife) && (
        <>
          <Divider sx={{ my: { xs: 2.5, sm: 3.5 } }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 2 } }}>
            {treeSpanStart !== null && treeSpanEnd !== null && (
              <HighlightFactCard
                icon={<DateRangeIcon fontSize="small" />}
                overline={t('stats.treeSpanOverline')}
                headline={t('stats.treeSpanHeadline', { years: treeSpanEnd - treeSpanStart })}
                detail={t('stats.treeSpanDetail', { start: treeSpanStart, end: treeSpanEnd === currentYear ? t('stats.present') : treeSpanEnd })}
                colorVar="--color-earbore-500"
              />
            )}
            {longestLife && (
              <HighlightFactCard
                icon={<EmojiEventsIcon fontSize="small" />}
                overline={t('stats.longevityOverline')}
                headline={longestLife.name}
                detail={t('stats.longevityDetail', { age: longestLife.age })}
                colorVar="--color-earbore-warning"
              />
            )}
          </Box>
        </>
      )}

      <Divider sx={{ my: { xs: 2.5, sm: 3.5 } }} />
      <Box>
        {renderSectionHeader(
          <TimelineIcon sx={{ fontSize: 18, color: 'var(--color-earbore-600)' }} />,
          t('stats.timelineTitle'),
          t('stats.timelineDesc'),
        )}
        <LifespanTimelineChart entries={stats.timelineEntries} isMobile={isMobile} />
      </Box>

      <Divider sx={{ my: { xs: 2.5, sm: 3.5 } }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 3.5, lg: 5 } }}>
        <Box>
          {renderSectionHeader(
            <TrendingUpIcon sx={{ fontSize: 18, color: 'var(--color-earbore-600)' }} />,
            t('stats.generationAgeTitle'),
            t('stats.generationAgeDesc'),
          )}
          <GenerationAgeChart points={stats.generationAgeSeries} currentGeneration={stats.generation} />
        </Box>
        <Box>
          {renderSectionHeader(
            <CakeIcon sx={{ fontSize: 18, color: 'var(--color-earbore-600)' }} />,
            t('stats.birthMonthTitle'),
            t('stats.birthMonthDesc'),
          )}
          <BirthMonthChart counts={stats.birthMonthCounts} currentMonth={stats.memberBirthMonth} />
        </Box>
      </Box>
    </div>
  );
};

export default MemberStatsPanel;