import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TreePreview2D from './TreePreview2D';
import { DEMO_TREE, DEMO_TREE_3D } from '../../lib/demoTreeData';
import { useImageFallbackTree } from '../../hooks/useImageFallbackTree';

// three.js + react-three-fiber sunt grele — încărcăm 3D-ul doar când
// cardul ajunge efectiv în viewport.
const FamilyTree3D = lazy(() => import('../tree/FamilyTree3D'));

function useInView<T extends Element>(rootMargin = '200px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasBeenInView(true);
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView, hasBeenInView };
}

const PreviewLoader: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <img src="/assets/favicon.svg" alt="" className="h-12 w-12 animate-pulse" />
  </div>
);

const PreviewFrame: React.FC<{ badge: string; description: string; children: React.ReactNode }> = ({
  badge,
  description,
  children,
}) => (
  <div className="rounded-3xl border border-earbore-border bg-white shadow-xl p-3 sm:p-4">
    <div className="relative rounded-2xl overflow-hidden h-[400px] sm:h-[460px] bg-earbore-grayLight">
      {children}
    </div>
    <div className="flex items-center gap-2.5 px-2 pt-3 pb-1">
      <span className="bg-earbore-100 text-earbore-700 text-xs font-bold px-2.5 py-1 rounded-full">{badge}</span>
      <span className="text-sm text-earbore-gray">{description}</span>
    </div>
  </div>
);

const LandingTreeShowcase: React.FC = () => {
  const { t } = useTranslation();
  const { ref: ref3D, inView, hasBeenInView } = useInView<HTMLDivElement>();

  // pozele lipsă din /assets/demo/ devin automat inițiale
  const tree2D = useImageFallbackTree(DEMO_TREE);
  const tree3D = useImageFallbackTree(DEMO_TREE_3D);

  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  return (
    <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 text-left">
      <PreviewFrame badge="2D" description={t('landingPreview.desc2D')}>
        <TreePreview2D treeData={tree2D} />
      </PreviewFrame>

      <div ref={ref3D}>
        <PreviewFrame badge="3D" description={t('landingPreview.desc3D')}>
          {hasBeenInView ? (
            <Suspense fallback={<PreviewLoader />}>
              <FamilyTree3D
                treeData={tree3D}
                autoRotate={!reducedMotion}
                autoRotateSpeed={1.6}
                interactive={false}
                cameraZoom={0.75}
                paused={!inView}
                lite
              />
            </Suspense>
          ) : (
            <PreviewLoader />
          )}
        </PreviewFrame>
      </div>
    </div>
  );
};

export default LandingTreeShowcase;