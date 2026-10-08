import { useEffect } from 'react';

const SUFFIX = 'Friends Plans';

/** Sets document.title as "<title> · Friends Plans" (or the default when no title is given). */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : "Friends Plans: who's away when";
  }, [title]);
}
