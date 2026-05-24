import { useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 70;     // px past which release triggers refresh
const MAX_DRAG = 120;          // visual cap so the indicator can't escape
const RESISTANCE = 0.5;        // rubber-band feel

/**
 * Attaches touch listeners to `window` (or a passed scroll container) and
 * exposes a `pull` distance + `refreshing` flag. Caller uses these to
 * render an indicator and is expected to call the returned `setRefreshing`
 * once their refresh promise resolves.
 *
 * onRefresh: async callback fired when user releases past PULL_THRESHOLD.
 */
export default function usePullToRefresh(onRefresh, { enabled = true } = {}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e) => {
      // Only start tracking if we're at the very top of the page.
      if (window.scrollY > 0) { startY.current = null; return; }
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); return; }
      // Rubber-band: resistance grows with distance.
      const resisted = Math.min(MAX_DRAG, dy * RESISTANCE);
      setPull(resisted);
    };

    const onTouchEnd = async () => {
      if (startY.current == null) return;
      const releasePull = pull;
      startY.current = null;
      if (releasePull >= PULL_THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPull(PULL_THRESHOLD); // hold position while refreshing
        try { await onRefresh?.(); }
        finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, refreshing, pull, onRefresh]);

  return { pull, refreshing, threshold: PULL_THRESHOLD };
}
