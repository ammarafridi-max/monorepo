'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import BlogForm from '@travel-suite/frontend-shared/components/v1/admin/blog/BlogForm';
import { useGetBlog }    from '@travel-suite/frontend-shared/hooks/blog/useGetBlog';
import { useUpdateBlog } from '@travel-suite/frontend-shared/hooks/blog/useUpdateBlog';

export default function EditBlogPage() {
  const { id }   = useParams();
  const router   = useRouter();

  const { blog, isLoadingBlog, isErrorBlog } = useGetBlog(id);
  const { updateBlog, isUpdatingBlog }       = useUpdateBlog();

  function handleSubmit(formData) {
    updateBlog(
      { id, blogData: formData },
      { onSuccess: () => router.push('/admin/blog') },
    );
  }

  /* -- Loading --------------------------------------------------- */
  if (isLoadingBlog) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading post…</p>
        </div>
      </div>
    );
  }

  /* -- Error ----------------------------------------------------- */
  if (isErrorBlog || !blog) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Post not found</p>
            <p className="text-xs text-gray-400 mt-1">
              This post may have been deleted or the ID is incorrect.
            </p>
          </div>
          <Link
            href="/admin/blog"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
          >
            <ArrowLeft size={13} /> Back to posts
          </Link>
        </div>
      </div>
    );
  }

  /* -- Form — only rendered once blog data is available so TinyMCE
         receives the correct initialValue on first mount ------- */
  return (
    <BlogForm
      initialData={blog}
      onSubmit={handleSubmit}
      isPending={isUpdatingBlog}
    />
  );
}
