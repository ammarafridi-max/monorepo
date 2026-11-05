'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function DetailCard({ title, icon: Icon, action, titleSize = 'text-xs', children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
          <p className={`${titleSize} font-bold text-gray-400 uppercase tracking-wider`}>{title}</p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function InfoRow({ label, value, mono, size = 'text-sm', labelTone = 'text-gray-400' }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className={`${size} ${labelTone} shrink-0`}>{label}</span>
      <span className={`${size} font-semibold text-gray-800 text-right break-all ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

export function PlainCard({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function PlainCardHeader({ children }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="text-sm font-bold text-gray-700">{children}</h3>
    </div>
  );
}

export function PlainCardBody({ children, className = '' }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function StackedInfoRow({ label, value, icon: Icon, labelWidth = 'w-32' }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span
        className={`flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide ${labelWidth} shrink-0 mt-0.5`}
      >
        {Icon && <Icon size={13} />}
        {label}
      </span>
      <span className="text-sm text-gray-800 leading-5 flex-1 min-w-0 break-words">
        {value ?? '—'}
      </span>
    </div>
  );
}

export function SectionCard({ title, subtitle, action, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function FormCard({ title, children, collapsible = false, headerAction }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div
        className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {headerAction}
          {collapsible &&
            (open ? (
              <ChevronUp size={15} className="text-gray-400" />
            ) : (
              <ChevronDown size={15} className="text-gray-400" />
            ))}
        </div>
      </div>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-green-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
