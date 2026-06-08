'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useGetAvailabilityRules } from '../../hooks/availability-rules/useGetAvailabilityRules';
import { useDeleteAvailabilityRule } from '../../hooks/availability-rules/useDeleteAvailabilityRule';

export default function AdminAvailabilityRulesPage() {
  const [deleteId, setDeleteId] = useState(null);

  const { availabilityRules = [], isLoadingAvailabilityRules } =
    useGetAvailabilityRules();
  const { deleteAvailabilityRule, isDeletingAvailabilityRule } =
    useDeleteAvailabilityRule();

  function handleDelete(id) {
    deleteAvailabilityRule(id, { onSettled: () => setDeleteId(null) });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Availability Rules
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {availabilityRules.length}{' '}
            {availabilityRules.length === 1 ? 'rule' : 'rules'} configured
          </p>
        </div>
        <Link
          href="/admin/availability-rules/new"
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={14} /> Add Rule
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingAvailabilityRules ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : availabilityRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <CalendarCheck size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No rules yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Add your first availability rule to get started.
              </p>
            </div>
            <Link
              href="/admin/availability-rules/new"
              className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={13} /> Add Rule
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {[
                    'Rule Name',
                    'Pickup Zone(s)',
                    'Dropoff Zone(s)',
                    'Available Vehicle(s)',
                    '',
                  ].map((h, i) => (
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
                {availabilityRules.map((rule) => (
                  <tr
                    key={rule._id}
                    className={`hover:bg-gray-50/60 transition-colors group ${isDeletingAvailabilityRule ? 'pointer-events-none' : ''}`}
                  >
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {rule.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(rule.pickupZones || []).map((zone) => (
                          <span
                            key={zone._id}
                            className="text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full"
                          >
                            {zone.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(rule.dropoffZones || []).map((zone) => (
                          <span
                            key={zone._id}
                            className="text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full"
                          >
                            {zone.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(rule.vehicles || [])
                          .filter((veh) => veh?.available)
                          .map((veh) => (
                            <span
                              key={veh._id}
                              className="text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full"
                            >
                              {veh.brand} {veh.model}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 w-32">
                      {deleteId === rule._id ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-red-600 font-semibold whitespace-nowrap">
                            Delete?
                          </span>
                          <button
                            onClick={() => handleDelete(rule._id)}
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
                          <Link
                            href={`/admin/availability-rules/${rule._id}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteId(rule._id)}
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
