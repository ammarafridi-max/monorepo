"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import {
  ArrowLeft,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useGetBlogTags } from "../../../hooks/blog-tags/useGetBlogTags.js";
import TinyEditor from "../forms/TinyEditor.js";

/* --- Helpers --------------------------------------------------------------- */

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildFormData(data, editorRef, isEdit) {
  const fd = new FormData();
  fd.append("title", data.title || "");
  fd.append("slug", data.slug || "");
  fd.append("excerpt", data.excerpt || "");
  fd.append("quickAnswer", data.quickAnswer || "");
  fd.append("metaTitle", data.metaTitle || "");
  fd.append("metaDescription", data.metaDescription || "");
  fd.append("status", data.status || "draft");
  fd.append("faqs", JSON.stringify(data.faqs || []));
  if (data.status === "scheduled") {
    fd.append("scheduledAt", data.scheduledAt || "");
  }
  if (editorRef.current) {
    fd.append("content", editorRef.current.getContent());
  }
  (data.tags || []).forEach((t) => fd.append("tags", t));
  if (data.coverImage?.[0]) {
    fd.append(isEdit ? "newCoverImage" : "coverImage", data.coverImage[0]);
  }
  return fd;
}

/* --- Sub-components -------------------------------------------------------- */

function Card({ title, children, collapsible = false }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div
        className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        {collapsible &&
          (open ? (
            <ChevronUp size={15} className="text-gray-400" />
          ) : (
            <ChevronDown size={15} className="text-gray-400" />
          ))}
      </div>
      {open && <div className="p-5">{children}</div>}
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

function TextareaInput({ rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 resize-none"
    />
  );
}

/* --- Main Component -------------------------------------------------------- */

export default function BlogForm({ initialData, onSubmit, isPending }) {
  const editorRef = useRef(null);
  const [slugLocked, setSlugLocked] = useState(!!initialData);
  const [seoOpen, setSeoOpen] = useState(false);
  const [faqMode, setFaqMode] = useState("plain"); // 'plain' | 'json'
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  const { tags: allTags = [] } = useGetBlogTags();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      excerpt: initialData?.excerpt || "",
      quickAnswer: initialData?.quickAnswer || "",
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
      status: initialData?.status || "draft",
      scheduledAt: initialData?.scheduledAt
        ? format(new Date(initialData.scheduledAt), "yyyy-MM-dd'T'HH:mm")
        : "",
      tags: initialData?.tags || [],
      faqs: initialData?.faqs || [],
    },
  });

  const status = watch("status");
  const metaDesc = watch("metaDescription") || "";
  const tags = watch("tags") || [];
  const faqs = watch("faqs") || [];

  function handleTitleChange(e) {
    const val = e.target.value;
    setValue("title", val);
    if (!slugLocked) {
      setValue("slug", slugify(val));
    }
  }

  function toggleTag(tagName) {
    const current = getValues("tags") || [];
    setValue(
      "tags",
      current.includes(tagName)
        ? current.filter((t) => t !== tagName)
        : [...current, tagName],
    );
  }

  function addFaq() {
    setValue("faqs", [
      ...(getValues("faqs") || []),
      { question: "", answer: "" },
    ]);
  }

  function removeFaq(i) {
    const current = getValues("faqs") || [];
    setValue(
      "faqs",
      current.filter((_, idx) => idx !== i),
    );
  }

  function switchToJson() {
    const current = getValues("faqs") || [];
    setJsonText(JSON.stringify(current, null, 2));
    setJsonError("");
    setFaqMode("json");
  }

  function switchToPlain() {
    try {
      const parsed = JSON.parse(jsonText || "[]");
      if (!Array.isArray(parsed)) throw new Error("Root must be an array");
      setValue(
        "faqs",
        parsed.map((item) => ({
          question: String(item.question ?? ""),
          answer: String(item.answer ?? ""),
        })),
      );
      setJsonError("");
      setFaqMode("plain");
    } catch (e) {
      setJsonError(e.message || "Invalid JSON");
    }
  }

  function toggleFaqMode(mode) {
    if (mode === faqMode) return;
    if (mode === "json") switchToJson();
    else switchToPlain();
  }

  function onFormSubmit(data) {
    if (faqMode === "json") {
      try {
        const parsed = JSON.parse(jsonText || "[]");
        if (!Array.isArray(parsed)) throw new Error("Root must be an array");
        data.faqs = parsed.map((item) => ({
          question: String(item.question ?? ""),
          answer: String(item.answer ?? ""),
        }));
        setJsonError("");
      } catch (e) {
        setJsonError(e.message || "Invalid JSON");
        return;
      }
    }
    onSubmit(buildFormData(data, editorRef, isEdit));
  }

  const isEdit = !!initialData;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/blog"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} />
          Back to posts
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">
            {isEdit ? "Edit Post" : "New Post"}
          </span>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Publish Post"}
        </button>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
        {/* -- Left column ---------------------------------------------- */}
        <div className="space-y-5">
          {/* Post Details */}
          <Card title="Post Details">
            <div className="space-y-4">
              <Field label="Title">
                <TextInput
                  {...register("title")}
                  onChange={handleTitleChange}
                  placeholder="Your post title…"
                />
              </Field>

              <Field label="Slug">
                <div className="flex items-center gap-2">
                  <TextInput
                    {...register("slug")}
                    readOnly={slugLocked}
                    className={`flex-1 px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 ${
                      slugLocked
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setSlugLocked((l) => !l)}
                    className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition"
                    title={slugLocked ? "Unlock slug" : "Lock slug"}
                  >
                    {slugLocked ? <Lock size={13} /> : <Unlock size={13} />}
                  </button>
                </div>
              </Field>

              <Field label="Excerpt">
                <TextareaInput
                  {...register("excerpt")}
                  rows={2}
                  placeholder="A short summary shown in listings…"
                />
              </Field>

              <Field label="Quick Answer">
                <TextareaInput
                  {...register("quickAnswer")}
                  rows={2}
                  placeholder="A concise answer that appears near the top of the post…"
                />
              </Field>
            </div>
          </Card>

          {/* Content */}
          <Card title="Content">
            <TinyEditor
              editorRef={editorRef}
              initialValue={initialData?.content}
            />
          </Card>

          {/* FAQs */}
          <Card title="FAQs" collapsible>
            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit mb-4">
              {["plain", "json"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleFaqMode(mode)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                    faqMode === mode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {mode === "plain" ? "Plain text" : "JSON"}
                </button>
              ))}
            </div>

            {faqMode === "json" ? (
              <div className="space-y-2">
                <textarea
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    setJsonError("");
                  }}
                  rows={14}
                  spellCheck={false}
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                  placeholder={`[\n  { "question": "What is…?", "answer": "It is…" }\n]`}
                />
                {jsonError && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠ {jsonError}
                  </p>
                )}
                <p className="text-[11px] text-gray-400">
                  Paste a JSON array of <code>{`{"question","answer"}`}</code>{" "}
                  objects. Switch to <strong>Plain text</strong> to apply, or
                  just save directly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No FAQs yet.
                  </p>
                ) : (
                  faqs.map((_, i) => (
                    <div
                      key={i}
                      className="border border-gray-100 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">
                          FAQ {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFaq(i)}
                          className="text-gray-300 hover:text-red-400 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <Field label="Question">
                        <TextInput
                          {...register(`faqs.${i}.question`)}
                          placeholder="Question…"
                        />
                      </Field>
                      <Field label="Answer">
                        <TextareaInput
                          {...register(`faqs.${i}.answer`)}
                          rows={3}
                          placeholder="Answer…"
                        />
                      </Field>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={addFaq}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-800 transition"
                >
                  <Plus size={13} /> Add FAQ
                </button>
              </div>
            )}
          </Card>

          {/* SEO — collapsible */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-gray-100 cursor-pointer select-none"
              onClick={() => setSeoOpen((o) => !o)}
            >
              <h3 className="text-sm font-bold text-gray-700">SEO</h3>
              {seoOpen ? (
                <ChevronUp size={15} className="text-gray-400" />
              ) : (
                <ChevronDown size={15} className="text-gray-400" />
              )}
            </div>
            {seoOpen && (
              <div className="p-5 space-y-4">
                <Field label="Meta Title">
                  <TextInput
                    {...register("metaTitle")}
                    placeholder="SEO title…"
                  />
                </Field>
                <Field
                  label="Meta Description"
                  hint={`${metaDesc.length} / 160 characters`}
                >
                  <TextareaInput
                    {...register("metaDescription")}
                    rows={3}
                    maxLength={160}
                    placeholder="SEO description…"
                    className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 resize-none ${
                      metaDesc.length > 155
                        ? "border-amber-300"
                        : "border-gray-200"
                    }`}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* -- Right sidebar --------------------------------------------- */}
        <div className="space-y-5 xl:sticky xl:top-6">
          {/* Post Info (edit only) */}
          {isEdit && initialData && (
            <Card title="Post Info">
              <dl className="space-y-2 text-xs">
                {[
                  ["Author", initialData.author?.name || "—"],
                  ["Publisher", initialData.publishedBy?.name || "—"],
                  [
                    "Created",
                    initialData.createdAt
                      ? format(new Date(initialData.createdAt), "dd MMM yyyy")
                      : "—",
                  ],
                  [
                    "Updated",
                    initialData.updatedAt
                      ? format(new Date(initialData.updatedAt), "dd MMM yyyy")
                      : "—",
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-gray-400 font-medium">{k}</dt>
                    <dd className="text-gray-700 font-semibold text-right truncate max-w-[160px]">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {/* Cover Image */}
          <Card title="Cover Image">
            {initialData?.coverImageUrl && (
              <div className="mb-3">
                <img
                  src={initialData.coverImageUrl}
                  alt="Cover"
                  className="w-full h-32 object-cover rounded-xl border border-gray-100"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Upload a new image to replace it.
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              {...register("coverImage")}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition"
            />
          </Card>

          {/* Publish */}
          <Card title="Publish">
            <div className="space-y-2">
              {["draft", "published", "scheduled"].map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={s}
                    {...register("status")}
                    className="accent-primary-700"
                  />
                  <span className="text-xs font-semibold text-gray-600 capitalize">
                    {s}
                  </span>
                </label>
              ))}
            </div>
            {status === "scheduled" && (
              <div className="mt-4">
                <Field label="Publish date & time">
                  <TextInput
                    type="datetime-local"
                    {...register("scheduledAt")}
                  />
                </Field>
              </div>
            )}
          </Card>

          {/* Tags */}
          <Card title="Tags">
            {allTags.length === 0 ? (
              <p className="text-xs text-gray-400">No tags available.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => {
                  const active = tags.includes(tag.name);
                  return (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? "bg-primary-700 border-primary-700 text-white"
                          : "bg-white border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </form>
  );
}
