'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Map as MapIcon,
  Plus,
  Copy,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useGetZones } from '../../hooks/zones/useGetZones';
import { useDuplicateZone } from '../../hooks/zones/useDuplicateZone';
import { useDeleteZone } from '../../hooks/zones/useDeleteZone';

export default function AdminZonesPage() {
  const [deleteId, setDeleteId] = useState(null);

  const { zones = [], isLoadingZones } = useGetZones();
  const { duplicateZone, isDuplicatingZone } = useDuplicateZone();
  const { deleteZone, isDeletingZone } = useDeleteZone();

  function handleDelete(id) {
    deleteZone(id, { onSettled: () => setDeleteId(null) });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Zones</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {zones.length} {zones.length === 1 ? 'zone' : 'zones'} configured
          </p>
        </div>
        <Link
          href="/admin/zones/new"
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={14} /> Add Zone
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingZones ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <MapIcon size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No zones yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first zone to get started.</p>
            </div>
            <Link
              href="/admin/zones/new"
              className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={13} /> Add Zone
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Zone Name', ''].map((h, i) => (
                    <th
                      key={i}
                      className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {zones.map((zone) => (
                  <tr
                    key={zone._id}
                    className={`hover:bg-gray-50/60 transition-colors group ${isDeletingZone || isDuplicatingZone ? 'pointer-events-none' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/zones/${zone._id}`}
                        className="font-bold text-gray-900 text-sm capitalize hover:text-primary-700 transition-colors"
                      >
                        {zone.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 w-32">
                      {deleteId === zone._id ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-red-600 font-semibold whitespace-nowrap">Delete?</span>
                          <button
                            onClick={() => handleDelete(zone._id)}
                            className="font-bold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition whitespace-nowrap"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="font-bold px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => duplicateZone(zone._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(zone._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
