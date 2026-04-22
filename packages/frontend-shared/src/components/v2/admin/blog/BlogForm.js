'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Lock,
  LockOpen,
  ImagePlus,
  X,
  Plus,
  Trash2,
  Globe,
  FileText,
  Clock3,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useGetBlogTags } from '../../../../hooks/blog-tags/useGetBlogTags.js';
import TinyEditor from '../../forms/TinyEditor.js';

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildFormData(form, coverFile, editorRef, isEdit = false) {
  const fd = new FormData();
  fd.append('title', form.title.trim());
  fd.append('slug', form.slug.trim());
  fd.append('excerpt', form.excerpt.trim());
  fd.append('quickAnswer', form.quickAnswer.trim());
  fd.append('content', editorRef.current ? editorRef.current.getContent() : form.content);
  fd.append('status', form.status);
  fd.append('metaTitle', form.metaTitle.trim());
  fd.append('metaDescription', form.metaDescription.trim());

  if (form.status === 'scheduled' && form.scheduledAt) {
    fd.append('scheduledAt', new Date(form.scheduledAt).toISOString());
  }

  form.tags.forEach((tag) => fd.append('tags', tag));

  const validFaqs = form.faqs.filter(
    (f) => f.question.trim() && f.answer.trim(),
  );
  if (validFaqs.length) fd.append('faqs', JSON.stringify(validFaqs));

  if (coverFile) fd.append(isEdit ? 'newCoverImage' : 'coverImage', coverFile);

  return fd;
}

/* --- UI primitives ---------------------------------------------------------- */

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-300 transition';
const textareaCls = `${inputCls} resize-none`;

