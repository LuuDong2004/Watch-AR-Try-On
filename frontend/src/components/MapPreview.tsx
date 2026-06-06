/**
 * MapPreview — keyless inline map built ONLY from a shop's map link.
 *
 * Renders an OpenStreetMap iframe (which, unlike Google's `output=embed`, is
 * never blocked by X-Frame-Options). It resolves a point from the link's
 * coordinates, falling back to geocoding the link's place query via Nominatim.
 * If the link is opaque (e.g. a short maps.app.goo.gl link) it degrades to a
 * "Mở Google Maps" button. Renders nothing when there is no link.
 */
import { useEffect, useMemo, useState } from 'react';
import { Map as MapIcon, ExternalLink } from 'lucide-react';
import { coordsFromMapUrl, mapQuery, osmEmbedSrc, mapDirectionsUrl, type LatLng } from '../utils/maps';

interface MapPreviewProps {
  mapUrl?: string;
  className?: string;
}

type State = 'loading' | 'ready' | 'error';

export default function MapPreview({ mapUrl, className = '' }: MapPreviewProps) {
  const direct = useMemo(() => coordsFromMapUrl(mapUrl), [mapUrl]);
  const query = useMemo(() => mapQuery(mapUrl), [mapUrl]);
  const directions = mapDirectionsUrl(mapUrl);

  const [coords, setCoords] = useState<LatLng | null>(direct);
  const [state, setState] = useState<State>(direct ? 'ready' : 'loading');

  useEffect(() => {
    if (direct) { setCoords(direct); setState('ready'); return; }
    if (!query) { setState('error'); setCoords(null); return; }

    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    setState('loading');
    fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' }, signal: ctrl.signal },
    )
      .then((r) => r.json())
      .then((arr) => {
        if (cancelled) return;
        const hit = Array.isArray(arr) ? arr[0] : null;
        if (hit?.lat && hit?.lon) {
          setCoords({ lat: +hit.lat, lng: +hit.lon });
          setState('ready');
        } else {
          setState('error');
        }
      })
      .catch(() => { if (!cancelled) setState('error'); })
      .finally(() => clearTimeout(timer));

    return () => { cancelled = true; ctrl.abort(); clearTimeout(timer); };
  }, [direct, query]);

  // No link → no map at all.
  if (!mapUrl?.trim()) return null;

  const box = `relative w-full overflow-hidden rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] ${className}`;

  if (state === 'ready' && coords) {
    return (
      <div className={box}>
        <iframe
          title="Bản đồ cửa hàng"
          src={osmEmbedSrc(coords)}
          loading="lazy"
          className="aspect-video w-full"
        />
        {directions && (
          <a
            href={directions}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#17140F] shadow hover:bg-white"
          >
            <ExternalLink className="h-3 w-3 text-[#B8924A]" /> Google Maps
          </a>
        )}
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className={`${box} flex aspect-video items-center justify-center text-[11px] text-gray-400`}>
        Đang tải bản đồ…
      </div>
    );
  }

  // error → link couldn't be resolved to a point (e.g. short link)
  return (
    <div className={`${box} flex aspect-video flex-col items-center justify-center gap-2 text-gray-400`}>
      <MapIcon className="h-6 w-6" />
      <span className="text-[11px]">Không hiện được bản đồ từ link này</span>
      {directions && (
        <a
          href={directions}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8924A] px-3 py-1.5 text-[11px] font-bold text-[#B8924A] hover:bg-[#B8924A]/5"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Mở Google Maps
        </a>
      )}
    </div>
  );
}
