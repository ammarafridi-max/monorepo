'use client';

import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useGetZones } from '../../../hooks/zones/useGetZones';
import { useGetVehicles } from '../../../hooks/vehicles/useGetVehicles';

function Card({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-600">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput({ ...props }) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
    />
  );
}

function ZoneMultiSelect({ label, zones, register, name }) {
  return (
    <Field label={label} hint="Hold Cmd/Ctrl to select multiple.">
      <div className="w-full h-[260px] bg-white p-2 rounded-xl border border-gray-200 overflow-y-auto">
        <select
          multiple
          className="w-full h-full outline-0 text-sm"
          {...register(name)}
        >
          {zones.map((zone) => (
            <option
              className="py-1 px-2 rounded"
              key={zone._id}
              value={zone._id}
            >
              {zone.name}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}

export default function AvailabilityRuleForm({ initialData, onSubmit, isPending }) {
  const isEdit = !!initialData;
  const { zones = [] } = useGetZones();
  const { vehicles = [] } = useGetVehicles();

  const initialVehicleMap = {};
  (initialData?.vehicles || []).forEach((v) => {
    initialVehicleMap[v._id] = v.available ? 'true' : 'false';
  });

  const {
    register,
    handleSubmit,
  } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      pickupZones: initialData?.pickupZones?.map((z) => z._id) || [],
      dropoffZones: initialData?.dropoffZones?.map((z) => z._id) || [],
      vehicles: initialVehicleMap,
      isActive: initialData?.isActive ?? true,
    },
  });

  function onFormSubmit(data) {
    const transformedVehicles = Object.entries(data.vehicles || {})
      .filter(([vehicle]) => vehicle && vehicle !== 'undefined')
      .map(([vehicle, available]) => ({
        vehicle,
        available: available === 'true',
      }));

    onSubmit({
      name: data.name,
      pickupZones: data.pickupZones || [],
      dropoffZones: data.dropoffZones || [],
      vehicles: transformedVehicles,
      isActive: data.isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/availability-rules"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} />
          Back to rules
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">
            {isEdit ? 'Edit Rule' : 'New Rule'}
          </span>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Rule'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="space-y-5">
          <Card title="Rule Details">
            <div className="space-y-4">
              <Field label="Rule Name">
                <TextInput
                  {...register('name', { required: true })}
                  placeholder="Enter availability rule name…"
                />
              </Field>
            </div>
          </Card>

          <Card title="Zones">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ZoneMultiSelect
                label="Pickup Zones"
                zones={zones}
                register={register}
                name="pickupZones"
              />
              <ZoneMultiSelect
                label="Dropoff Zones"
                zones={zones}
                register={register}
                name="dropoffZones"
              />
            </div>
          </Card>

          <Card title="Vehicles">
            {vehicles.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                No vehicles available.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">
                {vehicles.map((veh) => (
                  <div
                    key={veh._id}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 py-3"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {veh.brand} {veh.model}
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          value="true"
                          {...register(`vehicles.${veh._id}`)}
                          className="accent-green-600 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-gray-600">
                          Available
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          value="false"
                          {...register(`vehicles.${veh._id}`)}
                          className="accent-red-600 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-gray-600">
                          Unavailable
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-6">
          <Card title="Status">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                className="accent-primary-700"
              />
              <span className="text-xs font-semibold text-gray-600">Active</span>
            </label>
          </Card>
        </div>
      </div>
    </form>
  );
}
