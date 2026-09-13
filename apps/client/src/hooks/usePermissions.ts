import { useActiveTreeStore } from '../store/activeTreeStore';

export function usePermissions() {
  const activeOwner = useActiveTreeStore((s) => s.activeOwner);

  const isOwnTree = !activeOwner;
  const canEdit = isOwnTree || activeOwner.accessLevel === 'EDIT';
  const viewingOwnerName = activeOwner ? `${activeOwner.firstName} ${activeOwner.lastName}` : null;

  return { isOwnTree, canEdit, viewingOwnerName };
}