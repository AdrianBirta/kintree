import { useEffect, useMemo, useState } from 'react';
import type { FamilyTreeData } from '../types/family';

function checkImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Returnează același arbore, dar cu imageUrl = null pentru pozele care nu se
// pot încărca (fișier lipsă, 404, în dev Vite servește index.html pentru
// fișiere inexistente, ceea ce se comportă tot ca eroare de imagine).
export function useImageFallbackTree(tree: FamilyTreeData): FamilyTreeData {
  const [okUrls, setOkUrls] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    const urls = [...new Set(tree.members.map((m) => m.imageUrl).filter((u): u is string => !!u))];

    Promise.all(urls.map(async (u) => [u, await checkImage(u)] as const)).then((results) => {
      if (cancelled) return;
      setOkUrls(new Set(results.filter(([, ok]) => ok).map(([u]) => u)));
    });

    return () => {
      cancelled = true;
    };
  }, [tree]);

  return useMemo(
    () => ({
      ...tree,
      members: tree.members.map((m) => (m.imageUrl && !okUrls.has(m.imageUrl) ? { ...m, imageUrl: null } : m)),
    }),
    [tree, okUrls],
  );
}