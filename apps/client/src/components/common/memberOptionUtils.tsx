import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import type { FamilyMember } from '../../types/family';
import { calculateAge, isDeceased } from '../../utils/age';

// Elimină intrările duplicate (același id) dintr-o listă de membri.
// Necesar pentru că sursele de date (tree / listă) pot conține uneori
// aceeași persoană de mai multe ori (ex. din cauza join-urilor pe relații),
// iar Autocomplete-ul MUI arăta atunci "dubluri" în listă și, mai grav,
// eticheta greșită în timpul filtrării — din lipsă de identitate (key)
// stabilă per opțiune.
export function dedupeMembers<T extends { id: string }>(members: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const m of members) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    result.push(m);
  }
  return result;
}

export const memberLabel = (m: FamilyMember) => `${m.firstName} ${m.lastName}`;

export function getGenderAccent(gender?: string | null): string {
  if (gender === 'FEMALE') return 'var(--color-earbore-danger)';
  if (gender === 'MALE') return 'var(--color-earbore-info)';
  return 'var(--color-earbore-400)';
}

// renderOption comun pentru toate Autocomplete-urile de membri — arată
// poza (sau inițiale), numele și un detaliu rapid (vârstă / ocupație /
// decedat), ca să fie limpede pe cine selectezi când sunt mai multe
// persoane cu nume asemănătoare. Extragem explicit `key` din props,
// pentru că MUI v6 nu-l mai aplică automat pe elementul returnat de
// renderOption — dacă rămâne lipsă, apare exact bug-ul de "labeluri
// greșite în timpul filtrării" descris mai sus.
export function renderMemberOption(
  props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
  option: FamilyMember,
) {
  const { key, ...rest } = props;
  const age = calculateAge(option.birthDate, option.deathDate);
  const deceased = isDeceased(option.deathDate);

  const detailParts: string[] = [];
  if (age !== null) detailParts.push(`${age} ani`);
  if (option.occupation) detailParts.push(option.occupation);
  if (deceased) detailParts.push('decedat');
  const detail = detailParts.join(' • ');

  return (
    <Box
      component="li"
      key={key ?? option.id}
      {...rest}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: '6px !important' }}
    >
      <Avatar
        src={option.imageUrl ?? undefined}
        sx={{
          width: 32, height: 32, fontSize: 12.5, fontWeight: 700, flexShrink: 0,
          border: '2px solid',
          borderColor: deceased ? 'var(--color-earbore-border)' : getGenderAccent(option.gender),
        }}
      >
        {option.firstName[0]}{option.lastName[0]}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
          {option.firstName} {option.lastName}
          {option.maidenName ? ` (n. ${option.maidenName})` : ''}
        </Typography>
        {detail && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }} noWrap>
            {detail}
          </Typography>
        )}
      </Box>
    </Box>
  );
}