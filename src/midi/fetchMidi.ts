export type FetchMode = 'local' | 'direct' | 'proxy';

const CORS_PROXY = 'https://corsproxy.io/?';

export async function fetchMidiArrayBuffer(url: string, mode: FetchMode = 'direct'): Promise<ArrayBuffer> {
  if (mode === 'proxy') {
    return tryFetch(CORS_PROXY + encodeURIComponent(url));
  }
  if (mode === 'local') {
    // Local URLs are relative to the Vite base path
    const base = import.meta.env.BASE_URL ?? '/';
    const absolute = url.startsWith('http') ? url : `${base}${url.replace(/^\//, '')}`;
    return tryFetch(absolute);
  }
  // direct: try unproxied first, fall back to proxy on CORS failure
  try {
    return await tryFetch(url);
  } catch (e) {
    if (e instanceof TypeError) {
      // Likely CORS; retry through proxy
      return tryFetch(CORS_PROXY + encodeURIComponent(url));
    }
    throw e;
  }
}

async function tryFetch(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText} (${url})`);
  return res.arrayBuffer();
}
