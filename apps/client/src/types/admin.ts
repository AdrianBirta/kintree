export type AdminStatusFilter = 'all' | 'active' | 'disabled';
export type AdminDonorFilter = 'all' | 'donors';
export type AdminSortField = 'createdAt' | 'lastLoginAt' | 'email' | 'firstName' | 'lastName' | 'members';

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
  disabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  providers: string[];
  membersCount: number;
  donationsCount: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminDonation {
  id: string;
  userId: string | null;
  donorName: string | null;
  amount: number;
  currency: string;
  note: string | null;
  donatedAt: string;
  createdAt: string;
}

export interface AdminMember {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  birthDate: string | null;
  deathDate: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface AdminShareLink {
  id: string;
  label: string | null;
  accessLevel: 'READ_ONLY' | 'EDIT';
  expiresAt: string | null;
  maxUses: number | null;
  usesCount: number;
  revoked: boolean;
  createdAt: string;
  guestsCount: number;
}

interface PersonRef { id: string; firstName: string; lastName: string; email: string }

export interface AdminAccessGrant {
  id: string;
  accessLevel: 'READ_ONLY' | 'EDIT';
  revoked: boolean;
  expiresAt: string | null;
  createdAt: string;
  grantee?: PersonRef;
  owner?: PersonRef;
}

export interface AdminUserDetail {
  user: AdminUserListItem & { updatedAt: string; selfMemberId: string | null };
  stats: {
    members: number;
    alive: number;
    deceased: number;
    withPhoto: number;
    relations: number;
    partnerships: number;
    shareLinks: number;
    accessGiven: number;
    accessReceived: number;
    messagesSent: number;
    activeSessions: number;
    donations: number;
  };
  members: AdminMember[];
  shareLinks: AdminShareLink[];
  accessGiven: AdminAccessGrant[];
  accessReceived: AdminAccessGrant[];
  donations: AdminDonation[];
}

export interface AdminStats {
  users: { total: number; active: number; disabled: number; new7: number; new30: number; activeLast30: number };
  content: { members: number; shareLinks: number; treeAccess: number; conversations: number; messages: number };
  donations: {
    clicks: number;
    clicksByTier: { tier: string; count: number }[];
    totals: { currency: string; amount: number; count: number }[];
    donors: number;
  };
  recentUsers: AdminUserListItem[];
  signups: { date: string; count: number }[];
}