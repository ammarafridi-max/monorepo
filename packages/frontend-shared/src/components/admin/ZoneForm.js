'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import area from '@turf/area';
import difference from '@turf/difference';
import union from '@turf/union';
import booleanContains from '@turf/boolean-contains';
import rewind from '@turf/rewind';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Scissors, Search, Loader2, Combine } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const HAS_TOKEN = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
const DEFAULT_CENTER = [55.296249, 25.276987];
const DEFAULT_ZOOM = 10;

const DRAW_STYLES = [
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: { 'fill-color': '#14948f', 'fill-outline-color': '#14948f', 'fill-opacity': 0.2 },
  },
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: { 'fill-color': '#14948f', 'fill-outline-color': '#14948f', 'fill-opacity': 0.3 },
  },
  {
    id: 'gl-draw-polygon-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: { 'circle-radius': 4, 'circle-color': '#facc15', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
  },
  {
    id: 'gl-draw-polygon-stroke-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#0d6e69', 'line-width': 2 },
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#0d6e69', 'line-width': 2, 'line-dasharray': [0.2, 2] },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-halo-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
    paint: { 'circle-radius': 6, 'circle-color': '#ffffff' },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
    paint: { 'circle-radius': 4, 'circle-color': '#14948f' },
  },
];

const featureCollection = (features) => ({ type: 'FeatureCollection', features });
const polyFeature = (geometry) => ({ type: 'Feature', properties: {}, geometry });

