'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  ArrowLeft, Lock, Unlock, ChevronDown, ChevronUp,
  Plus, Trash2, Star, Globe, EyeOff, Copy,
} from 'lucide-react';
import Link from 'next/link';

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function Card({ title, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div
        className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        {collapsible && (open
          ? <ChevronUp size={15} className="text-gray-400" />
          : <ChevronDown size={15} className="text-gray-400" />
        )}
      </div>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-600">{label}</label>
      {children}
      {error  && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {!error && hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 ${className}`}
    />
  );
}

function TextareaInput({ rows = 3, className = '', ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 resize-none ${className}`}
    />
  );
}

function SectionHeader({ label, onRemove }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-400 transition">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function AddButton({ onClick, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Plus size={13} /> {label}
    </button>
  );
}

function ItemBox({ children }) {
  return <div className="border border-gray-100 rounded-xl p-4 space-y-3">{children}</div>;
}

const STATUS_CFG = {
  published: { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200', label: 'Published' },
  draft:     { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600 border-gray-200',   label: 'Draft'     },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function VisaForm({
  initialData,
  onSubmit,
  isPending,
  onPublish,
  onUnpublish,
  isPublishing,
  isUnpublishing,
}) {
  const isEdit = !!initialData;

  const [faqMode,   setFaqMode]   = useState('plain');
  const [jsonText,  setJsonText]  = useState('');
  const [jsonError, setJsonError] = useState('');

  const [slugLocked, setSlugLocked] = useState(!!initialData);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      countryName:         initialData?.countryName         || '',
      slug:                initialData?.slug                || '',
      heroHeadline:        initialData?.heroHeadline        || '',
      heroSubheadline:     initialData?.heroSubheadline     || '',
      heroCtaText:         initialData?.heroCtaText         || '',
      finalCtaHeadline:    initialData?.finalCtaHeadline    || '',
      finalCtaText:        initialData?.finalCtaText        || '',
      metaTitle:           initialData?.metaTitle           || '',
      metaDescription:     initialData?.metaDescription     || '',
      qualifierItems:      initialData?.qualifierItems      || [],
      packages:            initialData?.packages            || [],
      processSteps:        initialData?.processSteps        || [],
      requirementSections: initialData?.requirementSections || [],
      pricingBreakdown:    initialData?.pricingBreakdown    || [],
      whyUs:               initialData?.whyUs               || [],
      testimonials:        initialData?.testimonials        || [],
      faqs:                initialData?.faqs                || [],
    },
  });

  const { fields: pkgFields,  append: appendPkg,  remove: removePkg  } = useFieldArray({ control, name: 'packages'            });
  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({ control, name: 'processSteps'         });
  const { fields: reqFields,  append: appendReq,  remove: removeReq  } = useFieldArray({ control, name: 'requirementSections'  });
  const { fields: pricFields, append: appendPric, remove: removePric } = useFieldArray({ control, name: 'pricingBreakdown'     });
  const { fields: whyFields,  append: appendWhy,  remove: removeWhy  } = useFieldArray({ control, name: 'whyUs'                });
  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } =
    useFieldArray({ control, name: 'testimonials' });
  const { fields: faqFields,  append: appendFaq,  remove: removeFaq,
    replace: replaceFaqs } = useFieldArray({ control, name: 'faqs' });

  const qualifierItems      = watch('qualifierItems')      || [];
  const watchedPackages     = watch('packages')            || [];
  const watchedReqSections  = watch('requirementSections') || [];
  const metaDesc            = watch('metaDescription')     || '';

  function handleCountryNameChange(e) {
    const val = e.target.value;
    setValue('countryName', val);
    if (!slugLocked) setValue('slug', slugify(val));
  }

  function setHighlighted(idx) {
    const pkgs = getValues('packages').map((pkg, i) => ({ ...pkg, isHighlighted: i === idx }));
    setValue('packages', pkgs);
  }

  function duplicateTestimonial(i) {
    const src = getValues(`testimonials.${i}`);
    appendTestimonial({ ...src });
  }

  function addQualifier() {
    setValue('qualifierItems', [...qualifierItems, '']);
  }
  function removeQualifier(i) {
    setValue('qualifierItems', qualifierItems.filter((_, idx) => idx !== i));
  }

  function addPkgFeature(pi) {
    const features = getValues(`packages.${pi}.features`) || [];
    setValue(`packages.${pi}.features`, [...features, '']);
  }
  function removePkgFeature(pi, fi) {
    const features = getValues(`packages.${pi}.features`) || [];
    setValue(`packages.${pi}.features`, features.filter((_, i) => i !== fi));
  }
  function addPkgExclusion(pi) {
    const exclusions = getValues(`packages.${pi}.exclusions`) || [];
    setValue(`packages.${pi}.exclusions`, [...exclusions, '']);
  }
  function removePkgExclusion(pi, ei) {
    const exclusions = getValues(`packages.${pi}.exclusions`) || [];
    setValue(`packages.${pi}.exclusions`, exclusions.filter((_, i) => i !== ei));
  }

  function addReqItem(si) {
    const items = getValues(`requirementSections.${si}.items`) || [];
    if (items.length >= 15) return;
    setValue(`requirementSections.${si}.items`, [...items, '']);
  }
  function removeReqItem(si, ii) {
    const items = getValues(`requirementSections.${si}.items`) || [];
    setValue(`requirementSections.${si}.items`, items.filter((_, i) => i !== ii));
  }

  function switchToJson() {
    const current = getValues('faqs') || [];
    setJsonText(JSON.stringify(current, null, 2));
    setJsonError('');
    setFaqMode('json');
  }
  function switchToPlain() {
    try {
      const parsed = JSON.parse(jsonText || '[]');
      if (!Array.isArray(parsed)) throw new Error('Root must be an array');
      replaceFaqs(parsed.map((item) => ({
        question: String(item.question ?? ''),
        answer:   String(item.answer   ?? ''),
      })));
      setJsonError('');
      setFaqMode('plain');
    } catch (e) {
      setJsonError(e.message || 'Invalid JSON');
    }
  }
  function toggleFaqMode(mode) {
    if (mode === faqMode) return;
    if (mode === 'json') switchToJson();
    else switchToPlain();
  }

  function onFormSubmit(data) {

    if (faqMode === 'json') {
      try {
        const parsed = JSON.parse(jsonText || '[]');
        if (!Array.isArray(parsed)) throw new Error('Root must be an array');
        data.faqs = parsed.map((item) => ({
          question: String(item.question ?? ''),
          answer:   String(item.answer   ?? ''),
        }));
        setJsonError('');
      } catch (e) {
        setJsonError(e.message || 'Invalid JSON');
        return;
      }
    }

    const highlightedCount = (data.packages || []).filter((p) => p.isHighlighted).length;
    if (highlightedCount > 1) {

      let seen = false;
      data.packages = data.packages.map((p) => {
        if (p.isHighlighted && !seen) { seen = true; return p; }
        return { ...p, isHighlighted: false };
      });
    }

    const file = data.heroImage?.[0] || null;
    delete data.heroImage;

    onSubmit({ data, file });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>

      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/visa"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} />
          Back to visa pages
        </Link>
        <span className="text-sm font-bold text-gray-800">
          {isEdit ? 'Edit Visa Page' : 'New Visa Page'}
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Draft'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">

        <div className="space-y-5">

          <Card title="Visa Details">
            <div className="space-y-4">
              <Field label="Country Name" error={errors.countryName?.message}>
                <TextInput
                  {...register('countryName', { required: 'Country name is required' })}
                  onChange={handleCountryNameChange}
                  placeholder="e.g. United Arab Emirates"
                />
              </Field>
              <Field label="Slug" hint="URL-safe identifier. Locked after first save to prevent broken links.">
                <div className="flex items-center gap-2">
                  <TextInput
                    {...register('slug', { required: 'Slug is required' })}
                    readOnly={slugLocked}
                    className={slugLocked ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setSlugLocked((l) => !l)}
                    className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition"
                    title={slugLocked ? 'Unlock slug' : 'Lock slug'}
                  >
                    {slugLocked ? <Lock size={13} /> : <Unlock size={13} />}
                  </button>
                </div>
                {errors.slug && <p className="text-xs text-red-500 font-medium mt-1">{errors.slug.message}</p>}
              </Field>
            </div>
          </Card>

          <Card title="Hero Section">
            <div className="space-y-4">
              <Field label="Headline">
                <TextInput {...register('heroHeadline')} placeholder="e.g. Apply for UAE Visa Online" />
              </Field>
              <Field label="Subheadline">
                <TextareaInput {...register('heroSubheadline')} rows={2} placeholder="Supporting copy beneath the headline…" />
              </Field>
              <Field label="CTA Button Text">
                <TextInput {...register('heroCtaText')} placeholder="e.g. Apply Now" />
              </Field>
            </div>
          </Card>

          <Card title="Qualifier Items" collapsible>
            <div className="space-y-3">
              {qualifierItems.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No items yet.</p>
              )}
              {qualifierItems.map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TextInput
                    {...register(`qualifierItems.${i}`)}
                    placeholder={`Item ${i + 1}…`}
                  />
                  <button
                    type="button"
                    onClick={() => removeQualifier(i)}
                    className="text-gray-300 hover:text-red-400 transition shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <AddButton onClick={addQualifier} label="Add Item" />
            </div>
          </Card>

          <Card title="Packages">
            <div className="space-y-4">
              {pkgFields.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No packages yet.</p>
              )}
              {pkgFields.map((field, i) => {
                const pkg         = watchedPackages[i] || {};
                const features    = pkg.features    || [];
                const exclusions  = pkg.exclusions  || [];
                const highlighted = pkg.isHighlighted || false;

                return (
                  <ItemBox key={field.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">Package {i + 1}</span>
                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          onClick={() => setHighlighted(i)}
                          title={highlighted ? 'Highlighted (click to remove)' : 'Set as highlighted package'}
                          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition ${
                            highlighted
                              ? 'bg-amber-50 border-amber-300 text-amber-600'
                              : 'bg-white border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-500'
                          }`}
                        >
                          <Star size={11} className={highlighted ? 'fill-amber-400 text-amber-400' : ''} />
                          {highlighted ? 'Highlighted' : 'Highlight'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePkg(i)}
                          className="text-gray-300 hover:text-red-400 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name">
                        <TextInput {...register(`packages.${i}.name`)} placeholder="e.g. Standard" />
                      </Field>
                      <Field label="Icon (emoji or name)">
                        <TextInput {...register(`packages.${i}.icon`)} placeholder="e.g. 🌟 or star" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Price">
                        <TextInput type="number" min="0" step="0.01" {...register(`packages.${i}.price`)} placeholder="0" />
                      </Field>
                      <Field label="Currency">
                        <TextInput {...register(`packages.${i}.currency`)} placeholder="AED" />
                      </Field>
                    </div>
                    <Field label="Timeline">
                      <TextInput {...register(`packages.${i}.timeline`)} placeholder="e.g. 3–5 business days" />
                    </Field>
                    <Field label="Description">
                      <TextareaInput {...register(`packages.${i}.description`)} rows={2} placeholder="Short package description…" />
                    </Field>

                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Features</p>
                      <div className="space-y-2">
                        {features.map((_, fi) => (
                          <div key={fi} className="flex items-center gap-2">
                            <input
                              value={features[fi]}
                              onChange={(e) => {
                                const updated = [...features];
                                updated[fi] = e.target.value;
                                setValue(`packages.${i}.features`, updated);
                              }}
                              placeholder={`Feature ${fi + 1}…`}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
                            />
                            <button type="button" onClick={() => removePkgFeature(i, fi)} className="text-gray-300 hover:text-red-400 transition shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <AddButton onClick={() => addPkgFeature(i)} label="Add Feature" />
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Exclusions</p>
                      <div className="space-y-2">
                        {exclusions.map((_, ei) => (
                          <div key={ei} className="flex items-center gap-2">
                            <input
                              value={exclusions[ei]}
                              onChange={(e) => {
                                const updated = [...exclusions];
                                updated[ei] = e.target.value;
                                setValue(`packages.${i}.exclusions`, updated);
                              }}
                              placeholder={`Exclusion ${ei + 1}…`}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
                            />
                            <button type="button" onClick={() => removePkgExclusion(i, ei)} className="text-gray-300 hover:text-red-400 transition shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <AddButton onClick={() => addPkgExclusion(i)} label="Add Exclusion" />
                      </div>
                    </div>
                  </ItemBox>
                );
              })}

              {pkgFields.length < 3 && (
                <AddButton
                  onClick={() => appendPkg({ name: '', price: 0, currency: 'AED', timeline: '', description: '', features: [], exclusions: [], icon: '', isHighlighted: false })}
                  label={`Add Package${pkgFields.length > 0 ? ` (${3 - pkgFields.length} remaining)` : ''}`}
                />
              )}
              {pkgFields.length === 3 && (
                <p className="text-[11px] text-gray-400">Maximum 3 packages reached.</p>
              )}
            </div>
          </Card>

          <Card title="Process Steps" collapsible>
            <div className="space-y-4">
              {stepFields.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No steps yet.</p>
              )}
              {stepFields.map((field, i) => (
                <ItemBox key={field.id}>
                  <SectionHeader label={`Step ${i + 1}`} onRemove={() => removeStep(i)} />
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <Field label="Title">
                      <TextInput {...register(`processSteps.${i}.title`)} placeholder="Step title…" />
                    </Field>
                    <Field label="Icon">
                      <TextInput {...register(`processSteps.${i}.icon`)} placeholder="🔍" className="w-20" />
                    </Field>
                  </div>
                  <Field label="Description">
                    <TextareaInput {...register(`processSteps.${i}.description`)} rows={2} placeholder="What happens in this step…" />
                  </Field>
                </ItemBox>
              ))}
              {stepFields.length < 7 && (
                <AddButton
                  onClick={() => appendStep({ title: '', description: '', icon: '' })}
                  label={`Add Step${stepFields.length > 0 ? ` (${7 - stepFields.length} remaining)` : ''}`}
                />
              )}
              {stepFields.length === 7 && (
                <p className="text-[11px] text-gray-400">Maximum 7 steps reached.</p>
              )}
            </div>
          </Card>

          <Card title="Requirement Sections" collapsible>
            <div className="space-y-4">
              {reqFields.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No sections yet.</p>
              )}
              {reqFields.map((field, si) => {
                const sectionItems = watchedReqSections?.[si]?.items || [];
                return (
                  <ItemBox key={field.id}>
                    <SectionHeader label={`Section ${si + 1}`} onRemove={() => removeReq(si)} />
                    <Field label="Title">
                      <TextInput {...register(`requirementSections.${si}.title`)} placeholder="e.g. Personal Documents" />
                    </Field>
                    <Field label="Intro (optional)">
                      <TextareaInput {...register(`requirementSections.${si}.intro`)} rows={2} placeholder="Brief description of this requirement group…" />
                    </Field>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Items</p>
                      <div className="space-y-2">
                        {sectionItems.map((_, ii) => (
                          <div key={ii} className="flex items-center gap-2">
                            <input
                              value={sectionItems[ii]}
                              onChange={(e) => {
                                const updated = [...sectionItems];
                                updated[ii] = e.target.value;
                                setValue(`requirementSections.${si}.items`, updated);
                              }}
                              placeholder={`Requirement ${ii + 1}…`}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
                            />
                            <button type="button" onClick={() => removeReqItem(si, ii)} className="text-gray-300 hover:text-red-400 transition shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <AddButton
                          onClick={() => addReqItem(si)}
                          label="Add Item"
                          disabled={sectionItems.length >= 15}
                        />
                        {sectionItems.length >= 15 && (
                          <p className="text-[11px] text-gray-400">Maximum 15 items per section reached.</p>
                        )}
                      </div>
                    </div>
                  </ItemBox>
                );
              })}
              {reqFields.length < 10 && (
                <AddButton
                  onClick={() => appendReq({ title: '', intro: '', items: [] })}
                  label={`Add Section${reqFields.length > 0 ? ` (${10 - reqFields.length} remaining)` : ''}`}
                />
              )}
              {reqFields.length === 10 && (
                <p className="text-[11px] text-gray-400">Maximum 10 sections reached.</p>
              )}
            </div>
          </Card>

          <Card title="Pricing Breakdown" collapsible>
            <div className="space-y-4">
              {pricFields.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No breakdown items yet.</p>
              )}
              {pricFields.map((field, i) => (
                <ItemBox key={field.id}>
                  <SectionHeader label={`Item ${i + 1}`} onRemove={() => removePric(i)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Description">
                      <TextInput {...register(`pricingBreakdown.${i}.item`)} placeholder="e.g. Visa Fee" />
                    </Field>
                    <Field label="Paid To">
                      <TextInput {...register(`pricingBreakdown.${i}.paidTo`)} placeholder="e.g. Embassy" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Amount">
                      <TextInput type="number" min="0" step="0.01" {...register(`pricingBreakdown.${i}.amount`)} placeholder="0" />
                    </Field>
                    <Field label="Currency">
                      <TextInput {...register(`pricingBreakdown.${i}.currency`)} placeholder="AED" />
                    </Field>
                  </div>
                  <Field label="Note (optional)">
                    <TextInput {...register(`pricingBreakdown.${i}.note`)} placeholder="Any additional note…" />
                  </Field>
                </ItemBox>
              ))}
              {pricFields.length < 15 && (
                <AddButton
                  onClick={() => appendPric({ item: '', amount: 0, currency: 'AED', paidTo: '', note: '' })}
                  label="Add Item"
                />
              )}
              {pricFields.length === 15 && (
                <p className="text-[11px] text-gray-400">Maximum 15 items reached.</p>
              )}
            </div>
          </Card>

          <Card title="Why Us" collapsible>
            <div className="space-y-4">
              {whyFields.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No items yet.</p>
              )}
              {whyFields.map((field, i) => (
                <ItemBox key={field.id}>
                  <SectionHeader label={`Point ${i + 1}`} onRemove={() => removeWhy(i)} />
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <Field label="Title">
                      <TextInput {...register(`whyUs.${i}.title`)} placeholder="e.g. Fast Processing" />
                    </Field>
                    <Field label="Icon">
                      <TextInput {...register(`whyUs.${i}.icon`)} placeholder="⚡" className="w-20" />
                    </Field>
                  </div>
                  <Field label="Description">
                    <TextareaInput {...register(`whyUs.${i}.description`)} rows={2} placeholder="Why this matters to applicants…" />
                  </Field>
                </ItemBox>
              ))}
              {whyFields.length < 6 && (
                <AddButton
                  onClick={() => appendWhy({ title: '', description: '', icon: '' })}
                  label={`Add Point${whyFields.length > 0 ? ` (${6 - whyFields.length} remaining)` : ''}`}
                />
              )}
              {whyFields.length === 6 && (
                <p className="text-[11px] text-gray-400">Maximum 6 points reached.</p>
              )}
            </div>
          </Card>

          <Card title="Testimonials" collapsible defaultOpen={false}>
            <div className="space-y-4">
              {testimonialFields.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No testimonials yet.</p>
              )}
              {testimonialFields.map((field, i) => (
                <ItemBox key={field.id}>

                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">Testimonial {i + 1}</span>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          {...register(`testimonials.${i}.isFeatured`)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-[11px] font-semibold text-gray-400">Featured</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => duplicateTestimonial(i)}
                        title="Duplicate"
                        className="text-gray-300 hover:text-primary-500 transition"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTestimonial(i)}
                        title="Delete"
                        className="text-gray-300 hover:text-red-400 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <Field label="Full Name">
                    <TextInput
                      {...register(`testimonials.${i}.name`)}
                      placeholder="e.g. Anjali R."
                      maxLength={100}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nationality">
                      <TextInput
                        {...register(`testimonials.${i}.nationality`)}
                        placeholder="e.g. Indian"
                        maxLength={100}
                      />
                    </Field>
                    <Field label="Visa Type">
                      <TextInput
                        {...register(`testimonials.${i}.visaType`)}
                        placeholder="e.g. Schengen Visa"
                        maxLength={100}
                      />
                    </Field>
                  </div>

                  <Field label="Quote" hint="Max 600 characters">
                    <TextareaInput
                      {...register(`testimonials.${i}.quote`)}
                      rows={3}
                      maxLength={600}
                      placeholder="Client testimonial in their own words…"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Rating (1–5)" hint="Shown as stars on the page">
                      <TextInput
                        type="number"
                        min="1"
                        max="5"
                        step="1"
                        {...register(`testimonials.${i}.rating`, { min: 1, max: 5 })}
                        placeholder="5"
                      />
                    </Field>
                    <Field label="Initials" hint="Up to 4 chars, fallback when no photo">
                      <TextInput
                        {...register(`testimonials.${i}.initials`)}
                        placeholder="AR"
                        maxLength={4}
                      />
                    </Field>
                  </div>

                  <Field label="Photo URL" hint="Optional Cloudinary URL — leave blank to use initials">
                    <TextInput
                      {...register(`testimonials.${i}.imageUrl`)}
                      placeholder="https://…"
                    />
                  </Field>
                </ItemBox>
              ))}

              {testimonialFields.length < 10 && (
                <AddButton
                  onClick={() => appendTestimonial({
                    name: '', nationality: '', visaType: '',
                    quote: '', rating: 5, initials: '', imageUrl: '', isFeatured: false,
                  })}
                  label={`Add Testimonial${testimonialFields.length > 0 ? ` (${10 - testimonialFields.length} remaining)` : ''}`}
                />
              )}
              {testimonialFields.length === 10 && (
                <p className="text-[11px] text-gray-400">Maximum 10 testimonials reached.</p>
              )}
            </div>
          </Card>

          <Card title="FAQs" collapsible>

            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit mb-4">
              {['plain', 'json'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleFaqMode(mode)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                    faqMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode === 'plain' ? 'Plain text' : 'JSON'}
                </button>
              ))}
            </div>

            {faqMode === 'json' ? (
              <div className="space-y-2">
                <textarea
                  value={jsonText}
                  onChange={(e) => { setJsonText(e.target.value); setJsonError(''); }}
                  rows={14}
                  spellCheck={false}
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                  placeholder={`[\n  { "question": "What is…?", "answer": "It is…" }\n]`}
                />
                {jsonError && <p className="text-xs text-red-500 font-medium">⚠ {jsonError}</p>}
                <p className="text-[11px] text-gray-400">
                  Paste a JSON array of <code>{`{"question","answer"}`}</code> objects. Switch to <strong>Plain text</strong> to apply, or save directly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqFields.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No FAQs yet.</p>
                )}
                {faqFields.map((field, i) => (
                  <div key={field.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">FAQ {i + 1}</span>
                      <button type="button" onClick={() => removeFaq(i)} className="text-gray-300 hover:text-red-400 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <Field label="Question">
                      <TextInput {...register(`faqs.${i}.question`)} placeholder="Question…" />
                    </Field>
                    <Field label="Answer">
                      <TextareaInput {...register(`faqs.${i}.answer`)} rows={3} placeholder="Answer…" />
                    </Field>
                  </div>
                ))}
                {faqFields.length < 30 && (
                  <AddButton onClick={() => appendFaq({ question: '', answer: '' })} label="Add FAQ" />
                )}
                {faqFields.length === 30 && (
                  <p className="text-[11px] text-gray-400">Maximum 30 FAQs reached.</p>
                )}
              </div>
            )}
          </Card>

          <Card title="Final Call-to-Action" collapsible>
            <div className="space-y-4">
              <Field label="Headline">
                <TextInput {...register('finalCtaHeadline')} placeholder="e.g. Ready to apply?" />
              </Field>
              <Field label="Body Text">
                <TextareaInput {...register('finalCtaText')} rows={3} placeholder="Closing message encouraging visitors to take action…" />
              </Field>
            </div>
          </Card>

          <Card title="SEO" collapsible defaultOpen={false}>
            <div className="space-y-4">
              <Field label="Meta Title">
                <TextInput {...register('metaTitle')} placeholder="SEO title…" />
              </Field>
              <Field
                label="Meta Description"
                hint={`${metaDesc.length} / 160 characters`}
              >
                <TextareaInput
                  {...register('metaDescription')}
                  rows={3}
                  maxLength={160}
                  placeholder="SEO description…"
                  className={metaDesc.length > 155 ? 'border-amber-300' : ''}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-6">

          {isEdit && initialData && (
            <Card title="Visa Info">
              <dl className="space-y-2 text-xs">
                {[
                  ['Country', initialData.countryName || '—'],
                  ['Slug',    initialData.slug        || '—'],
                  ['Created', initialData.createdAt ? new Date(initialData.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
                  ['Updated', initialData.updatedAt ? new Date(initialData.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-gray-400 font-medium">{k}</dt>
                    <dd className="text-gray-700 font-semibold text-right truncate max-w-[160px]">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {isEdit && (
            <Card title="Visibility">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Status</span>
                  <StatusBadge status={initialData?.status} />
                </div>
                {initialData?.status === 'published' ? (
                  <button
                    type="button"
                    onClick={onUnpublish}
                    disabled={isUnpublishing}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition disabled:opacity-50"
                  >
                    <EyeOff size={13} />
                    {isUnpublishing ? 'Unpublishing…' : 'Unpublish'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPublish}
                    disabled={isPublishing}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition disabled:opacity-50"
                  >
                    <Globe size={13} />
                    {isPublishing ? 'Publishing…' : 'Publish'}
                  </button>
                )}
                <p className="text-[11px] text-gray-400">
                  Save your changes first, then publish when ready.
                </p>
              </div>
            </Card>
          )}

          <Card title="Hero Image">
            {initialData?.heroImageUrl && (
              <div className="mb-3">
                <img
                  src={initialData.heroImageUrl}
                  alt="Hero"
                  className="w-full h-32 object-cover rounded-xl border border-gray-100"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">Upload a new image to replace it.</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              {...register('heroImage')}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition"
            />
          </Card>
        </div>

      </div>
    </form>
  );
}
