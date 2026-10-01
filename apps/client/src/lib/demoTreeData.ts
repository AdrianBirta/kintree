import type { FamilyMember, FamilyTreeData, ParentChildRelation, Partnership } from '../types/family';

// Arbori demo, folosiți DOAR pe landing page (fără apeluri la backend).
// - DEMO_TREE    → 9 persoane, 3 generații (previzualizarea 2D)
// - DEMO_TREE_3D → 18 persoane, 4 generații (previzualizarea 3D)

const NOW = '2026-01-01T00:00:00.000Z';

// Pozele se pun în: public/assets/demo/<slug>.jpg
// Dacă un fișier lipsește, UI-ul afișează automat inițialele (vezi useImageFallbackTree).
export const DEMO_IMAGES_BASE = '/assets/demo';
export const DEMO_IMAGES_EXT = 'jpg';
const demoImage = (slug: string) => `${DEMO_IMAGES_BASE}/${slug}.${DEMO_IMAGES_EXT}`;

function person(
  slug: string,
  firstName: string,
  lastName: string,
  gender: FamilyMember['gender'],
  birthDate: string,
  extra: Partial<FamilyMember> = {},
): FamilyMember {
  return {
    id: `demo-${slug}`,
    firstName,
    lastName,
    gender,
    birthDate,
    imageUrl: demoImage(slug),
    ownerId: 'demo',
    createdAt: NOW,
    updatedAt: NOW,
    ...extra,
  };
}

let relCounter = 0;
function parentsOf(childSlug: string, ...parentSlugs: string[]): ParentChildRelation[] {
  return parentSlugs.map((p) => ({
    id: `r${++relCounter}`,
    parentId: `demo-${p}`,
    childId: `demo-${childSlug}`,
  }));
}

function couple(id: string, a: string, b: string, status: string): Partnership {
  return { id, partnerAId: `demo-${a}`, partnerBId: `demo-${b}`, status };
}

const FULL_MEMBERS: FamilyMember[] = [
  // generația 1
  person('ion', 'Ion', 'Popescu', 'MALE', '1940-04-12', { deathDate: '2016-09-03' }),
  person('maria', 'Maria', 'Popescu', 'FEMALE', '1943-08-21'),
  person('gheorghe', 'Gheorghe', 'Ionescu', 'MALE', '1938-02-09', { deathDate: '2009-11-15' }),
  person('ana', 'Ana', 'Ionescu', 'FEMALE', '1942-06-30'),

  // generația 2
  person('mihai', 'Mihai', 'Popescu', 'MALE', '1967-03-15'),
  person('elena', 'Elena', 'Popescu', 'FEMALE', '1969-11-02', { maidenName: 'Ionescu' }),
  person('andrei', 'Andrei', 'Popescu', 'MALE', '1972-06-28'),
  person('carmen', 'Carmen', 'Popescu', 'FEMALE', '1974-01-19', { maidenName: 'Dumitru' }),
  person('doina', 'Doina', 'Ionescu', 'FEMALE', '1971-09-05'),

  // generația 3
  person('alex', 'Alex', 'Popescu', 'MALE', '1996-05-09'),
  person('diana', 'Diana', 'Stan', 'FEMALE', '1997-12-24'),
  person('sofia', 'Sofia', 'Popescu', 'FEMALE', '1999-09-17'),
  person('matei', 'Matei', 'Popescu', 'MALE', '2003-01-30'),
  person('luca', 'Luca', 'Popescu', 'MALE', '2001-07-11'),
  person('ioana', 'Ioana', 'Popescu', 'FEMALE', '2005-04-02'),
  person('radu', 'Radu', 'Ionescu', 'MALE', '1998-10-21'),

  // generația 4
  person('tudor', 'Tudor', 'Popescu', 'MALE', '2022-03-08'),
  person('irina', 'Irina', 'Popescu', 'FEMALE', '2024-08-14'),
];

const FULL_RELATIONS: ParentChildRelation[] = [
  ...parentsOf('mihai', 'ion', 'maria'),
  ...parentsOf('andrei', 'ion', 'maria'),
  ...parentsOf('elena', 'gheorghe', 'ana'),
  ...parentsOf('doina', 'gheorghe', 'ana'),

  ...parentsOf('alex', 'mihai', 'elena'),
  ...parentsOf('sofia', 'mihai', 'elena'),
  ...parentsOf('matei', 'mihai', 'elena'),
  ...parentsOf('luca', 'andrei', 'carmen'),
  ...parentsOf('ioana', 'andrei', 'carmen'),
  ...parentsOf('radu', 'doina'),

  ...parentsOf('tudor', 'alex', 'diana'),
  ...parentsOf('irina', 'sofia'),
];

const FULL_PARTNERSHIPS: Partnership[] = [
  couple('p1', 'ion', 'maria', 'MARRIED'),
  couple('p2', 'gheorghe', 'ana', 'MARRIED'),
  couple('p3', 'mihai', 'elena', 'MARRIED'),
  couple('p4', 'andrei', 'carmen', 'MARRIED'),
  couple('p5', 'alex', 'diana', 'PARTNER'),
];

// Versiunea simplă (2D) = subset din cea completă, ca să rămână mică și lizibilă.
const SIMPLE_SLUGS = ['ion', 'maria', 'mihai', 'elena', 'andrei', 'alex', 'sofia', 'matei', 'luca'];
const SIMPLE_IDS = new Set(SIMPLE_SLUGS.map((s) => `demo-${s}`));

export const DEMO_TREE_3D: FamilyTreeData = {
  members: FULL_MEMBERS,
  relations: FULL_RELATIONS,
  partnerships: FULL_PARTNERSHIPS,
  alliances: [],
  selfMemberId: 'demo-alex',
};

export const DEMO_TREE: FamilyTreeData = {
  members: FULL_MEMBERS.filter((m) => SIMPLE_IDS.has(m.id)),
  relations: FULL_RELATIONS.filter((r) => SIMPLE_IDS.has(r.parentId) && SIMPLE_IDS.has(r.childId)),
  partnerships: FULL_PARTNERSHIPS.filter((p) => SIMPLE_IDS.has(p.partnerAId) && SIMPLE_IDS.has(p.partnerBId)),
  alliances: [],
  selfMemberId: 'demo-alex',
};