export default function ZoneForm({ initialData = null, onSubmit, isPending }) {
  const isEdit = !!initialData;

  const [zoneName, setZoneName] = useState(initialData?.name || '');
  const [partCount, setPartCount] = useState(0); // number of areas (Polygon features) in the zone

  // Boundary search (OpenStreetMap / Nominatim)
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  // Add a Polygon/MultiPolygon to the draw layer, splitting MultiPolygon into
  // editable Polygon parts. Returns nothing; call refreshCount() after.
  function addGeometry(draw, geom) {
    if (!geom) return;
    if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((coords) => draw.add(polyFeature({ type: 'Polygon', coordinates: coords })));
    } else if (geom.type === 'Polygon') {
      draw.add(polyFeature(geom));
    }
  }

  function polygonFeatures() {
    const draw = drawRef.current;
    if (!draw) return [];
    return draw.getAll().features.filter((f) => f.geometry?.type === 'Polygon');
  }

  function refreshCount() {
    setPartCount(polygonFeatures().length);
  }

  function fitTo(geom) {
    const map = mapRef.current;
    if (!map) return;
    const bounds = new mapboxgl.LngLatBounds();
    const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
    polys.forEach((rings) => rings.forEach((ring) => ring.forEach((pt) => bounds.extend(pt))));
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40, duration: 800 });
  }

  // Initialize map + draw (once). Loads existing geometry on map load.
  useEffect(() => {
    if (!HAS_TOKEN || mapRef.current || !mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      styles: DRAW_STYLES,
    });
    map.addControl(draw);

    mapRef.current = map;
    drawRef.current = draw;

    map.on('draw.create', refreshCount);
    map.on('draw.update', refreshCount);
    map.on('draw.delete', refreshCount);

    map.on('load', () => {
      if (initialData?.geometry) {
        addGeometry(draw, initialData.geometry);
        refreshCount();
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e) {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchMsg('');
    setResults([]);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
        `&format=jsonv2&polygon_geojson=1&limit=6&countrycodes=ae&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('search failed');
      const data = await res.json();
      const usable = data.filter(
        (r) => r.geojson && (r.geojson.type === 'Polygon' || r.geojson.type === 'MultiPolygon'),
      );
      setResults(usable);
      if (!usable.length) setSearchMsg('No boundary found. Try a broader name, or draw it manually.');
    } catch {
      setSearchMsg('Search failed — please try again.');
    } finally {
      setSearching(false);
    }
  }

  // Add a searched area to the zone (accumulates — does not replace).
  function handlePickResult(r) {
    const draw = drawRef.current;
    if (!draw) return;
    addGeometry(draw, r.geojson);
    refreshCount();
    fitTo(r.geojson);
    if (!zoneName.trim()) setZoneName(r.name || r.display_name?.split(',')[0] || '');
    setResults([]);
    setSearchMsg('Area added. Add more areas or draw them — all parts are saved as one zone.');
  }

  // Cut holes: subtract shapes that are FULLY INSIDE the largest shape; leave any
  // separate (disjoint) areas as their own parts.
  function handleCutHoles() {
    const draw = drawRef.current;
    if (!draw) return;
    const polys = polygonFeatures();
    if (polys.length < 2) {
      alert('Draw a smaller area fully inside a larger one, then cut.');
      return;
    }

    const [outer, ...rest] = [...polys].sort((a, b) => area(b) - area(a));
    const holes = rest.filter((p) => booleanContains(outer, p));
    const others = rest.filter((p) => !booleanContains(outer, p));

    if (!holes.length) {
      alert('No area is fully inside another. To cut a hole, draw a smaller area inside a larger one.');
      return;
    }

    let result = outer;
    for (const h of holes) {
      const diff = difference(featureCollection([result, h]));
      if (!diff) {
        alert('That cut removes the entire area. Adjust your shapes.');
        return;
      }
      result = diff;
    }

    // Rebuild: the donut + any untouched separate areas.
    draw.deleteAll();
    addGeometry(draw, rewind(result).geometry);
    others.forEach((o) => draw.add(o));
    refreshCount();
  }

  // Merge overlapping/touching areas into one connected polygon. To join two
  // separate areas, drag a vertex of one so it overlaps the other, then merge.
  function handleMerge() {
    const draw = drawRef.current;
    if (!draw) return;
    const polys = polygonFeatures();
    if (polys.length < 2) {
      alert('Draw at least two areas to merge.');
      return;
    }

    let merged;
    try {
      merged = union(featureCollection(polys));
    } catch {
      merged = null;
    }
    if (!merged) {
      alert('Could not merge these areas.');
      return;
    }

    draw.deleteAll();
    addGeometry(draw, rewind(merged).geometry);
    refreshCount();
    setSearchMsg(
      merged.geometry.type === 'Polygon'
        ? 'Merged into one connected area.'
        : 'These areas don’t touch yet — drag a point of one so it overlaps another, then merge again.',
    );
  }

  function handleResetMap() {
    if (!mapRef.current || !drawRef.current) return;
    drawRef.current.deleteAll();
    setPartCount(0);
    setResults([]);
    setSearchMsg('');
    mapRef.current.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const polys = polygonFeatures();
    if (!zoneName.trim() || polys.length === 0) {
      alert('Please provide a zone name and at least one area.');
      return;
    }

    // Combine all parts: union merges overlapping/adjacent areas and yields a
    // MultiPolygon for disjoint ones. Single part stays a Polygon.
    let combined;
    try {
      combined = polys.length === 1 ? polys[0] : union(featureCollection(polys));
    } catch {
      combined = null;
    }
    if (!combined) {
      alert('Could not combine the selected areas. Please check the shapes.');
      return;
    }

    // Normalize winding (outer CCW, holes CW) so MongoDB 2dsphere reads it correctly.
    const geometry = rewind(combined).geometry;
    onSubmit({ name: zoneName.trim(), geometry });
  }

  const inputCls =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300';

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/zones"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} />
          Back to zones
        </Link>
        <span className="text-sm font-bold text-gray-800">{isEdit ? 'Edit Zone' : 'New Zone'}</span>
        <button
          type="submit"
          disabled={isPending || partCount === 0}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Zone'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-5">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-700">Zone Details</h3>
          </div>
          <div className="p-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">Zone Name</label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Zone name…"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-gray-700">Zone Area</h3>
              {partCount > 0 && (
                <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full">
                  {partCount} {partCount === 1 ? 'area' : 'areas'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleMerge}
                disabled={isPending || partCount < 2}
                className="flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                title="Join overlapping/touching areas into one connected shape"
              >
                <Combine size={13} /> Merge
              </button>
              <button
                type="button"
                onClick={handleCutHoles}
                disabled={isPending || partCount < 2}
                className="flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                title="Subtract a shape that is fully inside another to create a hole"
              >
                <Scissors size={13} /> Cut holes
              </button>
              <button
                type="button"
                onClick={handleResetMap}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 disabled:opacity-60 transition"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>
          <div className="p-5">
            {HAS_TOKEN ? (
              <>
                <div className="mb-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearch();
                          }
                        }}
                        placeholder="Search an area to add it (e.g. Dubai Marina, JBR)"
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={searching || !query.trim()}
                      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                    >
                      {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                      {searching ? 'Searching…' : 'Search'}
                    </button>
                  </div>

                  {results.length > 0 && (
                    <ul className="mt-2 border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-52 overflow-auto bg-white">
                      {results.map((r, i) => (
                        <li key={`${r.osm_id}-${i}`}>
                          <button
                            type="button"
                            onClick={() => handlePickResult(r)}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-primary-50 transition"
                          >
                            <span className="font-semibold">{r.name || r.display_name?.split(',')[0]}</span>
                            <span className="text-gray-400"> — {r.display_name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {searchMsg && <p className="text-[11px] text-gray-500 mt-1.5">{searchMsg}</p>}
                  <p className="text-[10px] text-gray-300 mt-1">Boundary search © OpenStreetMap contributors</p>
                </div>

                <div ref={mapContainer} className="w-full h-[600px] bg-gray-100 rounded-xl overflow-hidden" />
              </>
            ) : (
              <div className="w-full h-[600px] bg-gray-50 rounded-xl flex items-center justify-center text-center px-6">
                <p className="text-sm text-gray-500">
                  Map unavailable — <span className="font-semibold">NEXT_PUBLIC_MAPBOX_TOKEN</span> is not configured.
                </p>
              </div>
            )}

            <p className="text-[11px] text-gray-400 mt-2">
              Add multiple areas (search or draw) — they’re saved together as one zone. To join two areas into one
              connected shape, drag a point of one so it overlaps the other, then click{' '}
              <span className="font-semibold">Merge</span>. To exclude an area, draw a smaller shape fully inside
              another and click <span className="font-semibold">Cut holes</span>. Click a shape + the trash tool to
              remove it.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
