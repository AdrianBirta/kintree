import { create } from 'zustand';

interface ActiveTreeOwner {
  ownerId: string;
  firstName: string;
  lastName: string;
  accessLevel: 'READ_ONLY' | 'EDIT';
}

interface ActiveTreeState {
  activeOwner: ActiveTreeOwner | null;
  setActiveOwner: (owner: ActiveTreeOwner | null) => void;
}

export const useActiveTreeStore = create<ActiveTreeState>((set) => ({
  activeOwner: null,
  setActiveOwner: (owner) => set({ activeOwner: owner }),
}));

export function getActiveTreeOwnerId(): string | undefined {
  return useActiveTreeStore.getState().activeOwner?.ownerId;
}

export function isReadOnlyActiveTree(): boolean {
  const owner = useActiveTreeStore.getState().activeOwner;
  return !!owner && owner.accessLevel === 'READ_ONLY';
}