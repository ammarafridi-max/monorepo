'use client';

// Empty field means inherit from the base visa page.

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Trash2, Globe, EyeOff, Loader2, Info, ExternalLink } from 'lucide-react';
import {
  Card, Field, TextInput, TextareaInput, AddButton, ItemBox,
} from './visaFormKit.js';

const clone = (v) => JSON.parse(JSON.stringify(v ?? []));
const norm = (s) => String(s ?? '').trim().toLowerCase();

const LIST_KEYS = ['packages', 'processSteps', 'pricingBreakdown', 'faqs', 'whyUs', 'testimonials'];

function seedFromBase(key, base, country) {
  const rows = clone(base?.[key]);
  if (key === 'packages' || key === 'pricingBreakdown') {
    return rows.map((r) => ({ ...r, currency: country.currency || r.currency }));
  }
  return rows;
}

function toDefaults(base, overlay, country) {
  const o = overlay || {};

  const baseReq = base?.requirementSections || [];
  const patches = new Map((o.requirementSections || []).map((s) => [norm(s.title), s]));

  const requirementSections = baseReq.map((s) => {
    const patch = patches.get(norm(s.title));
    patches.delete(norm(s.title));
    return {
      title: s.title,
      intro: patch?.intro ?? s.intro ?? '',
      items: patch?.items ?? s.items ?? [],
      _custom: !!patch,
      _extra: false,
    };
  });

  for (const extra of patches.values()) {
    requirementSections.push({
      title: extra.title,
      intro: extra.intro || '',
      items: extra.items || [],
      _custom: true,
      _extra: true,
    });
  }

  return {
    isPublished: !!o.isPublished,
    metaTitle: o.metaTitle || '',
    metaDescription: o.metaDescription || '',
    heroHeadline: o.heroHeadline || '',
    heroSubheadline: o.heroSubheadline || '',
    excerpt: o.excerpt || '',
    processingTime: o.processingTime || '',
    visaCentre: {
      name: o.visaCentre?.name || '',
      city: o.visaCentre?.city || country.hub || '',
      address: o.visaCentre?.address || '',
      note: o.visaCentre?.note || '',
    },
    requirementSections,
    packages: o.packages ? clone(o.packages) : seedFromBase('packages', base, country),
    processSteps: o.processSteps ? clone(o.processSteps) : clone(base?.processSteps),
    pricingBreakdown: o.pricingBreakdown ? clone(o.pricingBreakdown) : seedFromBase('pricingBreakdown', base, country),
    faqs: o.faqs ? clone(o.faqs) : clone(base?.faqs),
    whyUs: o.whyUs ? clone(o.whyUs) : clone(base?.whyUs),
    testimonials: o.testimonials ? clone(o.testimonials) : clone(base?.testimonials),
  };
}

