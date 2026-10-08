import { useCallback } from 'react';
import { navigate as browserNavigate, useBrowserLocation, type BrowserLocationHook } from 'wouter/use-browser-location';
import { useLastView } from '../state/LastViewContext';

/** History entries created by the app carry an index, so we know whether "back" stays inside the app. */
function currentIndex(): number {
  const state = window.history.state as { fpIdx?: number } | null;
  return typeof state?.fpIdx === 'number' ? state.fpIdx : 0;
}

export function appNavigate(to: string | URL, options?: { replace?: boolean; state?: unknown; transition?: boolean }): void {
  const idx = currentIndex();
  browserNavigate(to, { ...options, state: { fpIdx: options?.replace ? idx : idx + 1 } });
}

/** wouter location hook that stamps every navigation with an app history index. */
export const useAppLocation: BrowserLocationHook = (options) => {
  const [path] = useBrowserLocation(options);
  return [path, appNavigate];
};

export function previousEntryIsApp(): boolean {
  return currentIndex() > 0;
}

/** Closes a sheet: browser back when the previous entry is ours, otherwise to the last calendar/timeline. */
export function useCloseSheet(): () => void {
  const { lastViewPath } = useLastView();
  return useCallback(() => {
    if (previousEntryIsApp()) window.history.back();
    else appNavigate(lastViewPath, { replace: true });
  }, [lastViewPath]);
}
