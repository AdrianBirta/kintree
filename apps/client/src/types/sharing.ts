export type ShareAccessLevel = 'READ_ONLY' | 'EDIT';

export interface ShareLinkGuest {
  id: string;
  displayName?: string | null;
  membersAddedCount: number; // NOU
  createdAt: string;
  lastUsedAt: string;
}

export interface ShareLink {
  id: string;
  token: string;
  accessLevel: ShareAccessLevel;
  label?: string | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  usesCount: number;
  maxMembersPerGuest?: number | null; // NOU
  revoked: boolean;
  createdAt: string;
  guests: ShareLinkGuest[];
}

export interface TreeAccessGrant {
  id: string;
  accessLevel: ShareAccessLevel;
  expiresAt?: string | null;
  revoked: boolean;
  createdAt: string;
  grantee?: { id: string; firstName: string; lastName: string; email: string };
  owner?: { id: string; firstName: string; lastName: string; email: string };
}