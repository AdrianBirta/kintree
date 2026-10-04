import type { FamilyMember, FamilyTreeData, ParentChildRelation, Partnership } from '../types/family';

// Arbori demo, folosiți DOAR pe landing page (fără apeluri la backend).
// - DEMO_TREE    → 9 persoane, 3 generații (previzualizarea 2D)
// - DEMO_TREE_3D → 37 de persoane, 5 generații (previzualizarea 3D)

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
  // generația 0 — străbunici (NOU)
  person('stefan', 'Ștefan', 'Popescu', 'MALE', '1912-02-18', { deathDate: '1988-05-20' }),
  person('aurelia', 'Aurelia', 'Popescu', 'FEMALE', '1915-09-03', { deathDate: '1994-12-11' }),
  person('constantin', 'Constantin', 'Ionescu', 'MALE', '1909-07-25', { deathDate: '1979-03-02' }),
  person('elisabeta', 'Elisabeta', 'Ionescu', 'FEMALE', '1913-01-14', { deathDate: '1991-08-27' }),

  // generația 1 — bunici
  person('ion', 'Ion', 'Popescu', 'MALE', '1940-04-12', { deathDate: '2016-09-03' }),
  person('maria', 'Maria', 'Popescu', 'FEMALE', '1943-08-21'),
  person('gheorghe', 'Gheorghe', 'Ionescu', 'MALE', '1938-02-09', { deathDate: '2009-11-15' }),
  person('ana', 'Ana', 'Ionescu', 'FEMALE', '1942-06-30'),
  person('vasile', 'Vasile', 'Popescu', 'MALE', '1944-10-05'),
  person('viorica', 'Viorica', 'Popescu', 'FEMALE', '1946-03-22'),

  // generația 2 — părinți
  person('mihai', 'Mihai', 'Popescu', 'MALE', '1967-03-15'),
  person('elena', 'Elena', 'Popescu', 'FEMALE', '1969-11-02', { maidenName: 'Ionescu' }),
  person('andrei', 'Andrei', 'Popescu', 'MALE', '1972-06-28'),
  person('carmen', 'Carmen', 'Popescu', 'FEMALE', '1974-01-19', { maidenName: 'Dumitru' }),
  person('doina', 'Doina', 'Ionescu', 'FEMALE', '1971-09-05'),
  person('cristina', 'Cristina', 'Marin', 'FEMALE', '1970-05-16', { maidenName: 'Popescu' }),
  person('victor', 'Victor', 'Marin', 'MALE', '1968-12-09'),
  person('adrian', 'Adrian', 'Popescu', 'MALE', '1973-08-30'),
  person('monica', 'Monica', 'Popescu', 'FEMALE', '1975-04-07', { maidenName: 'Radu' }),

  // generația 3 — copii
  person('alex', 'Alex', 'Popescu', 'MALE', '1996-05-09'),
  person('diana', 'Diana', 'Stan', 'FEMALE', '1997-12-24'),
  person('sofia', 'Sofia', 'Popescu', 'FEMALE', '1999-09-17'),
  person('david', 'David', 'Neagu', 'MALE', '1998-02-13'),
  person('matei', 'Matei', 'Popescu', 'MALE', '2003-01-30'),
  person('luca', 'Luca', 'Popescu', 'MALE', '2001-07-11'),
  person('ioana', 'Ioana', 'Popescu', 'FEMALE', '2005-04-02'),
  person('radu', 'Radu', 'Ionescu', 'MALE', '1998-10-21'),
  person('bianca', 'Bianca', 'Ionescu', 'FEMALE', '1999-06-08', { maidenName: 'Lupu' }),
  person('paul', 'Paul', 'Marin', 'MALE', '1999-11-26'),
  person('ruxandra', 'Ruxandra', 'Marin', 'FEMALE', '2000-03-19', { maidenName: 'Toma' }),
  person('teodora', 'Teodora', 'Marin', 'FEMALE', '2002-09-12'),

  // generația 4 — nepoți (NOU)
  person('tudor', 'Tudor', 'Popescu', 'MALE', '2022-03-08'),
  person('emma', 'Emma', 'Popescu', 'FEMALE', '2025-02-20'),
  person('irina', 'Irina', 'Neagu', 'FEMALE', '2024-08-14'),
  person('ilinca', 'Ilinca', 'Ionescu', 'FEMALE', '2023-05-30'),
  person('eva', 'Eva', 'Marin', 'FEMALE', '2023-10-04'),
  person('noah', 'Noah', 'Marin', 'MALE', '2025-06-17'),
  person('mara', 'Mara', 'Ionescu', 'FEMALE', '2025-11-02'),
];

const FULL_RELATIONS: ParentChildRelation[] = [
  // străbunici → bunici
  ...parentsOf('ion', 'stefan', 'aurelia'),
  ...parentsOf('vasile', 'stefan', 'aurelia'),
  ...parentsOf('ana', 'constantin', 'elisabeta'),
  ...parentsOf('gheorghe', 'constantin', 'elisabeta'),

  // bunici → părinți
  ...parentsOf('mihai', 'ion', 'maria'),
  ...parentsOf('andrei', 'ion', 'maria'),
  ...parentsOf('cristina', 'ion', 'maria'),
  ...parentsOf('elena', 'gheorghe', 'ana'),
  ...parentsOf('doina', 'gheorghe', 'ana'),
  ...parentsOf('adrian', 'vasile', 'viorica'),

  // părinți → copii
  ...parentsOf('alex', 'mihai', 'elena'),
  ...parentsOf('sofia', 'mihai', 'elena'),
  ...parentsOf('matei', 'mihai', 'elena'),
  ...parentsOf('luca', 'andrei', 'carmen'),
  ...parentsOf('ioana', 'andrei', 'carmen'),
  ...parentsOf('radu', 'doina'),
  ...parentsOf('paul', 'cristina', 'victor'),
  ...parentsOf('teodora', 'cristina', 'victor'),

  // copii → nepoți
  ...parentsOf('tudor', 'alex', 'diana'),
  ...parentsOf('emma', 'alex', 'diana'),
  ...parentsOf('irina', 'sofia', 'david'),
  ...parentsOf('ilinca', 'radu', 'bianca'),
  ...parentsOf('mara', 'radu', 'bianca'),
  ...parentsOf('eva', 'paul', 'ruxandra'),
  ...parentsOf('noah', 'paul', 'ruxandra'),
];

const FULL_PARTNERSHIPS: Partnership[] = [
  couple('p1', 'ion', 'maria', 'MARRIED'),
  couple('p2', 'gheorghe', 'ana', 'MARRIED'),
  couple('p3', 'mihai', 'elena', 'MARRIED'),
  couple('p4', 'andrei', 'carmen', 'MARRIED'),
  couple('p5', 'alex', 'diana', 'PARTNER'),
  couple('p6', 'stefan', 'aurelia', 'MARRIED'),
  couple('p7', 'constantin', 'elisabeta', 'MARRIED'),
  couple('p8', 'vasile', 'viorica', 'MARRIED'),
  couple('p9', 'cristina', 'victor', 'MARRIED'),
  couple('p10', 'adrian', 'monica', 'MARRIED'),
  couple('p11', 'sofia', 'david', 'MARRIED'),
  couple('p12', 'radu', 'bianca', 'MARRIED'),
  couple('p13', 'paul', 'ruxandra', 'PARTNER'),
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