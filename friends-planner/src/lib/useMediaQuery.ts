import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** md breakpoint and up (side panels, longer labels). */
export function useIsMd(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/** Month-grid lane cap by width (BRIEF section 4.3). */
export function useMaxLanes(): number {
  const md = useMediaQuery('(min-width: 768px)');
  const lg = useMediaQuery('(min-width: 1200px)');
  return lg ? 6 : md ? 4 : 3;
}
