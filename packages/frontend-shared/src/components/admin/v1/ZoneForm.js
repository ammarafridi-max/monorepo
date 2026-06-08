'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DEFAULT_CENTER = [55.296249, 25.276987];
const DEFAULT_ZOOM = 10;

export default function ZoneForm({ initialData = null, onSubmit, isPending }) {
  const isEdit = !!initialData;

  const [zoneName, setZoneName] = useState(initialData?.name || '');
  const [polygon, setPolygon] = useState(initialData?.geometry || null);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  // Initialize map + draw controls
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      styles: [
        // Polygon fill
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          paint: { 'fill-color': '#14948f', 'fill-opacity': 0.35 },
        },
        // Polygon outline
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          paint: { 'line-color': '#0d6e69', 'line-width': 2 },
        },
        // Vertices halo
        {
          id: 'gl-draw-polygon-and-line-vertex-halo-active',
          type: 'circle',
          paint: { 'circle-radius': 6, 'circle-color': '#ffffff' },
        },
        // Vertices inner point
        {
          id: 'gl-draw-polygon-and-line-vertex-active',
          type: 'circle',
          paint: { 'circle-radius': 4, 'circle-color': '#14948f' },
        },
        // Midpoints (always visible)
        {
          id: 'gl-draw-polygon-midpoint',
          type: 'circle',
          paint: {
            'circle-radius': 4,
            'circle-color': '#facc15',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
          },
        },
      ],
    });

    map.addControl(draw);
    mapRef.current = map;
    drawRef.current = draw;

    function updatePolygons() {
      const data = draw.getAll();

      if (data.features.length === 0) {
        setPolygon(null);
        return;
      }

      if (data.features.length === 1) {
        setPolygon(data.features[0].geometry);
        map.addControl(new mapboxgl.NavigationControl()); // optional zoom buttons
        map.dragPan.enable();
        map.scrollZoom.enable();
        map.touchZoomRotate.enable();
      } else {
        setPolygon({
          type: 'MultiPolygon',
          coordinates: data.features.map((f) => f.geometry.coordinates),
        });
      }
    }

    map.on('draw.create', updatePolygons);
    map.on('draw.update', updatePolygons);
    map.on('draw.delete', updatePolygons);
  }, []);

  // Load existing polygon (Edit mode)
  useEffect(() => {
    if (!mapRef.current || !drawRef.current || !polygon) return;
    const draw = drawRef.current;

    draw.deleteAll();
    const feature = {
      id: 'zone-shape',
      type: 'Feature',
      properties: {},
      geometry: polygon,
    };
    draw.add(feature);
    draw.changeMode('direct_select', { featureId: 'zone-shape' });
  }, [polygon]);

  // Reset map (clear polygons + re-center)
  function handleResetMap() {
    if (!mapRef.current || !drawRef.current) return;

    drawRef.current.deleteAll();
    setPolygon(null);
    mapRef.current.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!zoneName || !polygon) {
      alert('Please provide a zone name and draw a polygon.');
      return;
    }

    onSubmit({
      name: zoneName,
      geometry: polygon,
    });
  }

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
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">
            {isEdit ? 'Edit Zone' : 'New Zone'}
          </span>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
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
              <label className="block text-xs font-semibold text-gray-600">
                Zone Name
              </label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Zone name…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-700">Zone Area</h3>
            <button
              type="button"
              onClick={handleResetMap}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 disabled:opacity-60 transition"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
          <div className="p-5">
            <div
              ref={mapContainer}
              className="w-full h-[600px] bg-gray-100 rounded-xl overflow-hidden"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              Use the polygon tool to draw the zone boundary. Use the trash tool to remove it.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
