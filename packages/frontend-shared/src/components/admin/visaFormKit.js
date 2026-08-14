'use client';


import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

export function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function Card({ title, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div
        className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {collapsible && (open
          ? <ChevronUp size={15} className="text-gray-400" />
          : <ChevronDown size={15} className="text-gray-400" />
        )}
      </div>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-600">{label}</label>
      {children}
      {error  && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {!error && hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 ${className}`}
    />
  );
}

export function TextareaInput({ rows = 3, className = '', ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 resize-none ${className}`}
    />
  );
}

export function DeleteButton({ onClick, title = 'Delete' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition"
    >
      <Trash2 size={12} />
      Delete
    </button>
  );
}

export function AddButton({ onClick, label, disabled }) {
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

export function ItemBox({ label, onRemove, actions, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!label) {
    return <div className="border border-gray-100 bg-gray-50 rounded-xl p-4 space-y-3">{children}</div>;
  }

  return (
    <div className="border border-gray-100 bg-gray-50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 min-w-0 select-none cursor-pointer"
        >
          {open
            ? <ChevronUp size={14} className="text-gray-400 shrink-0" />
            : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
          <span className="text-xs font-bold text-gray-500 truncate">{label}</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {onRemove && <DeleteButton onClick={onRemove} />}
        </div>
      </div>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

export const STATUS_CFG = {
  published: { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200', label: 'Published' },
  draft:     { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600 border-gray-200',   label: 'Draft'     },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

