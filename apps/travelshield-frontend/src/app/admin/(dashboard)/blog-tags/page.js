'use client';

import { useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  Pencil,
  Copy,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { useGetBlogTags } from '@travel-suite/frontend-shared/hooks/blog-tags/useGetBlogTags';
import { useCreateBlogTag } from '@travel-suite/frontend-shared/hooks/blog-tags/useCreateBlogTag';
import { useUpdateBlogTag } from '@travel-suite/frontend-shared/hooks/blog-tags/useUpdateBlogTag';
import { useDeleteBlogTag } from '@travel-suite/frontend-shared/hooks/blog-tags/useDeleteBlogTag';
import { useDuplicateBlogTag } from '@travel-suite/frontend-shared/hooks/blog-tags/useDuplicateBlogTag';
import BlogTagModal from './BlogTagModal';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function BlogTagsPage() {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [modal, setModal] = useState(null); // null | 'new' | { tag object }

  const { tags, isLoadingBlogTags } = useGetBlogTags(search);

  const { createBlogTag, isCreatingBlogTag } = useCreateBlogTag();
  const { updateBlogTag, isUpdatingBlogTag } = useUpdateBlogTag();
  const { deleteBlogTag, isDeletingBlogTag } = useDeleteBlogTag();
  const { duplicateBlogTag, isDuplicatingBlogTag } = useDuplicateBlogTag();

  const saving = isCreatingBlogTag || isUpdatingBlogTag;

  function handleSave(formData) {
    if (modal === 'new') {
      createBlogTag(formData, { onSuccess: () => setModal(null) });
    } else {
      updateBlogTag(
        { id: modal._id, tagData: formData },
        { onSuccess: () => setModal(null) },
      );
    }
  }

  function handleDelete(id) {
    deleteBlogTag(id, { onSettled: () => setDeleteId(null) });
  }

  return (
    <>
      {modal && (
        <BlogTagModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Blog Tags</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {tags.length} tag{tags.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={14} />
            New Tag
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white placeholder:text-gray-300"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {isLoadingBlogTags ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-gray-300" />
            </div>
          ) : tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Tag size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-bold text-gray-600">No tags found</p>
              <p className="text-xs text-gray-400 mt-1 mb-5">
                {search
                  ? 'Try a different search term or clear the filter.'
                  : 'Create your first tag to categorise blog posts.'}
              </p>
              {!search && (
                <button
                  onClick={() => setModal('new')}
                  className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus size={13} /> New Tag
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Name', 'Slug', 'Used In', 'Description', 'Created', ''].map(
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
                  {tags.map((tag) => (
                    <tr
                      key={tag._id}
                      className={`hover:bg-gray-50/60 transition-colors group ${
                        isDeletingBlogTag || isDuplicatingBlogTag
                          ? 'pointer-events-none'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                            <Tag size={13} className="text-primary-600" />
                          </div>
                          <span className="font-semibold text-gray-900 leading-snug">
                            {tag.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 truncate block">
                          {tag.slug}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-gray-700">
                          {tag.usageCount ?? 0} post{(tag.usageCount ?? 0) === 1 ? '' : 's'}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-[240px]">
                        {tag.description ? (
                          <p className="text-xs text-gray-500 truncate">
                            {tag.description}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {fmtDate(tag.createdAt)}
                      </td>

                      <td className="px-4 py-3 w-32">
                        {deleteId === tag._id ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-red-600 font-semibold whitespace-nowrap">
                              Delete?
                            </span>
                            <button
                              onClick={() => handleDelete(tag._id)}
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
                              onClick={() => setModal(tag)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => duplicateBlogTag(tag._id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                              title="Duplicate"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteId(tag._id)}
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
    </>
  );
}
