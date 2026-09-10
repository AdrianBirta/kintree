// Chei de query centralizate pentru toate datele legate de familie (arbore,
// listă de membri, un membru anume, membrul marcat ca "eu"). Orice hook de
// query sau de mutație din aplicație folosește DOAR aceste chei — niciodată
// stringuri scrise de mână — ca invalidarea să rămână corectă peste tot.
export const familyKeys = {
  all: ['family'] as const,
  tree: () => [...familyKeys.all, 'tree'] as const,
  members: () => [...familyKeys.all, 'members'] as const,
  memberDetail: (id: string) => [...familyKeys.all, 'member', id] as const,
  self: () => [...familyKeys.all, 'self'] as const,
};