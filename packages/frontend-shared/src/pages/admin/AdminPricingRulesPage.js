'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  Search,
} from 'lucide-react';
import { useGetPricingRules } from '../../hooks/pricing-rules/useGetPricingRules';
import { useDeletePricingRule } from '../../hooks/pricing-rules/useDeletePricingRule';
import { useDuplicatePricingRule } from '../../hooks/pricing-rules/useDuplicatePricingRule';
import { useGetZones } from '../../hooks/zones/useGetZones';
import { useGetVehicles } from '../../hooks/vehicles/useGetVehicles';

export default function AdminPricingRulesPage() {
  const [deleteId, setDeleteId] = useState(null);
  const [name, setName] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [pickupZoneId, setPickupZoneId] = useState('');
  const [dropoffZoneId, setDropoffZoneId] = useState('');

  const { pricingRules = [], isLoadingPricingRules } = useGetPricingRules({
    name: name.trim() || undefined,
    vehicleId: vehicleId || undefined,
    pickupZoneId: pickupZoneId || undefined,
    dropoffZoneId: dropoffZoneId || undefined,
  });
  const { deletePricingRule, isDeletingPricingRule } = useDeletePricingRule();
  const { duplicatePricingRule } = useDuplicatePricingRule();
  const { zones = [] } = useGetZones();
  const { vehicles = [] } = useGetVehicles();

  function handleDelete(id) {
    deletePricingRule(id, { onSettled: () => setDeleteId(null) });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Pricing Rules</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {pricingRules.length}{' '}
            {pricingRules.length === 1 ? 'rule' : 'rules'} configured
          </p>
        </div>
        <Link
          href="/admin/pricing-rules/new"
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={14} /> Add Pricing Rule
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search by name"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
          />
        </div>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Vehicles</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle._id} value={vehicle._id}>
              {vehicle.brand} {vehicle.model}
            </option>
          ))}
        </select>
        <select
          value={pickupZoneId}
          onChange={(e) => setPickupZoneId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Pickup Zones</option>
          {zones.map((zone) => (
            <option key={zone._id} value={zone._id}>
              {zone.name}
            </option>
          ))}
        </select>
        <select
          value={dropoffZoneId}
          onChange={(e) => setDropoffZoneId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Dropoff Zones</option>
          {zones.map((zone) => (
            <option key={zone._id} value={zone._id}>
              {zone.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingPricingRules ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : pricingRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Tag size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">
                No pricing rules yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Add your first pricing rule to get started.
              </p>
            </div>
            <Link
              href="/admin/pricing-rules/new"
              className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={13} /> Add Pricing Rule
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Name', 'Vehicles', 'From Zone(s)', 'To Zone(s)', 'Pricing', ''].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pricingRules.map((rule) => (
                  <tr
                    key={rule._id}
                    className={`hover:bg-gray-50/60 transition-colors group ${isDeletingPricingRule ? 'pointer-events-none' : ''}`}
                  >
                    <td className="px-4 py-3 font-bold text-gray-900 align-top">
                      {rule.name}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-0.5">
                        {(rule.vehicles || []).map((vehicle) => (
                          <span key={vehicle._id} className="text-gray-700">
                            {vehicle.brand} {vehicle.model}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-0.5">
                        {(rule.pickupZones || []).map((zone) => (
                          <span key={zone._id} className="text-gray-700">
                            {zone.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-0.5">
                        {(rule.dropoffZones || []).map((zone) => (
                          <span key={zone._id} className="text-gray-700">
                            {zone.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <span className="block text-gray-700">
                        One Way: {rule.pricing?.oneWay}
                      </span>
                      <span className="block text-gray-700">
                        Return: {rule.pricing?.return}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-40 align-top">
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
                            href={`/admin/pricing-rules/${rule._id}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => duplicatePricingRule(rule._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
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
