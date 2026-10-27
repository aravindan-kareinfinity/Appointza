const listeners = new Set<() => void>();
let ready = false;
let npaOnly = true;

export function isAdMobReady(): boolean {
  return ready;
}

export function wantsNonPersonalizedAdsOnly(): boolean {
  return npaOnly;
}

export function setAdMobReady(nonPersonalizedAdsOnly: boolean): void {
  npaOnly = nonPersonalizedAdsOnly;
  ready = true;
  listeners.forEach((cb) => cb());
}

export function subscribeAdMobReady(cb: () => void): () => void {
  if (ready) cb();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
