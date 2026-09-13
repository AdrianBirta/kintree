import { getActiveTreeOwnerId } from '../store/activeTreeStore';

// NOU — includem ownerId-ul activ ('own' dacă e arborele propriu) în cheie,
// ca să nu se amestece cache-ul între arbori diferite când comuți între ele
function scope() {
  return getActiveTreeOwnerId() ?? 'own';
}

export const familyKeys = {
  all: ['family'] as const,
  tree: () => [...familyKeys.all, scope(), 'tree'] as const,
  members: () => [...familyKeys.all, scope(), 'members'] as const,
  memberDetail: (id: string) => [...familyKeys.all, scope(), 'member', id] as const,
  self: () => [...familyKeys.all, 'self'] as const, // self nu depinde de arborele activ
};