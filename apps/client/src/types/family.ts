export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type BloodType =
  | 'A_POSITIVE' | 'A_NEGATIVE'
  | 'B_POSITIVE' | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE'
  | 'O_POSITIVE' | 'O_NEGATIVE';

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  maidenName?: string | null;
  gender?: Gender | null;
  birthDate?: string | null;
  deathDate?: string | null;
  imageUrl?: string | null;
  bio?: string | null;
  education?: string | null;
  occupation?: string | null;
  bloodType?: BloodType | null;
  heightCm?: number | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  manualOrder?: number | null;
  manualRank?: number | null;
}

export interface ParentChildRelation {
  id: string;
  parentId: string;
  childId: string;
}

export interface Partnership {
  id: string;
  partnerAId: string;
  partnerBId: string;
  status: string;
}

export interface Alliance {
  id: string;
  memberAId: string;
  memberBId: string;
  type: 'CUSCRI';
  viaPartnershipId?: string | null;
}

export interface FamilyTreeData {
  members: FamilyMember[];
  relations: ParentChildRelation[];
  partnerships: Partnership[];
  alliances: Alliance[];
  selfMemberId?: string | null; // NOU
}

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A−',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B−',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB−',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O−',
};

export interface FamilyMemberDetail extends FamilyMember {
  parents: { parent: FamilyMember }[];
  children: { child: FamilyMember }[];
  partnersA: { id: string; status: string; partnerB: FamilyMember }[];
  partnersB: { id: string; status: string; partnerA: FamilyMember }[];
}