import { differenceInYears } from 'date-fns';

export function calculateAge(birthDate?: string | null, deathDate?: string | null): number | null {
  if (!birthDate) return null;
  const start = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();
  return differenceInYears(end, start);
}

export function isDeceased(deathDate?: string | null): boolean {
  return !!deathDate;
}