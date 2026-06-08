'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Users,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { useGetVehicles } from '../../hooks/vehicles/useGetVehicles';
import { useDeleteVehicle } from '../../hooks/vehicles/useDeleteVehicle';
import { useDuplicateVehicle } from '../../hooks/vehicles/useDuplicateVehicle';

function fmtPrice(value) {
  if (value == null) return '0';
  return Number(value).toLocaleString('en-US');
}

export default function AdminVehiclesPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);

  const { vehicles = [], isLoadingVehicles } = useGetVehicles();
  const { deleteVehicle, isDeletingVehicle } = useDeleteVehicle();
  const { duplicateVehicle, isDuplicatingVehicle } = useDuplicateVehicle();

  const busy = isDeletingVehicle || isDuplicatingVehicle;

  function handleDelete(id) {
    deleteVehicle(id, { onSettled: () => setDeleteId(null) });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Vehicles</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} configured
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/vehicles/new')}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={14} /> Add Vehicle
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingVehicles ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Car size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No vehicles yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first vehicle to get started.</p>
            </div>
            <button
              onClick={() => router.push('/admin/vehicles/new')}
              className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={13} /> Add Vehicle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Vehicle', 'Starting', '1 Hour', '8 Hours', 'Per KM', ''].map((h, i) => (
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
                {vehicles.map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    className={`hover:bg-gray-50/60 transition-colors group ${busy ? 'pointer-events-none' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 capitalize">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {vehicle.type && (
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full">
                            {vehicle.type}
                          </span>
                        )}
                        {vehicle.class && (
                          <span className="text-[10px] font-bold text-primary-700 bg-primary-50 border border-primary-100 px-1.5 py-0.5 rounded-full">
                            {vehicle.class}
                          </span>
                        )}
                        {vehicle.passengers != null && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full">
                            <Users size={9} /> {vehicle.passengers}
                          </span>
                        )}
                        {vehicle.luggage != null && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full">
                            <Briefcase size={9} /> {vehicle.luggage}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                      AED {fmtPrice(vehicle.pricing?.initialPrice)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                      AED {fmtPrice(vehicle.pricing?.hourlyRates?.hour1)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                      AED {fmtPrice(vehicle.pricing?.hourlyRates?.hour8)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                      AED {fmtPrice(vehicle.pricing?.pricePerKm)}
                    </td>
                    <td className="px-4 py-3 w-40">
                      {deleteId === vehicle._id ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-red-600 font-semibold whitespace-nowrap">Delete?</span>
                          <button
                            onClick={() => handleDelete(vehicle._id)}
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
                            onClick={() => router.push(`/admin/vehicles/${vehicle._id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => duplicateVehicle(vehicle._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(vehicle._id)}
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
