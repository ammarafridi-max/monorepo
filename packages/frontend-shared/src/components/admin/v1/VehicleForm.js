'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDeleteVehicleImage } from '../../../hooks/vehicles/useDeleteVehicleImage.js';

const TYPES = ['Sedan', 'Crossover', 'SUV', 'Van'];
const FUELS = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const CLASSES = ['Standard', 'Premium', 'Business', 'Luxury'];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildFormData(data) {
  const fd = new FormData();

  fd.append('brand', data.brand || '');
  fd.append('model', data.model || '');
  fd.append('year', data.year || '');
  fd.append('description', data.description || '');
  fd.append('passengers', data.passengers || '');
  fd.append('luggage', data.luggage || '');
  fd.append('type', data.type || '');
  fd.append('fuel', data.fuel || '');
  fd.append('class', data.class || '');

  fd.append(
    'pricing',
    JSON.stringify({
      initialPrice: toNumber(data.initialPrice),
      hourlyRates: {
        hour1: toNumber(data.hour1),
        hour2: toNumber(data.hour2),
        hour3: toNumber(data.hour3),
        hour4: toNumber(data.hour4),
        hour5: toNumber(data.hour5),
        hour6: toNumber(data.hour6),
        hour7: toNumber(data.hour7),
        hour8: toNumber(data.hour8),
      },
      pricePerKm: toNumber(data.pricePerKm),
    }),
  );

  if (data.featuredImage?.[0]) {
    fd.append('featuredImage', data.featuredImage[0]);
  }
  if (data.images?.length > 0) {
    for (const img of data.images) {
      fd.append('images', img);
    }
  }

  return fd;
}

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

function TextareaInput({ rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 resize-none"
    />
  );
}

function SelectInput({ options, ...props }) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
    >
      {options.map((opt) => (
        <option value={opt} key={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function ExistingImage({ src, featured, isDeleting, onDelete }) {
  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-100">
      {featured && (
        <span className="absolute top-1.5 left-1.5 z-10 text-[10px] font-bold text-white bg-primary-700 px-1.5 py-0.5 rounded-full">
          Featured
        </span>
      )}
      <img src={src} alt="" className="w-full h-28 object-cover" />
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        className="absolute top-1.5 right-1.5 z-10 p-1.5 rounded-lg bg-white/90 text-gray-500 hover:text-red-600 hover:bg-white transition disabled:opacity-60"
        title="Delete image"
      >
        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
    </div>
  );
}

export default function VehicleForm({ initialData, onSubmit, isPending }) {
  const isEdit = !!initialData;
  const { deleteVehicleImage, isDeletingVehicleImage } = useDeleteVehicleImage();
  const [section, setSection] = useState('info');

  const pricing = initialData?.pricing || {};
  const hourly = pricing.hourlyRates || {};

  const { register, handleSubmit } = useForm({
    defaultValues: {
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      year: initialData?.year || '',
      description: initialData?.description || '',
      passengers: initialData?.passengers || '',
      luggage: initialData?.luggage || '',
      type: initialData?.type || TYPES[0],
      fuel: initialData?.fuel || FUELS[0],
      class: initialData?.class || CLASSES[0],
      initialPrice: pricing.initialPrice ?? '',
      hour1: hourly.hour1 ?? '',
      hour2: hourly.hour2 ?? '',
      hour3: hourly.hour3 ?? '',
      hour4: hourly.hour4 ?? '',
      hour5: hourly.hour5 ?? '',
      hour6: hourly.hour6 ?? '',
      hour7: hourly.hour7 ?? '',
      hour8: hourly.hour8 ?? '',
      pricePerKm: pricing.pricePerKm ?? '',
    },
  });

  function onFormSubmit(data) {
    onSubmit(buildFormData(data));
  }

  const sections = [
    { key: 'info', label: 'Information' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'images', label: 'Images' },
  ];

  const hourFields = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/vehicles"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} />
          Back to vehicles
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">
            {isEdit ? 'Edit Vehicle' : 'New Vehicle'}
          </span>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Vehicle'}
        </button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit mb-5">
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
              section === s.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl space-y-5">
        {section === 'info' && (
          <Card title="Vehicle Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Brand">
                <TextInput {...register('brand')} placeholder="Mercedes" />
              </Field>
              <Field label="Model">
                <TextInput {...register('model')} placeholder="S-Class" />
              </Field>
              <Field label="Year">
                <TextInput type="number" {...register('year')} placeholder="2024" />
              </Field>
              <Field label="Passengers">
                <TextInput type="number" {...register('passengers')} placeholder="4" />
              </Field>
              <Field label="Luggage">
                <TextInput type="number" {...register('luggage')} placeholder="2" />
              </Field>
              <Field label="Type">
                <SelectInput {...register('type')} options={TYPES} />
              </Field>
              <Field label="Fuel">
                <SelectInput {...register('fuel')} options={FUELS} />
              </Field>
              <Field label="Class">
                <SelectInput {...register('class')} options={CLASSES} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <TextareaInput
                    {...register('description')}
                    rows={4}
                    placeholder="A short description of the vehicle…"
                  />
                </Field>
              </div>
            </div>
          </Card>
        )}

        {section === 'pricing' && (
          <Card title="Pricing">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Initial Price">
                <TextInput type="number" {...register('initialPrice')} placeholder="0" />
              </Field>
              <Field label="Price Per KM">
                <TextInput type="number" {...register('pricePerKm')} placeholder="0" />
              </Field>
              {hourFields.map((h) => (
                <Field key={h} label={`${h} Hour${h === 1 ? '' : 's'} Price`}>
                  <TextInput type="number" {...register(`hour${h}`)} placeholder="0" />
                </Field>
              ))}
            </div>
          </Card>
        )}

        {section === 'images' && (
          <Card title="Images">
            {isEdit && (initialData?.featuredImage || initialData?.images?.length > 0) && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-600 mb-3">Existing Images</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {initialData?.featuredImage && (
                    <ExistingImage
                      featured
                      src={initialData.featuredImage}
                      isDeleting={isDeletingVehicleImage}
                      onDelete={() =>
                        deleteVehicleImage({
                          id: initialData._id,
                          imageUrl: initialData.featuredImage,
                        })
                      }
                    />
                  )}
                  {initialData?.images?.map((img, i) => (
                    <ExistingImage
                      key={i}
                      src={img}
                      isDeleting={isDeletingVehicleImage}
                      onDelete={() =>
                        deleteVehicleImage({
                          id: initialData._id,
                          imageUrl: img,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Field
                label="Featured Image"
                hint={isEdit ? 'Upload a new image to replace the featured one.' : undefined}
              >
                <input
                  type="file"
                  accept="image/*"
                  {...register('featuredImage')}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition"
                />
              </Field>
              <Field label="Gallery Images" hint="You can select multiple images.">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  {...register('images')}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition"
                />
              </Field>
            </div>
          </Card>
        )}
      </div>
    </form>
  );
}
