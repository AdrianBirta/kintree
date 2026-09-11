import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 2.5;
const DEFAULT_TRANSFORM: Transform = { x: 40, y: 40, scale: 1 };

// prag minim de mișcare (px) sub care nu recalculăm pinch-ul, ca să evităm
// jitter cauzat de zgomotul senzorului de touch la degete aproape nemișcate
const PINCH_MOVE_EPSILON = 0.5;

export function usePanZoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);

  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // NOU — urmărim TOȚI pointerii activi (id -> poziție curentă), nu doar
  // unul singur. Cu un singur pointer activ facem pan (ca înainte). Cu
  // exact doi pointeri activi (două degete), intrăm în mod pinch-to-zoom.
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartMidpoint = useRef({ x: 0, y: 0 });

  const getPointsArray = () => [...activePointers.current.values()];

  const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const midpointBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  // zoom păstrând fix punctul (cx, cy) din spațiul ecranului — folosit atât de scroll
  // (cx/cy = poziția cursorului), cât și de butoanele +/- (cx/cy = centrul containerului)
  // și acum și de pinch (cx/cy = punctul median dintre cele două degete)
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
    // NOU — reținem orice pointer nou (mouse, deget, pen) în map, indiferent
    // de tip, ca să știm mereu câte "atingeri" sunt active simultan.
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignorăm — unele browsere pot respinge capture-ul pe anumite tipuri de pointer
    }

    const points = getPointsArray();

    if (points.length === 2) {
      // al doilea deget tocmai a atins ecranul → intrăm în mod pinch,
      // ieșim din orice pan care era eventual în curs cu un singur deget
      isPanning.current = false;
      pinchStartDistance.current = distanceBetween(points[0], points[1]);
      pinchStartMidpoint.current = midpointBetween(points[0], points[1]);
      return;
    }

    if (points.length > 2) {
      // un al treilea deget — ignorăm complet gestul, ca să nu producem
      // comportament nedefinit; așteptăm să rămână doar 0/1/2 pointeri
      isPanning.current = false;
      pinchStartDistance.current = null;
      return;
    }

    // un singur pointer activ → pan normal, ca înainte
    if (e.button !== undefined && e.button > 0) return; // doar click/atingere primară — nu click-dreapta
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // dacă acest pointer nu era deja urmărit (ex. move fără down anterior
    // pe acest element), nu facem nimic
    if (!activePointers.current.has(e.pointerId)) {
      if (isPanning.current) {
        // fallback — comportamentul vechi, pentru orice caz marginal
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
      }
      return;
    }

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const points = getPointsArray();

    if (points.length === 2 && pinchStartDistance.current !== null) {
      // NOU — mod pinch: recalculăm distanța curentă dintre cele două
      // degete și o comparăm cu distanța de referință (pinchStartDistance).
      // Raportul dintre ele e exact factorul de zoom, aplicat față de
      // punctul median al celor două degete (nu față de centrul ecranului),
      // ca zoom-ul să "urmărească" natural gestul utilizatorului.
      const currentDistance = distanceBetween(points[0], points[1]);
      const currentMidpoint = midpointBetween(points[0], points[1]);

      if (Math.abs(currentDistance - pinchStartDistance.current) > PINCH_MOVE_EPSILON) {
        const rect = containerRef.current?.getBoundingClientRect();
        const originX = currentMidpoint.x - (rect?.left ?? 0);
        const originY = currentMidpoint.y - (rect?.top ?? 0);

        const factor = currentDistance / pinchStartDistance.current;
        zoomToward(originX, originY, factor);

        // actualizăm referința, ca zoom-ul să fie incremental (relativ la
        // ultima poziție), nu tot timpul relativ la distanța inițială —
        // altfel factorul ar exploda / s-ar inversa greșit pe gesturi lungi
        pinchStartDistance.current = currentDistance;
        pinchStartMidpoint.current = currentMidpoint;
      }
      return;
    }

    if (points.length === 1 && isPanning.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
    }
  }, [zoomToward]);

  const stopPan = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // era deja eliberat — ignorăm
    }

    const points = getPointsArray();

    if (points.length === 2) {
      // a rămas exact un deget pe ecran (din trei) — reluăm pinch cu noua pereche
      pinchStartDistance.current = distanceBetween(points[0], points[1]);
      pinchStartMidpoint.current = midpointBetween(points[0], points[1]);
      isPanning.current = false;
    } else if (points.length === 1) {
      // a rămas un singur deget — ieșim din pinch și reluăm pan normal,
      // fără "salt" vizual (resetăm doar referința de poziție)
      pinchStartDistance.current = null;
      isPanning.current = true;
      lastPos.current = points[0];
    } else {
      // niciun pointer activ — resetăm tot
      pinchStartDistance.current = null;
      isPanning.current = false;
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

  const resetZoom = useCallback((contentWidth: number, padding = 60) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    setTransform({
      x: contentWidth > 0 ? (rect.width - contentWidth) / 2 : DEFAULT_TRANSFORM.x,
      y: padding,
      scale: 1,
    });
  }, []);

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

  return { containerRef, transform, onPointerDown, onPointerMove, stopPan, zoomBy, resetZoom, fitToContent };
}