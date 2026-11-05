'use client';

import { X } from 'lucide-react';

const PANEL_SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const SHEET_SIZE = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

const CLOSE_TONE = {
  light: 'text-gray-400',
  dark: 'text-gray-500',
};

export function Modal({
  size = 'md',
  title,
  subtitle,
  subtitleClass = 'text-[11px] text-gray-400 mt-0.5',
  titleExtra,
  showClose = true,
  closeSize = 15,
  panelClass = '',
  onClose,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${PANEL_SIZE[size]} bg-white rounded-2xl shadow-2xl overflow-hidden${panelClass ? ` ${panelClass}` : ''}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            {subtitle && <p className={subtitleClass}>{subtitle}</p>}
          </div>
          {titleExtra}
          {showClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <X size={closeSize} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Sheet({
  size = 'lg',
  title,
  titleClass = 'text-base font-semibold text-gray-900',
  titleExtra,
  spacing = 'space-y-4',
  maxHeight = 'max-h-[90vh]',
  closeTone = 'light',
  mobileOnly = false,
  as = 'div',
  onSubmit,
  onClose,
  children,
}) {
  const Panel = as;
  const panelProps = as === 'form' ? { onSubmit } : {};

  return (
    <div
      className={`${mobileOnly ? 'sm:hidden ' : ''}fixed inset-0 z-50 flex items-end ${mobileOnly ? '' : 'sm:items-center '}justify-center bg-black/40`}
      onClick={onClose}
    >
      <Panel
        {...panelProps}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full ${mobileOnly ? '' : `${SHEET_SIZE[size]} `}rounded-t-2xl ${mobileOnly ? '' : 'sm:rounded-2xl '}p-5 ${spacing} ${maxHeight} overflow-y-auto`}
      >
        <div className="flex items-center justify-between">
          {titleExtra ? (
            <div className="flex items-center gap-2">
              <h3 className={titleClass}>{title}</h3>
              {titleExtra}
            </div>
          ) : (
            <h3 className={titleClass}>{title}</h3>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg ${CLOSE_TONE[closeTone]} hover:bg-gray-100 transition`}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </Panel>
    </div>
  );
}
