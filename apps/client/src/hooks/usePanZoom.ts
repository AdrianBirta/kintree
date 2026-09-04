import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 2.5;
const DEFAULT_TRANSFORM: Transform = { x: 40, y: 40, scale: 1 };

export function usePanZoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);

  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // zoom păstrând fix punctul (cx, cy) din spațiul ecranului — folosit atât de scroll
  // (cx/cy = poziția cursorului), cât și de butoanele +/- (cx/cy = centrul containerului)
  const zoomToward = useCallback((cx: number, cy: number, factor: number) => {
    setTransform((t) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * factor));
      const ratio = newScale / t.scale;
      return { x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio, scale: newScale };
    });
  }, []);

  // ── pan cu Pointer Events: unifică mouse + touch + pen, iar cu setPointerCapture
  //    continuă să primească evenimente chiar dacă cursorul iese din container sau din
  //    fereastră cât timp butonul rămâne apăsat (spre deosebire de mouse events simple) ──
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // doar click/atingere primară — nu click-dreapta
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }, []);

  const stopPan = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isPanning.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // era deja eliberat — ignorăm
    }
  }, []);

  // ── zoom din scroll — listener NATIV, non-pasiv: doar așa preventDefault oprește
  //    sigur scroll-ul paginii în toate browserele (onWheel din JSX poate fi tratat
  //    ca pasiv, în funcție de configurație) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomToward(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.1 : 1 / 1.1);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [zoomToward]);

  const zoomBy = useCallback(
    (factor: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      zoomToward(rect ? rect.width / 2 : 0, rect ? rect.height / 2 : 0, factor);
    },
    [zoomToward],
  );

  const reset = useCallback(() => setTransform(DEFAULT_TRANSFORM), []);

  // ── încadrează tot conținutul (contentWidth x contentHeight) în container, centrat
  //    orizontal, lipit sus (rădăcina arborelui rămâne mereu primul lucru vizibil) ──
  //
  // FIX — la primul randare (mai ales imediat după un refresh de pagină),
  // containerRef poate exista în DOM dar încă fără dimensiuni reale (rect.width
  // sau rect.height = 0), pentru că layout-ul flex al paginii nu s-a stabilizat
  // complet la momentul la care rulează efectul. Dacă se calcula scale-ul pe un
  // dreptunghi gol, rezultatul era un scale minim și un offset X puternic
  // negativ → arborele "sărea" undeva departe în stânga ecranului. Acum
  // funcția refuză să calculeze pe un dreptunghi gol și raportează eșecul prin
  // valoarea returnată, ca apelantul să poată reîncerca (vezi FamilyTreeCanvas).
  const fitToContent = useCallback((contentWidth: number, contentHeight: number, padding = 60): boolean => {
    const el = containerRef.current;
    if (!el || contentWidth === 0 || contentHeight === 0) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    const scale = Math.max(
      MIN_SCALE,
      Math.min(1, (rect.width - padding * 2) / contentWidth, (rect.height - padding * 2) / contentHeight),
    );

    setTransform({ x: (rect.width - contentWidth * scale) / 2, y: padding, scale });
    return true;
  }, []);

  return { containerRef, transform, onPointerDown, onPointerMove, stopPan, zoomBy, reset, fitToContent };
}