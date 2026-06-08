'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
      <label className="block text-xs font-semibold text-gray-600">{label}</label>
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

function MultiSelect({ options, ...props }) {
  return (
    <select
      multiple
      {...props}
      className="w-full h-48 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          className="py-1 px-2 cursor-pointer rounded"
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function PricingRuleForm({ initialData, onSubmit, isPending }) {
  const isEdit = !!initialData;

  const { zones: allZones = [], isLoadingZones } = useGetZones();
  const { vehicles: allVehicles = [], isLoadingVehicles } = useGetVehicles();

  const {
    register,
    handleSubmit,
  } = useForm({
    defaultValues: {
      pickupZones: (initialData?.pickupZones || []).map((z) => z._id || z),
      dropoffZones: (initialData?.dropoffZones || []).map((z) => z._id || z),
      vehicles: (initialData?.vehicles || []).map((v) => v._id || v),
      pricing: {
        oneWay: initialData?.pricing?.oneWay ?? '',
        return: initialData?.pricing?.return ?? '',
      },
    },
  });

  const zoneOptions = allZones.map((zone) => ({
    label: zone.name,
    value: zone._id,
  }));
  const vehicleOptions = allVehicles.map((vehicle) => ({
    label: `${vehicle.brand} ${vehicle.model}`,
    value: vehicle._id,
  }));

  function onFormSubmit(data) {
    const payload = {
      pickupZones: data.pickupZones || [],
      dropoffZones: data.dropoffZones || [],
      vehicles: data.vehicles || [],
      pricing: {
        oneWay: Number(data.pricing.oneWay),
        return: Number(data.pricing.return),
      },
    };
    onSubmit(payload);
  }

  const isLoading = isLoadingZones || isLoadingVehicles;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/pricing-rules"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} />
          Back to pricing rules
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">
            {isEdit ? 'Edit Pricing Rule' : 'New Pricing Rule'}
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
          <Card title="Vehicles & Routes">
            <div className="space-y-4">
              <Field
                label="Pickup Zones"
                hint="Hold Ctrl/Cmd to select multiple zones."
              >
                <MultiSelect
                  options={zoneOptions}
                  {...register('pickupZones')}
                />
              </Field>
              <Field
                label="Dropoff Zones"
                hint="Hold Ctrl/Cmd to select multiple zones."
              >
                <MultiSelect
                  options={zoneOptions}
                  {...register('dropoffZones')}
                />
              </Field>
              <Field
                label="Vehicles"
                hint="Hold Ctrl/Cmd to select multiple vehicles."
              >
                <MultiSelect
                  options={vehicleOptions}
                  {...register('vehicles')}
                />
              </Field>
            </div>
          </Card>

          <div className="space-y-5 xl:sticky xl:top-6">
            <Card title="Pricing">
              <div className="space-y-4">
                <Field label="One Way Price">
                  <TextInput
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    {...register('pricing.oneWay')}
                  />
                </Field>
                <Field label="Return Price">
                  <TextInput
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    {...register('pricing.return')}
                  />
                </Field>
              </div>
            </Card>
          </div>
        </div>
      )}
    </form>
  );
}
