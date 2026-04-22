import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  metaTitle: '',
  metaDescription: '',
};

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function BlogTagModal({ initial, onClose, onSave, saving }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name ?? '',
          slug: initial.slug ?? '',
          description: initial.description ?? '',
          metaTitle: initial.metaTitle ?? '',
          metaDescription: initial.metaDescription ?? '',
        }
      : EMPTY_FORM,
  );
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [slugError, setSlugError] = useState('');

  function set(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && autoSlug) next.slug = slugify(value);
      return next;
    });
  }

  const normalizedSlug = slugify(form.slug);
  const canSave = Boolean(form.name.trim()) && Boolean(normalizedSlug);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">
              {isEdit ? 'Edit Tag' : 'New Tag'}
            </p>
            {form.slug && (
              <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                /blog/tag/{form.slug}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Travel Tips"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlugError('');
                set('slug', e.target.value);
              }}
              placeholder="auto-generated"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Final slug: <span className="font-mono">{normalizedSlug || 'auto-generated'}</span>
            </p>
            {slugError && <p className="text-[11px] text-red-500 mt-1">{slugError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Brief description of this tag…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              SEO
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Meta Title
            </label>
            <input
              type="text"
              value={form.metaTitle}
              onChange={(e) => set('metaTitle', e.target.value)}
              placeholder="Override page title for search engines"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Meta Description
            </label>
            <textarea
              value={form.metaDescription}
              onChange={(e) => set('metaDescription', e.target.value)}
              rows={2}
              placeholder="Short description shown in search results…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {form.metaDescription.length}/160 characters
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!normalizedSlug) {
                setSlugError('Slug is required.');
                return;
              }

              onSave({ ...form, slug: normalizedSlug });
            }}
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Tag'}
          </button>
        </div>
      </div>
    </div>
  );
}