function OverrideSwitch({ on, onChange, countryShort }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-[11px] font-medium text-gray-500">
        {on
          ? <>Written for <span className="font-bold text-gray-700">{countryShort}</span>. The base version is not used here.</>
          : <>Inherited from the base page. Every country shows the same thing.</>}
      </p>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
          on
            ? 'border-gray-200 text-gray-600 hover:bg-white'
            : 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
        }`}
      >
        {on ? 'Use the base version' : `Write a ${countryShort} version`}
      </button>
    </div>
  );
}

function StringList({ values, onChange, placeholder, max = 15 }) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <TextInput
            value={v}
            placeholder={`${placeholder} ${i + 1}…`}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, x) => x !== i))}
            className="text-gray-300 hover:text-red-400 transition shrink-0 cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <AddButton onClick={() => onChange([...values, ''])} label="Add item" disabled={values.length >= max} />
    </div>
  );
}

export default function VisaOverlayForm({
  base,
  country,
  overlay,
  onSave,
  onRemove,
  isSaving = false,
  isRemoving = false,
  siteUrl = '',
}) {
  const {
    register, handleSubmit, watch, setValue, control, reset,
    formState: { isDirty },
  } = useForm({ defaultValues: toDefaults(base, overlay, country) });

  const [custom, setCustom] = useState(() =>
    Object.fromEntries(LIST_KEYS.map((k) => [k, !!overlay?.[k]])),
  );
  const setOwn = (key, on) => {
    if (on && !watch(key)?.length) setValue(key, seedFromBase(key, base, country));
    setCustom((c) => ({ ...c, [key]: on }));
  };

  const pkgs = useFieldArray({ control, name: 'packages' });
  const steps = useFieldArray({ control, name: 'processSteps' });
  const prices = useFieldArray({ control, name: 'pricingBreakdown' });
  const faqs = useFieldArray({ control, name: 'faqs' });
  const why = useFieldArray({ control, name: 'whyUs' });
  const quotes = useFieldArray({ control, name: 'testimonials' });
  const reqs = useFieldArray({ control, name: 'requirementSections' });

  const watchedReq = watch('requirementSections') || [];
  const isPublished = watch('isPublished');
  const liveUrl = `${siteUrl}/${country.slug}/visa/${base?.slug || ''}`;

  function onFormSubmit(data) {
    const blank = (v) => (String(v ?? '').trim() === '' ? null : String(v).trim());

    // Untouched base sections must not be written, or the overlay stops tracking the base.
    const requirementSections = (data.requirementSections || [])
      .filter((s) => s._custom && String(s.title || '').trim())
      .map((s) => ({
        title: s.title.trim(),
        intro: s.intro || '',
        items: (s.items || []).filter((i) => String(i).trim()),
      }));

    const centre = data.visaCentre || {};
    const hasCentre = String(centre.name || '').trim() !== '';

    const payload = {
      residence: country.code,
      residenceName: country.name,
      residenceSlug: country.slug,
      visaSlug: base.slug,
      isPublished: !!data.isPublished,

      metaTitle: blank(data.metaTitle),
      metaDescription: blank(data.metaDescription),
      heroHeadline: blank(data.heroHeadline),
      heroSubheadline: blank(data.heroSubheadline),
      excerpt: blank(data.excerpt),
      processingTime: blank(data.processingTime),

      visaCentre: hasCentre
        ? {
            name: centre.name.trim(),
            city: centre.city || '',
            address: centre.address || '',
            note: centre.note || '',
          }
        : null,

      requirementSections: requirementSections.length ? requirementSections : null,
    };

    for (const key of LIST_KEYS) {
      const rows = data[key] || [];
      payload[key] = custom[key] && rows.length ? rows : null;
    }

    for (const p of payload.packages || []) p.price = Number(p.price) || 0;
    for (const p of payload.pricingBreakdown || []) p.amount = Number(p.amount) || 0;

    onSave(payload, () => reset(data));
  }

  const overrideCount =
    LIST_KEYS.filter((k) => custom[k]).length +
    watchedReq.filter((s) => s._custom).length +
    ['metaTitle', 'metaDescription', 'heroHeadline', 'heroSubheadline', 'excerpt', 'processingTime']
      .filter((k) => String(watch(k) || '').trim()).length +
    (String(watch('visaCentre.name') || '').trim() ? 1 : 0);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>

      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-extrabold text-gray-900">
          Edit {country.short || country.name} Version
        </h2>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          {isSaving && <Loader2 size={13} className="animate-spin" />}
          {isSaving ? 'Saving…' : isDirty ? 'Save Changes' : 'Saved'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">

        <div className="space-y-5">

          {/* What this screen is. Worth stating plainly — the inherit model is the
              one thing that makes the empty fields make sense. */}
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-primary-50 border border-primary-100">
            <Info size={15} className="text-primary-700 shrink-0 mt-0.5" />
            <p className="text-xs text-primary-900/80 leading-relaxed">
              You are editing the <span className="font-bold">{country.name}</span> version of{' '}
              <span className="font-bold">{base?.countryName}</span>. Anything you leave empty is taken
              from the base page, so you only fill in what is genuinely different here.
              {overrideCount === 0 && (
                <span className="block mt-1 font-semibold">
                  Nothing is different yet, so this page reads exactly like the base one.
                </span>
              )}
            </p>
          </div>

          <Card title="Page basics">
            <div className="space-y-4">
              <Field label="Hero headline" hint="Leave empty to use the base headline.">
                <TextInput {...register('heroHeadline')} placeholder={base?.heroHeadline || '—'} />
              </Field>
              <Field label="Hero subheadline">
                <TextareaInput rows={2} {...register('heroSubheadline')} placeholder={base?.heroSubheadline || '—'} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Processing time" hint="Local estimate, if it differs.">
                  <TextInput {...register('processingTime')} placeholder={base?.processingTime || '—'} />
                </Field>
                <Field label="Card excerpt" hint="Shown on the listing page.">
                  <TextInput {...register('excerpt')} placeholder={base?.excerpt || '—'} />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Search listing" collapsible defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-[11px] text-gray-400">
                Google shows one result per URL, so a country version that reuses the base title
                competes with the base page. Worth writing.
              </p>
              <Field label="Meta title" hint="The brand name is added automatically — don't repeat it.">
                <TextInput {...register('metaTitle')} placeholder={base?.metaTitle || '—'} />
              </Field>
              <Field label="Meta description">
                <TextareaInput rows={2} {...register('metaDescription')} placeholder={base?.metaDescription || '—'} />
              </Field>
            </div>
          </Card>

          <Card title="Visa centre" collapsible defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-[11px] text-gray-400">
                Where applicants physically go. There is no base version of this — it only exists
                per country.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <TextInput {...register('visaCentre.name')} placeholder="e.g. VFS Global" />
                </Field>
                <Field label="City">
                  <TextInput {...register('visaCentre.city')} placeholder={country.hub || 'e.g. Dubai'} />
                </Field>
              </div>
              <Field label="Address">
                <TextareaInput rows={2} {...register('visaCentre.address')} placeholder="Street address…" />
              </Field>
              <Field label="Note" hint="Anything applicants get wrong, e.g. appointment-only.">
                <TextInput {...register('visaCentre.note')} placeholder="Optional" />
              </Field>
            </div>
          </Card>

          {/* Requirements: the one card that merges per section rather than wholesale. */}
          <Card title="Documents required" collapsible>
            <p className="text-[11px] text-gray-400 mb-4">
              Each section is inherited until you customise it. Customising one leaves the rest
              tracking the base, so a change to the shared checklist still reaches this country.
            </p>
            <div className="space-y-4">
              {reqs.fields.map((field, si) => {
                const row = watchedReq[si] || {};
                const on = !!row._custom;
                const items = row.items || [];
                return (
                  <ItemBox
                    key={field.id}
                    label={`${row.title || 'Untitled section'}${row._extra ? ` · ${country.short} only` : ''}`}
                    defaultOpen={on}
                    onRemove={row._extra ? () => reqs.remove(si) : undefined}
                    actions={
                      !row._extra && (
                        <button
                          type="button"
                          onClick={() => setValue(`requirementSections.${si}._custom`, !on, { shouldDirty: true })}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            on
                              ? 'border-gray-200 text-gray-600 hover:bg-white'
                              : 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
                          }`}
                        >
                          {on ? 'Revert to base' : 'Customise'}
                        </button>
                      )
                    }
                  >
                    {!on && (
                      <p className="text-[11px] text-gray-400">
                        Inherited. {items.length} item{items.length === 1 ? '' : 's'} from the base page.
                      </p>
                    )}
                    {on && (
                      <>
                        {row._extra && (
                          <Field label="Section title">
                            <TextInput {...register(`requirementSections.${si}.title`)} placeholder="e.g. Emirates ID documents" />
                          </Field>
                        )}
                        <Field label="Intro (optional)">
                          <TextareaInput rows={2} {...register(`requirementSections.${si}.intro`)} placeholder={base?.requirementSections?.[si]?.intro || 'Brief description…'} />
                        </Field>
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Items</p>
                          <StringList
                            values={items}
                            placeholder="Requirement"
                            onChange={(next) => setValue(`requirementSections.${si}.items`, next, { shouldDirty: true })}
                          />
                        </div>
                      </>
                    )}
                  </ItemBox>
                );
              })}
              <AddButton
                onClick={() => reqs.append({ title: '', intro: '', items: [''], _custom: true, _extra: true })}
                label={`Add a ${country.short}-only section`}
              />
            </div>
          </Card>

          <Card title="Packages" collapsible>
            <OverrideSwitch on={custom.packages} countryShort={country.short} onChange={(v) => setOwn('packages', v)} />
            {custom.packages ? (
              <div className="space-y-4">
                {pkgs.fields.map((field, i) => (
                  <ItemBox key={field.id} label={watch(`packages.${i}.name`) || `Package ${i + 1}`} onRemove={() => pkgs.remove(i)}>
                    <Field label="Name">
                      <TextInput {...register(`packages.${i}.name`)} placeholder="e.g. Standard" />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Price">
                        <TextInput type="number" min="0" step="0.01" {...register(`packages.${i}.price`)} placeholder="0" />
                      </Field>
                      <Field label="Currency">
                        <TextInput {...register(`packages.${i}.currency`)} placeholder={country.currency || 'AED'} />
                      </Field>
                      <Field label="Timeline">
                        <TextInput {...register(`packages.${i}.timeline`)} placeholder="e.g. 10 days" />
                      </Field>
                    </div>
                    <Field label="Description">
                      <TextareaInput rows={2} {...register(`packages.${i}.description`)} />
                    </Field>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Includes</p>
                      <StringList
                        values={watch(`packages.${i}.features`) || []}
                        placeholder="Feature"
                        max={20}
                        onChange={(next) => setValue(`packages.${i}.features`, next, { shouldDirty: true })}
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Excludes</p>
                      <StringList
                        values={watch(`packages.${i}.exclusions`) || []}
                        placeholder="Exclusion"
                        max={20}
                        onChange={(next) => setValue(`packages.${i}.exclusions`, next, { shouldDirty: true })}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                      <input type="checkbox" {...register(`packages.${i}.isHighlighted`)} className="accent-primary-700" />
                      Most popular
                    </label>
                  </ItemBox>
                ))}
                <AddButton
                  onClick={() => pkgs.append({ name: '', price: 0, currency: country.currency || 'AED', timeline: '', description: '', features: [], exclusions: [], isHighlighted: false })}
                  label="Add package"
                />
              </div>
            ) : (
              <InheritedPreview rows={(base?.packages || []).map((p) => `${p.name} · ${p.currency} ${p.price}`)} />
            )}
          </Card>

          <Card title="How it works" collapsible defaultOpen={false}>
            <OverrideSwitch on={custom.processSteps} countryShort={country.short} onChange={(v) => setOwn('processSteps', v)} />
            {custom.processSteps ? (
              <div className="space-y-4">
                {steps.fields.map((field, i) => (
                  <ItemBox key={field.id} label={watch(`processSteps.${i}.title`) || `Step ${i + 1}`} onRemove={() => steps.remove(i)}>
                    <Field label="Title">
                      <TextInput {...register(`processSteps.${i}.title`)} placeholder="e.g. Book biometrics" />
                    </Field>
                    <Field label="Description">
                      <TextareaInput rows={2} {...register(`processSteps.${i}.description`)} />
                    </Field>
                  </ItemBox>
                ))}
                <AddButton onClick={() => steps.append({ title: '', description: '' })} label="Add step" disabled={steps.fields.length >= 7} />
              </div>
            ) : (
              <InheritedPreview rows={(base?.processSteps || []).map((s) => s.title)} />
            )}
          </Card>

          <Card title="Price breakdown" collapsible defaultOpen={false}>
            <OverrideSwitch on={custom.pricingBreakdown} countryShort={country.short} onChange={(v) => setOwn('pricingBreakdown', v)} />
            {custom.pricingBreakdown ? (
              <div className="space-y-4">
                {prices.fields.map((field, i) => (
                  <ItemBox key={field.id} label={watch(`pricingBreakdown.${i}.item`) || `Item ${i + 1}`} onRemove={() => prices.remove(i)}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Description">
                        <TextInput {...register(`pricingBreakdown.${i}.item`)} placeholder="e.g. Embassy fee" />
                      </Field>
                      <Field label="Paid to">
                        <TextInput {...register(`pricingBreakdown.${i}.paidTo`)} placeholder="e.g. Embassy" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Amount">
                        <TextInput type="number" min="0" step="0.01" {...register(`pricingBreakdown.${i}.amount`)} placeholder="0" />
                      </Field>
                      <Field label="Currency">
                        <TextInput {...register(`pricingBreakdown.${i}.currency`)} placeholder={country.currency || 'AED'} />
                      </Field>
                    </div>
                    <Field label="Note">
                      <TextInput {...register(`pricingBreakdown.${i}.note`)} placeholder="Optional" />
                    </Field>
                  </ItemBox>
                ))}
                <AddButton
                  onClick={() => prices.append({ item: '', amount: 0, currency: country.currency || 'AED', paidTo: '', note: '' })}
                  label="Add line"
                />
              </div>
            ) : (
              <InheritedPreview rows={(base?.pricingBreakdown || []).map((p) => `${p.item} · ${p.currency} ${p.amount}`)} />
            )}
          </Card>

          <Card title="FAQs" collapsible defaultOpen={false}>
            <OverrideSwitch on={custom.faqs} countryShort={country.short} onChange={(v) => setOwn('faqs', v)} />
            {custom.faqs ? (
              <div className="space-y-4">
                {faqs.fields.map((field, i) => (
                  <ItemBox key={field.id} label={watch(`faqs.${i}.question`) || `Question ${i + 1}`} onRemove={() => faqs.remove(i)}>
                    <Field label="Question">
                      <TextInput {...register(`faqs.${i}.question`)} />
                    </Field>
                    <Field label="Answer">
                      <TextareaInput rows={3} {...register(`faqs.${i}.answer`)} />
                    </Field>
                  </ItemBox>
                ))}
                <AddButton onClick={() => faqs.append({ question: '', answer: '' })} label="Add question" />
              </div>
            ) : (
              <InheritedPreview rows={(base?.faqs || []).map((f) => f.question)} />
            )}
          </Card>

          <Card title="Why us" collapsible defaultOpen={false}>
            <OverrideSwitch on={custom.whyUs} countryShort={country.short} onChange={(v) => setOwn('whyUs', v)} />
            {custom.whyUs ? (
              <div className="space-y-4">
                {why.fields.map((field, i) => (
                  <ItemBox key={field.id} label={watch(`whyUs.${i}.title`) || `Reason ${i + 1}`} onRemove={() => why.remove(i)}>
                    <Field label="Title">
                      <TextInput {...register(`whyUs.${i}.title`)} placeholder="e.g. Licensed Dubai office" />
                    </Field>
                    <Field label="Description">
                      <TextareaInput rows={2} {...register(`whyUs.${i}.description`)} />
                    </Field>
                  </ItemBox>
                ))}
                <AddButton onClick={() => why.append({ title: '', description: '' })} label="Add reason" />
              </div>
            ) : (
              <InheritedPreview rows={(base?.whyUs || []).map((w) => w.title)} />
            )}
          </Card>

          <Card title="Testimonials" collapsible defaultOpen={false}>
            <OverrideSwitch on={custom.testimonials} countryShort={country.short} onChange={(v) => setOwn('testimonials', v)} />
            {custom.testimonials ? (
              <div className="space-y-4">
                {quotes.fields.map((field, i) => (
                  <ItemBox key={field.id} label={watch(`testimonials.${i}.name`) || `Testimonial ${i + 1}`} onRemove={() => quotes.remove(i)}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name">
                        <TextInput {...register(`testimonials.${i}.name`)} />
                      </Field>
                      <Field label="Nationality">
                        <TextInput {...register(`testimonials.${i}.nationality`)} />
                      </Field>
                    </div>
                    <Field label="Quote">
                      <TextareaInput rows={3} {...register(`testimonials.${i}.quote`)} />
                    </Field>
                  </ItemBox>
                ))}
                <AddButton onClick={() => quotes.append({ name: '', nationality: '', quote: '', rating: 5 })} label="Add testimonial" />
              </div>
            ) : (
              <InheritedPreview rows={(base?.testimonials || []).map((t) => t.name)} />
            )}
          </Card>

        </div>

        <div className="space-y-5 xl:sticky xl:top-6">

          <Card title="Version Info" collapsible>
            <dl className="space-y-2 text-xs">
              {[
                ['Country',   country.name],
                ['Base page', base?.countryName || '—'],
                ['Overrides', overrideCount === 0 ? 'None yet' : `${overrideCount} field${overrideCount === 1 ? '' : 's'}`],
                ['URL',       base?.slug ? `/${country.slug}/visa/${base.slug}` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-gray-400 font-medium">{k}</dt>
                  <dd className="text-gray-700 font-semibold text-right truncate max-w-[160px]">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Visibility" collapsible>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Status</span>
                {isPublished
                  ? <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200"><Globe size={11} /> Live in {country.short}</span>
                  : <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-gray-100 text-gray-600 border-gray-200"><EyeOff size={11} /> Not live</span>}
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" {...register('isPublished')} className="accent-primary-700" />
                Live in {country.short}
              </label>

              {isPublished && base?.slug && (
                <a href={liveUrl} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-primary-700 truncate">
                  /{country.slug}/visa/{base.slug} <ExternalLink size={10} />
                </a>
              )}

              <p className="text-[11px] text-gray-400">
                This is saved with the form — tick it, then save.
                {base?.status !== 'published' && ' The base page is still a draft, so nothing is public until that is published too.'}
              </p>
            </div>
          </Card>

          {overlay && (
            <Card title="Danger Zone" collapsible defaultOpen={false}>
              <button
                type="button"
                onClick={onRemove}
                disabled={isRemoving}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isRemoving ? 'Removing…' : `Remove ${country.short} version`}
              </button>
              <p className="text-[11px] text-gray-400 mt-2">
                Deletes only this country version. The base page stays untouched.
              </p>
            </Card>
          )}
        </div>

      </div>
    </form>
  );
}

function InheritedPreview({ rows }) {
  if (!rows.length) {
    return <p className="text-xs text-gray-400 text-center py-3">The base page has nothing here either.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
          <span className="truncate">{r}</span>
        </li>
      ))}
    </ul>
  );
}
