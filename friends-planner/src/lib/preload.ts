let preloaded = false;

/** Warm the lazy EventForm chunk so the sheet opens instantly. */
export function preloadEventForm(): void {
  if (preloaded) return;
  preloaded = true;
  void import('../views/EventForm/EventForm');
}