function Field({ label, required, hint, counter, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {counter !== undefined && (
          <span className="text-[11px] text-gray-300">{counter}</span>
        )}
      </div>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Card({ title, collapsible = false, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div
        role={collapsible ? 'button' : undefined}
        onClick={() => collapsible && setOpen((o) => !o)}
        className={`flex items-center justify-between px-5 py-3.5 border-b border-gray-100 ${
          collapsible ? 'cursor-pointer select-none hover:bg-gray-50/60' : ''
        }`}
      >
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          {title}
        </p>
        {collapsible &&
          (open ? (
            <ChevronUp size={13} className="text-gray-400" />
          ) : (
            <ChevronDown size={13} className="text-gray-400" />
          ))}
      </div>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getAuthorName(person) {
  if (!person) return '—';
  if (typeof person === 'string') return person;
  return person.name || person.username || person.email || '—';
}

/* --- Status options --------------------------------------------------------- */

const STATUS_OPTIONS = [
  {
    value: 'draft',
    label: 'Draft',
    Icon: FileText,
    dot: 'bg-gray-400',
    desc: 'Save without publishing',
  },
  {
    value: 'published',
    label: 'Published',
    Icon: Globe,
    dot: 'bg-green-500',
    desc: 'Make live immediately',
  },
  {
    value: 'scheduled',
    label: 'Scheduled',
    Icon: Clock3,
    dot: 'bg-amber-400',
    desc: 'Publish at a future date',
  },
];

/* --- TinyMCE config --------------------------------------------------------- */

/* --- BlogForm --------------------------------------------------------------- */

/**
 * Reusable blog create / edit form.
 *
 * Props:
 *  - initialData  Blog object when editing, null when creating
 *  - onSubmit(fd: FormData)  Called with the built FormData on save
 *  - isPending    Boolean — disables submit while the mutation is in flight
 */
export default function BlogForm({ initialData = null, onSubmit, isPending }) {
  const isEdit = !!initialData?._id;

  /* -- form state ----------------------------------------------- */
  const [form, setForm] = useState(() => ({
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    excerpt: initialData?.excerpt ?? '',
    quickAnswer: initialData?.quickAnswer ?? '',
    content: initialData?.content ?? '',
    status: initialData?.status ?? 'draft',
    scheduledAt: initialData?.scheduledAt
      ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
      : '',
    tags: initialData?.tags ?? [],
    faqs: initialData?.faqs ?? [],
    metaTitle: initialData?.metaTitle ?? '',
    metaDescription: initialData?.metaDescription ?? '',
  }));

  const [slugLocked, setSlugLocked] = useState(isEdit);
  const [faqMode, setFaqMode] = useState('plain'); // 'plain' | 'json'
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(
    initialData?.coverImageUrl ?? null,
  );
  const [minimumScheduleAt] = useState(() =>
    new Date(Date.now() + 60_000).toISOString().slice(0, 16),
  );
  const coverInputRef = useRef(null);
  const editorRef = useRef(null);

  const { tags: availableTags, isLoadingBlogTags } = useGetBlogTags();

  /* -- helpers -------------------------------------------------- */

  function set(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !slugLocked) next.slug = slugify(value);
      return next;
    });
  }

  /* -- cover image ----------------------------------------------- */

  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function removeCover() {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  }

  /* -- FAQs ------------------------------------------------------ */

  function addFaq() {
    set('faqs', [...form.faqs, { question: '', answer: '' }]);
  }

  function updateFaq(i, field, value) {
    set(
      'faqs',
      form.faqs.map((faq, idx) =>
        idx === i ? { ...faq, [field]: value } : faq,
      ),
    );
  }

  function removeFaq(i) {
    set(
      'faqs',
      form.faqs.filter((_, idx) => idx !== i),
    );
  }

  function switchToJson() {
    setJsonText(JSON.stringify(form.faqs, null, 2));
    setJsonError('');
    setFaqMode('json');
  }

  function switchToPlain() {
    try {
      const parsed = JSON.parse(jsonText || '[]');
      if (!Array.isArray(parsed)) throw new Error('Root must be an array');
      set(
        'faqs',
        parsed.map((item) => ({
          question: String(item.question ?? ''),
          answer: String(item.answer ?? ''),
        })),
      );
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

  /* -- submit ---------------------------------------------------- */

  function handleSubmit(e) {
    e.preventDefault();
    if (faqMode === 'json') {
      try {
        const parsed = JSON.parse(jsonText || '[]');
        if (!Array.isArray(parsed)) throw new Error('Root must be an array');
        const resolvedForm = {
          ...form,
          faqs: parsed.map((item) => ({
            question: String(item.question ?? ''),
            answer: String(item.answer ?? ''),
          })),
        };
        setJsonError('');
        onSubmit(buildFormData(resolvedForm, coverFile, editorRef, isEdit));
      } catch (e) {
        setJsonError(e.message || 'Invalid JSON');
      }
      return;
    }
    onSubmit(buildFormData(form, coverFile, editorRef, isEdit));
  }

  /* -- render ---------------------------------------------------- */

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-5">
      {/* -- Page header -------------------------------------------- */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              {isEdit ? 'Edit Post' : 'New Post'}
            </h2>
            {isEdit && form.slug && (
              <p className="text-[11px] text-gray-400 mt-0.5 font-mono truncate max-w-xs">
                /blog/{form.slug}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !form.title.trim() || !form.content.trim()}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Post'}
        </button>
      </div>

      {/* -- Two-column body ----------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
        {/* -- Main column -------------------------------------------- */}
        <div className="space-y-5">
          {/* Post details */}
          <Card title="Post Details">
            <div className="space-y-4">
              <Field
                label="Title"
                required
                counter={`${form.title.length}/200`}
              >
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Enter post title…"
                  maxLength={200}
                  className={inputCls}
                />
              </Field>

              <Field label="Slug" hint={`/blog/${form.slug || '…'}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugLocked(true);
                      set('slug', e.target.value);
                    }}
                    placeholder="auto-generated-from-title"
                    className={`${inputCls} font-mono text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() => setSlugLocked((l) => !l)}
                    title={
                      slugLocked
                        ? 'Unlock — auto-generate from title'
                        : 'Lock slug'
                    }
                    className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition shrink-0"
                  >
                    {slugLocked ? <Lock size={14} /> : <LockOpen size={14} />}
                  </button>
                </div>
              </Field>

              <Field
                label="Excerpt"
                hint="Short description shown in blog listings and search results."
              >
                <textarea
                  value={form.excerpt}
                  onChange={(e) => set('excerpt', e.target.value)}
                  rows={2}
                  placeholder="A brief summary of this post…"
                  className={textareaCls}
                />
              </Field>

              <Field
                label="Quick Answer"
                hint="A concise answer displayed at the top of the post. Max 500 characters."
                counter={`${form.quickAnswer.length}/500`}
              >
                <textarea
                  value={form.quickAnswer}
                  onChange={(e) => set('quickAnswer', e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Optional one-paragraph direct answer…"
                  className={textareaCls}
                />
              </Field>
            </div>
          </Card>

          {/* Content editor */}
          <Card title="Content">
            <TinyEditor
              editorRef={editorRef}
              initialValue={form.content}
            />
          </Card>

          {/* FAQs */}
          <Card title="FAQs" collapsible defaultOpen={form.faqs.length > 0}>
            {/* Mode toggle */}
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
                {jsonError && (
                  <p className="text-xs text-red-500 font-medium">⚠ {jsonError}</p>
                )}
                <p className="text-[11px] text-gray-400">
                  Paste a JSON array of <code>{`{"question","answer"}`}</code> objects.
                  Switch to <strong>Plain text</strong> to apply, or just save directly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.faqs.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">
                    No FAQs yet. Add Q&amp;A pairs to improve SEO and reader
                    experience.
                  </p>
                )}

                {form.faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-gray-100 rounded-xl p-4 space-y-3 group relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeFaq(i)}
                      className="absolute top-3 right-3 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>

                    <Field label={`Question ${i + 1}`} required>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(i, 'question', e.target.value)}
                        maxLength={300}
                        placeholder="e.g. Does travel insurance cover pre-existing conditions?"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Answer" required>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                        rows={3}
                        placeholder="Provide a clear, helpful answer…"
                        className={textareaCls}
                      />
                    </Field>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addFaq}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-200 hover:border-primary-300 hover:text-primary-700 text-gray-400 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <Plus size={13} /> Add FAQ
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* -- Sidebar ------------------------------------------------- */}
        <div className="space-y-4 xl:sticky xl:top-6">
          {/* Cover image */}
          {isEdit && (
            <Card title="Post Info">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">Author</span>
                  <span className="font-semibold text-gray-700 text-right">{getAuthorName(initialData?.author)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">Publisher</span>
                  <span className="font-semibold text-gray-700 text-right">{getAuthorName(initialData?.publisher)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">Created</span>
                  <span className="font-semibold text-gray-700 text-right">{fmtDate(initialData?.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">Updated</span>
                  <span className="font-semibold text-gray-700 text-right">{fmtDate(initialData?.updatedAt)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Cover image */}
          <Card title="Cover Image">
            {coverPreview ? (
              <div className="relative group rounded-xl overflow-hidden border border-gray-100">
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  width={1200}
                  height={630}
                  unoptimized
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="opacity-0 group-hover:opacity-100 transition px-3 py-1.5 text-xs font-bold bg-white text-gray-800 rounded-lg hover:bg-gray-100"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={removeCover}
                    className="opacity-0 group-hover:opacity-100 transition p-1.5 bg-white text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 rounded-xl py-8 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition">
                  <ImagePlus
                    size={18}
                    className="text-gray-400 group-hover:text-primary-600"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-500 group-hover:text-primary-700">
                    Upload cover image
                  </p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    PNG, JPG, WebP — 1200×630 recommended
                  </p>
                </div>
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
            {!isEdit && !coverPreview && (
              <p className="text-[11px] text-amber-600 font-medium mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
                Required to publish
              </p>
            )}
          </Card>

          {/* Publish settings */}
          <Card title="Publish">
            <div className="space-y-2">
              {STATUS_OPTIONS.map(({ value, label, Icon, dot, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.status === value
                      ? 'border-primary-300 bg-primary-50/60'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={form.status === value}
                    onChange={() => set('status', value)}
                    className="sr-only"
                  />
                  <span
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${dot}`}
                  />
                  <div>
                    <p
                      className={`text-xs font-semibold leading-snug ${
                        form.status === value
                          ? 'text-primary-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {label}
                    </p>
                    <p className="text-[11px] text-gray-400">{desc}</p>
                  </div>
                </label>
              ))}

              {form.status === 'scheduled' && (
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Publish date &amp; time{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    min={minimumScheduleAt}
                    onChange={(e) => set('scheduledAt', e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Tags */}
          <Card title="Tags">
            {isLoadingBlogTags ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-gray-300" />
              </div>
            ) : availableTags.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                No tags yet.{' '}
                <Link
                  href="/admin/blog-tags"
                  className="text-primary-600 hover:underline font-medium"
                >
                  Create tags →
                </Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const selected = form.tags.includes(tag.name);
                  return (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() =>
                        set(
                          'tags',
                          selected
                            ? form.tags.filter((t) => t !== tag.name)
                            : [...form.tags, tag.name],
                        )
                      }
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        selected
                          ? 'bg-primary-700 text-white border-primary-700'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-700'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* SEO */}
          <Card title="SEO" collapsible defaultOpen={false}>
            <div className="space-y-4">
              <Field
                label="Meta Title"
                hint="Defaults to post title if left blank."
              >
                <input
                  type="text"
                  value={form.metaTitle}
                  onChange={(e) => set('metaTitle', e.target.value)}
                  placeholder={form.title || 'Post title'}
                  className={inputCls}
                />
              </Field>

              <Field
                label="Meta Description"
                counter={`${form.metaDescription.length}/160`}
              >
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => set('metaDescription', e.target.value)}
                  rows={3}
                  maxLength={160}
                  placeholder="Short description for search results…"
                  className={`${textareaCls} ${
                    form.metaDescription.length > 150
                      ? 'border-amber-300 focus:ring-amber-400'
                      : ''
                  }`}
                />
              </Field>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
