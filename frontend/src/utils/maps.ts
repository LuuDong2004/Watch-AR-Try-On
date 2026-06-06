/**
 * Map helpers — keyless. The shop map is built ONLY from the pasted map link
 * (never the address). An empty link means "no map".
 *
 * Google blocks framing of its `maps?q=...&output=embed` URLs, so the inline
 * preview is rendered with OpenStreetMap, which always allows embedding. We only
 * need a lat/lng — taken from the link's coordinates, otherwise geocoded from
 * the link's place query (see <MapPreview/>).
 */

export interface LatLng { lat: number; lng: number }

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s.trim());

/** Place/coords query carried inside a full Google Maps URL (null if none). */
function queryFromMapUrl(mapUrl: string): string | null {
  try {
    const u = new URL(mapUrl);
    const q = u.searchParams.get('query') || u.searchParams.get('destination') || u.searchParams.get('q');
    if (q) return q;
    const place = u.pathname.match(/\/place\/([^/@]+)/);
    if (place) return decodeURIComponent(place[1].replace(/\+/g, ' '));
  } catch {
    /* not a URL */
  }
  return null;
}

/** Extract explicit coordinates from a Google Maps link, if present. */
export function coordsFromMapUrl(mapUrl?: string): LatLng | null {
  if (!mapUrl) return null;
  const s = mapUrl.trim();
  // place URLs: ...!3d<lat>!4d<lng>
  let m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return { lat: +m[1], lng: +m[2] };
  // .../@<lat>,<lng>,<zoom>z
  m = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: +m[1], lng: +m[2] };
  // ?q=<lat>,<lng> / ll= / query= / destination=
  try {
    const u = new URL(s);
    for (const key of ['q', 'query', 'll', 'destination']) {
      const v = u.searchParams.get(key);
      const mm = v && v.match(/^\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\s*$/);
      if (mm) return { lat: +mm[1], lng: +mm[2] };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Text query to geocode — derived ONLY from the link (place or plain text). */
export function mapQuery(mapUrl?: string): string | null {
  const link = mapUrl?.trim();
  if (!link) return null;
  if (!isHttpUrl(link)) return link; // plain text typed into the field
  return queryFromMapUrl(link); // null for opaque/short links
}

/** OpenStreetMap iframe src centred on a point with a marker. */
export function osmEmbedSrc({ lat, lng }: LatLng): string {
  const dx = 0.012;
  const dy = 0.008;
  const bbox = `${lng - dx},${lat - dy},${lng + dx},${lat + dy}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

/** Deep link that opens directions — ONLY from the shop's map link. */
export function mapDirectionsUrl(mapUrl?: string): string | null {
  const link = mapUrl?.trim();
  if (!link) return null;
  if (isHttpUrl(link)) return link; // open the exact pasted link
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(link)}`;
}
