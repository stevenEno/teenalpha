'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Company } from '@/lib/companies/schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MapViewProps {
  token: string;
  companies: Company[];
  matchedIds: string[];
  focusCompanyId?: string | null;
}

const EL_SEGUNDO: [number, number] = [-118.4165, 33.9192];

export function MapView({ token, companies, matchedIds, focusCompanyId }: MapViewProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selected, setSelected] = useState<Company | null>(
    focusCompanyId ? companies.find((c) => c.id === focusCompanyId) ?? null : null
  );
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [matchedOnly, setMatchedOnly] = useState(false);

  const sectors = useMemo(
    () => Array.from(new Set(companies.map((c) => c.sector))).sort(),
    [companies]
  );

  const visible = useMemo(
    () =>
      companies.filter((c) => {
        if (c.latitude == null || c.longitude == null) return false;
        if (sectorFilter !== 'all' && c.sector !== sectorFilter) return false;
        if (matchedOnly && !matchedIds.includes(c.id)) return false;
        return true;
      }),
    [companies, sectorFilter, matchedOnly, matchedIds]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: EL_SEGUNDO,
      zoom: 10,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    if (focusCompanyId) {
      const focus = companies.find((c) => c.id === focusCompanyId);
      if (focus?.latitude != null && focus.longitude != null) {
        mapRef.current.flyTo({
          center: [focus.longitude, focus.latitude],
          zoom: 12,
          essential: true,
        });
      }
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token, focusCompanyId, companies]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    visible.forEach((c) => {
      const isMatch = matchedIds.includes(c.id);
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `${c.name} — ${c.sector}`);
      el.className = [
        'block rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
        isMatch
          ? 'w-5 h-5 bg-orange-500 border-white shadow-lg ring-2 ring-orange-300'
          : 'w-3.5 h-3.5 bg-gray-900 border-white shadow',
      ].join(' ');
      el.onclick = (ev) => {
        ev.stopPropagation();
        setSelected(c);
        map.flyTo({ center: [c.longitude!, c.latitude!], zoom: 12, essential: true });
      };
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([c.longitude!, c.latitude!])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [visible, matchedIds]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-wrap gap-2 p-3 border-b border-gray-100 bg-gray-50">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="text-sm rounded-md border border-gray-300 bg-white px-2 py-1"
          >
            <option value="all">All sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {matchedIds.length > 0 && (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={matchedOnly}
                onChange={(e) => setMatchedOnly(e.target.checked)}
                className="rounded"
              />
              My matches only
            </label>
          )}
          <div className="ml-auto text-xs text-gray-500 self-center">
            {visible.length} of {companies.length} shown
          </div>
        </div>
        <div ref={containerRef} className="h-[560px] w-full" />
      </div>

      <aside className="bg-white rounded-lg shadow-md p-5 max-h-[620px] overflow-y-auto">
        {selected ? (
          <div>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="secondary">{selected.sector}</Badge>
              {selected.funding_stage && <Badge variant="outline">{selected.funding_stage}</Badge>}
              {matchedIds.includes(selected.id) && (
                <Badge className="bg-orange-500 text-white">Your match</Badge>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-3">{selected.description}</p>
            {selected.city && (
              <p className="text-xs text-gray-500 mb-3">
                {selected.city}{selected.region ? `, ${selected.region}` : ''}
              </p>
            )}
            {selected.teen_roles.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Ways to plug in:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.teen_roles.map((r) => (
                    <Badge key={r} variant="outline" className="text-xs">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {selected.micro_experiment && (
              <div className="bg-gray-50 rounded p-3 mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Try this week:</p>
                <p className="text-sm text-gray-700">{selected.micro_experiment}</p>
              </div>
            )}
            {selected.website && (
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={selected.website} target="_blank" rel="noopener noreferrer">
                  Visit website →
                </a>
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 text-sm">
            <p className="mb-2">Click a pin to see details.</p>
            {matchedIds.length > 0 && (
              <p className="text-xs">
                <span className="inline-block w-3 h-3 rounded-full bg-orange-500 align-middle mr-1" />
                = your personalized match
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
