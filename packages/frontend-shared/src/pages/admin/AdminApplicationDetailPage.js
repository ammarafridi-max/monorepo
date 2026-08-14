'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Loader2, ChevronRight, ChevronDown, ChevronUp, User, CalendarCheck, StickyNote,
  Check, X, Eye, ExternalLink, FileText, UploadCloud, MapPin, Link2, Plus, Trash2,
} from 'lucide-react';
import { useAdminApplication } from '../../hooks/visa-applications/useAdminApplications.js';
import {
  useReviewDocument, useUpdateApplication, useAddNote, useAdminUpdateApplicant,
  useAdminUploadDocument, useAdminMarkInPerson, useAdminLinkSatisfiedBy, useAdminAddDocumentRow, useAdminRemoveDocumentRow,
} from '../../hooks/visa-applications/useVisaAppMutations.js';
import { useDocumentTypes } from '../../hooks/visa-applications/useRegistry.js';
import { NATIONALITIES } from '../../data/nationalities.js';
import { adminGetDocumentStreamBlobApi } from '../../services/apiVisaApplications.js';
import DatePicker from '../../components/form-elements/v1/DatePicker.js';
import NationalitySelect from '../../components/form-elements/v2/NationalitySelect.js';

const RELATIONSHIP_OPTIONS = [
  'Self', 'Father', 'Mother', 'Husband', 'Wife', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister',
  'Grandfather', 'Grandmother', 'Grandson', 'Granddaughter', 'Uncle', 'Aunt', 'Nephew', 'Niece',
  'Cousin', 'Legal guardian', 'Sponsor', 'Friend', 'Colleague', 'Other',
];

const EMPLOYMENT_OPTIONS = [
  ['', 'Not set'], ['EMPLOYED', 'Employed'], ['SELF_EMPLOYED', 'Self-employed'],
  ['BUSINESS_OWNER', 'Business owner'], ['STUDENT', 'Student'], ['RETIRED', 'Retired'], ['UNEMPLOYED', 'Not working'],
];
const FINANCIAL_OPTIONS = [['', 'Not set'], ['SELF', 'Self-funded'], ['SPONSORED', 'Sponsored']];
const MINOR_WITH_OPTIONS = [['', 'Not set'], ['BOTH_PARENTS', 'Both parents'], ['ONE_PARENT', 'One parent'], ['NEITHER', 'Neither parent']];

const APP_STATUSES = ['DRAFT', 'INFO_PENDING', 'INFO_COMPLETE', 'DOCS_READY', 'APPOINTMENT_BOOKED', 'SUBMITTED', 'DELIVERED', 'APPROVED', 'REJECTED', 'CANCELLED'];
const APPT_STATUSES = ['NOT_BOOKED', 'BOOKED', 'ATTENDED', 'RESCHEDULED', 'MISSED'];

const DOC_CFG = {
  REQUIRED: { dot: 'bg-gray-300', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  UPLOADED: { dot: 'bg-blue-400', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  APPROVED: { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { dot: 'bg-red-500', cls: 'bg-red-50 text-red-700 border-red-200' },
  NOT_APPLICABLE: { dot: 'bg-gray-300', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};
const SOURCE_META = {
  CUSTOMER: { label: 'Customer uploads', icon: User },
  AGENT: { label: 'Team-produced documents', icon: UploadCloud },
  IN_PERSON: { label: 'In person (at the centre)', icon: MapPin },
};

function Card({ title, icon: Icon, children, action, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const headerClickable = collapsible && !action;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div
        className={`flex items-center justify-between gap-2.5 flex-wrap gap-y-2 px-5 py-3.5 ${open ? 'border-b border-gray-100' : ''} ${headerClickable ? 'cursor-pointer select-none' : ''}`}
        onClick={headerClickable ? () => setOpen((o) => !o) : undefined}
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={14} className="text-gray-500 shrink-0" />}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        </div>
        {action}
        {collapsible && (
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className="text-gray-400 hover:text-gray-600 transition" title={open ? 'Hide' : 'Show'}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-gray-800 text-right break-all ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

function DocStatusBadge({ status }) {
  const cfg = DOC_CFG[status] || DOC_CFG.REQUIRED;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {String(status).toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function DocRow({ doc, applicantName, actions, allDocs, onView }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [marking, setMarking] = useState(false);
  const [note, setNote] = useState('');
  const [linking, setLinking] = useState(false);
  const uploadRef = useRef(null);

  const satisfied = Boolean(doc.satisfiedBy);
  const uploaded = Boolean(doc.cloudinaryPublicId);
  const shownStatus = satisfied ? (doc.effectiveStatus || 'UPLOADED') : doc.status;

  const history = doc.history || [];
  const versions = [
    ...(uploaded ? [{ version: doc.version, current: true }] : []),
    ...history.filter((h) => h.cloudinaryPublicId).map((h) => ({ version: h.version, current: false })),
  ].sort((a, b) => b.version - a.version);
  const [selectedVersion, setSelectedVersion] = useState(doc.version);

  const candidates = (allDocs || []).filter((d) => d.cloudinaryPublicId && !d.satisfiedBy && String(d._id) !== String(doc._id));

  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{doc.label || doc.docTypeKey}</span>
            <span className="text-[11px] text-gray-400">{applicantName}</span>
            <DocStatusBadge status={shownStatus} />
            {doc.isOptional && <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">Optional</span>}
            {doc.addedManually && <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 bg-indigo-50 rounded-full px-1.5 py-0.5">Added</span>}
            {doc.version > 0 && !satisfied && <span className="text-[10px] text-gray-500">v{doc.version}</span>}
          </div>
          {satisfied && (
            <p className="text-[12px] text-gray-500 mt-1">Satisfied by <strong>{doc.satisfiedByInfo?.applicantName}</strong>&apos;s {doc.satisfiedByInfo?.docTypeKey?.replace(/_/g, ' ').toLowerCase()}.</p>
          )}
          {doc.source === 'IN_PERSON' && doc.note && <p className="text-[12px] text-gray-500 mt-1">Note: {doc.note}</p>}
        </div>

        <div className="flex items-center flex-wrap gap-1.5 sm:shrink-0">
          {uploaded && versions.length > 1 && (
            <select value={selectedVersion} onChange={(e) => setSelectedVersion(Number(e.target.value))} title="Version"
              className="text-[11px] border border-gray-200 rounded-lg px-1.5 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
              {versions.map((v) => <option key={v.version} value={v.version}>v{v.version}{v.current ? ' (current)' : ''}</option>)}
            </select>
          )}
          {uploaded && !satisfied && (
            <button onClick={() => onView(doc, selectedVersion === doc.version ? undefined : selectedVersion)} className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-700 px-1.5"><Eye size={13} /> View</button>
          )}
          {/* Review inline for staff-produced (AGENT) docs. CUSTOMER uploads are
              reviewed in the View modal (Approve / Reject / Replace) instead. */}
          {uploaded && !satisfied && doc.source !== 'CUSTOMER' && doc.status !== 'APPROVED' && (
            <button onClick={() => actions.review.mutate({ documentId: doc._id, decision: 'APPROVED' })} disabled={actions.review.isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 text-[12px] font-semibold hover:bg-green-100 transition"><Check size={12} /> Approve</button>
          )}
          {uploaded && !satisfied && doc.source !== 'CUSTOMER' && doc.status !== 'REJECTED' && (
            <button onClick={() => setRejecting((r) => !r)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 text-[12px] font-semibold hover:bg-red-100 transition"><X size={12} /> Reject</button>
          )}
          {/* Staff upload — AGENT rows only (customers upload their own). */}
          {!satisfied && doc.source !== 'IN_PERSON' && doc.source !== 'CUSTOMER' && (
            <>
              <button onClick={() => uploadRef.current?.click()} disabled={actions.upload.isPending}
                className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 px-2.5 py-1 text-[12px] font-semibold hover:bg-primary-100 disabled:opacity-60">
                {actions.upload.isPending ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}{uploaded ? 'Replace' : 'Upload'}
              </button>
              <input ref={uploadRef} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) actions.upload.mutate({ documentId: doc._id, file }); e.target.value = ''; }} />
            </>
          )}
          {/* IN_PERSON mark complete */}
          {doc.source === 'IN_PERSON' && doc.status !== 'APPROVED' && (
            <button onClick={() => setMarking((m) => !m)} className="inline-flex items-center gap-1 rounded-lg bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 text-[12px] font-semibold hover:bg-green-100 transition"><Check size={12} /> Mark done</button>
          )}
          {/* Link / unlink satisfied-by */}
          {satisfied ? (
            <button onClick={() => actions.link.mutate({ documentId: doc._id, sourceDocumentId: null })} className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-700 px-1.5"><Link2 size={13} /> Unlink</button>
          ) : (!uploaded && doc.source !== 'IN_PERSON' && candidates.length > 0 && (
            <button onClick={() => setLinking((l) => !l)} className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-700 px-1.5"><Link2 size={13} /> Link</button>
          ))}
          {/* Waive / remove */}
          <button onClick={() => { if (confirm('Remove/waive this document row?')) actions.remove.mutate({ documentId: doc._id }); }} title="Waive / remove"
            className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={13} /></button>
        </div>
      </div>

      {!satisfied && doc.status === 'REJECTED' && doc.rejectionReason && (
        <p className="mt-2 text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">Reason: {doc.rejectionReason}</p>
      )}
      {rejecting && (
        <div className="mt-2">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required placeholder="Reason for rejection (shown to the customer)"
            className="w-full px-3 py-2 text-[13px] border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
          <div className="flex gap-2 mt-1.5">
            <button disabled={actions.review.isPending || !reason.trim()}
              onClick={() => actions.review.mutate({ documentId: doc._id, decision: 'REJECTED', rejectionReason: reason.trim() }, { onSuccess: () => { setRejecting(false); setReason(''); } })}
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-[12px] font-bold disabled:opacity-50 transition">Confirm rejection</button>
            <button onClick={() => setRejecting(false)} className="text-[12px] font-semibold text-gray-500 px-2">Cancel</button>
          </div>
        </div>
      )}
      {marking && (
        <div className="mt-2 flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (e.g. photo taken 12 Jun)"
            className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button disabled={actions.markInPerson.isPending} onClick={() => actions.markInPerson.mutate({ documentId: doc._id, note: note.trim() }, { onSuccess: () => { setMarking(false); setNote(''); } })}
            className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-[12px] font-bold disabled:opacity-50 transition">Confirm</button>
        </div>
      )}
      {linking && (
        <div className="mt-2 flex gap-2">
          <select defaultValue="" onChange={(e) => { if (e.target.value) actions.link.mutate({ documentId: doc._id, sourceDocumentId: e.target.value }, { onSuccess: () => setLinking(false) }); }}
            className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Choose an uploaded document to satisfy this…</option>
            {candidates.map((c) => <option key={c._id} value={c._id}>{c.__applicantName} — {c.label || c.docTypeKey}</option>)}
          </select>
          <button onClick={() => setLinking(false)} className="text-[12px] font-semibold text-gray-500 px-2">Cancel</button>
        </div>
      )}
    </div>
  );
}

function AddDocumentControl({ applicants, add, documentTypes }) {
  const [open, setOpen] = useState(false);
  const [applicantId, setApplicantId] = useState('');
  const [docTypeKey, setDocTypeKey] = useState('');
  const cls = 'w-full sm:w-auto px-3 py-2 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500';
  if (!open) {
    return <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary-700"><Plus size={13} /> Add document</button>;
  }
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 w-full sm:w-auto">
      <select value={applicantId} onChange={(e) => setApplicantId(e.target.value)} className={cls}>
        <option value="">Applicant…</option>
        {applicants.map((a) => <option key={a._id} value={a._id}>{`${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Applicant'}</option>)}
      </select>
      <select value={docTypeKey} onChange={(e) => setDocTypeKey(e.target.value)} className={cls}>
        <option value="">Document…</option>
        {documentTypes.filter((t) => t.isActive).map((t) => <option key={t.key} value={t.key}>{t.label} ({t.source})</option>)}
      </select>
      <div className="flex gap-2">
        <button disabled={!applicantId || !docTypeKey || add.isPending}
          onClick={() => add.mutate({ applicantId, docTypeKey }, { onSuccess: () => { setOpen(false); setApplicantId(''); setDocTypeKey(''); } })}
          className="flex-1 sm:flex-none rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 text-[12px] font-bold disabled:opacity-50 transition">Add</button>
        <button onClick={() => setOpen(false)} className="text-[12px] font-semibold text-gray-500 px-2">Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function ComboSelect({ value, onChange, options = [], placeholder = 'Search…', inputClassName }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    function onOut(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(''); } }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);
  const q = query.trim().toLowerCase();
  const filtered = options.filter((o) => o.toLowerCase().includes(q));
  const showCustom = query.trim() && !options.some((o) => o.toLowerCase() === q);
  const display = open ? query : (value || '');
  const select = (v) => { onChange(v); setOpen(false); setQuery(''); inputRef.current?.blur(); };
  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input ref={inputRef} type="text" placeholder={placeholder} value={display} autoComplete="off"
          onFocus={() => { setQuery(''); setOpen(true); }} onChange={(e) => setQuery(e.target.value)} className={inputClassName} />
        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {showCustom && (
            <button type="button" onClick={() => select(query.trim())} className="w-full text-left px-4 py-2.5 text-sm text-primary-700 font-semibold hover:bg-primary-50">Use &ldquo;{query.trim()}&rdquo;</button>
          )}
          {filtered.length === 0 && !showCustom ? (
            <p className="text-xs text-gray-400 px-4 py-3">No results</p>
          ) : filtered.map((o) => (
            <button key={o} type="button" onClick={() => select(o)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-primary-50 transition-colors ${value === o ? 'text-primary-700 font-semibold bg-primary-50/60' : 'text-gray-700'}`}>
              {o}{value === o && <Check size={13} className="text-primary-600 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantModal({ applicationId, applicant, onClose }) {
  const { mutate, isPending } = useAdminUpdateApplicant(applicationId);
  const [form, setForm] = useState({
    firstName: applicant.firstName || '', lastName: applicant.lastName || '',
    dateOfBirth: applicant.dateOfBirth ? applicant.dateOfBirth.slice(0, 10) : '',
    nationality: applicant.nationality || '', passportNumber: applicant.passportNumber || '',
    passportExpiry: applicant.passportExpiry ? applicant.passportExpiry.slice(0, 10) : '',
    relationshipToPrimary: applicant.relationshipToPrimary || '',
    employmentStatus: applicant.employmentStatus || '', financialSupport: applicant.financialSupport || '',
    minorTravellingWith: applicant.minorTravellingWith || '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500';
  const name = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Applicant';

  const natList = NATIONALITIES;
  const natValue = natList.find((n) => n.nationality === form.nationality) || (form.nationality ? { id: form.nationality, nationality: form.nationality } : null);

  function submit(e) {
    e.preventDefault();
    mutate({ applicantId: applicant._id, patch: { ...form, employmentStatus: form.employmentStatus || null, financialSupport: form.financialSupport || null, minorTravellingWith: form.minorTravellingWith || null } }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">Edit {name}</h3>
            {applicant.isPrimary && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-700 bg-primary-50 rounded-full px-2 py-0.5">Primary</span>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First name"><input type="text" value={form.firstName} onChange={set('firstName')} className={inputCls} /></Field>
          <Field label="Last name"><input type="text" value={form.lastName} onChange={set('lastName')} className={inputCls} /></Field>
          <Field label="Date of birth">
            <DatePicker value={form.dateOfBirth} onChange={setVal('dateOfBirth')} placeholder="Select date" maxDate={todayStr()} inputClassName={inputCls} />
          </Field>
          <Field label="Nationality">
            <NationalitySelect value={natValue} onChange={(nat) => setForm((f) => ({ ...f, nationality: nat?.nationality || '' }))} nationalities={natList} inputClassName={inputCls} />
          </Field>
          <Field label="Passport number"><input type="text" value={form.passportNumber} onChange={set('passportNumber')} className={inputCls} /></Field>
          <Field label="Passport expiry">
            <DatePicker value={form.passportExpiry} onChange={setVal('passportExpiry')} placeholder="Select date" inputClassName={inputCls} />
          </Field>
          <Field label="Relationship to primary">
            <ComboSelect value={form.relationshipToPrimary} onChange={setVal('relationshipToPrimary')} options={RELATIONSHIP_OPTIONS} placeholder="Search relationship…" inputClassName={inputCls} />
          </Field>
          <Field label="Employment"><select value={form.employmentStatus} onChange={set('employmentStatus')} className={inputCls}>{EMPLOYMENT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Funding"><select value={form.financialSupport} onChange={set('financialSupport')} className={inputCls}>{FINANCIAL_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Minor travelling with"><select value={form.minorTravellingWith} onChange={set('minorTravellingWith')} className={inputCls}>{MINOR_WITH_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        </div>
        <p className="text-[11px] text-gray-400">Changing these updates the document checklist. Uploaded, approved or rejected documents are never removed.</p>
        <button type="submit" disabled={isPending} className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-60">
          {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

function DocViewerModal({ viewer, actions, onClose }) {
  const replaceRef = useRef(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const doc = viewer.doc;
  const reviewable = doc && !doc.satisfiedBy;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0">
          <span className="text-sm font-semibold text-gray-800 truncate">{viewer.label}{viewer.version != null ? ` · v${viewer.version}` : ''}</span>
          <div className="flex items-center gap-3 shrink-0">
            <a href={viewer.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary-700"><ExternalLink size={12} /> Open</a>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50 p-3">
          {viewer.mimeType?.startsWith('image/')
            ? <img src={viewer.url} alt={viewer.label} className="max-w-full mx-auto rounded-lg" />
            : <iframe title="document" src={viewer.url} className="w-full h-[70vh] rounded-lg border border-gray-100 bg-white" />}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 shrink-0">
          {rejecting ? (
            <div className="space-y-2">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason for rejection (shown to the customer)"
                className="w-full px-3 py-2 text-[13px] border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
              <div className="flex gap-2">
                <button disabled={actions.review.isPending || !reason.trim()}
                  onClick={() => actions.review.mutate({ documentId: doc._id, decision: 'REJECTED', rejectionReason: reason.trim() }, { onSuccess: onClose })}
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold disabled:opacity-50 transition">Confirm rejection</button>
                <button onClick={() => { setRejecting(false); setReason(''); }} className="text-sm font-semibold text-gray-500 px-2">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {reviewable && doc.status !== 'APPROVED' && (
                <button onClick={() => actions.review.mutate({ documentId: doc._id, decision: 'APPROVED' }, { onSuccess: onClose })} disabled={actions.review.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-bold disabled:opacity-60 transition"><Check size={14} /> Approve</button>
              )}
              <button onClick={() => replaceRef.current?.click()} disabled={actions.upload.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 px-4 py-2 text-sm font-bold hover:bg-primary-100 disabled:opacity-60 transition"><UploadCloud size={14} /> Replace</button>
              <input ref={replaceRef} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file && doc) actions.upload.mutate({ documentId: doc._id, file }, { onSuccess: onClose }); e.target.value = ''; }} />
              {reviewable && doc.status !== 'REJECTED' && (
                <button onClick={() => setRejecting(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-sm font-bold hover:bg-red-100 transition ml-auto"><X size={14} /> Reject</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminApplicationDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { application, isLoading } = useAdminApplication(id);
  const { documentTypes } = useDocumentTypes();
  const actions = {
    review: useReviewDocument(id),
    upload: useAdminUploadDocument(id),
    markInPerson: useAdminMarkInPerson(id),
    link: useAdminLinkSatisfiedBy(id),
    remove: useAdminRemoveDocumentRow(id),
  };
  const addRow = useAdminAddDocumentRow(id);
  const update = useUpdateApplication(id);
  const addNote = useAddNote(id);

  const [viewer, setViewer] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [editingApplicant, setEditingApplicant] = useState(null);

  async function onView(doc, version) {
    try {
      const blob = await adminGetDocumentStreamBlobApi(doc._id, version);
      const objectUrl = URL.createObjectURL(blob);
      setViewer((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return { url: objectUrl, mimeType: blob.type, label: doc.label || doc.docTypeKey, version: version ?? doc.version, doc }; });
    } catch { /* toast upstream */ }
  }
  function closeViewer() { setViewer((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return null; }); }
  useEffect(() => () => { if (viewer?.url) URL.revokeObjectURL(viewer.url); }, [viewer?.url]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={24} className="animate-spin text-gray-300" /></div>;
  }
  if (!application) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center"><FileText size={22} className="text-red-400" /></div>
          <div>
            <p className="text-sm font-bold text-gray-700">Application not found</p>
            <Link href="/admin/visa-applications" className="text-xs text-primary-700 mt-1 inline-block">← Back to applications</Link>
          </div>
        </div>
      </div>
    );
  }

  const customer = application.user ? `${application.user.firstName || ''} ${application.user.lastName || ''}`.trim() || application.user.email : '—';
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500';

  const applicants = application.applicants || [];
  const nameById = new Map(applicants.map((a) => [String(a._id), `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Applicant']));
  const allDocs = applicants.flatMap((a) => (a.documents || []).map((d) => ({ ...d, __applicantName: nameById.get(String(a._id)) })));
  const bySource = { CUSTOMER: [], AGENT: [], IN_PERSON: [] };
  for (const d of allDocs) if (d.status !== 'NOT_APPLICABLE') (bySource[d.source] || (bySource[d.source] = [])).push(d);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{application.destinationCountry} Visa</h2>
            <span className="font-mono text-xs text-gray-500">{application.applicationRef}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5 break-words">{customer}{application.user?.email ? ` · ${application.user.email}` : ''}</p>
        </div>
        <select value={application.status} onChange={(e) => update.mutate({ status: e.target.value })}
          className="w-full sm:w-auto px-3 py-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 shrink-0">
          {APP_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start">
        <div className="space-y-5">
          <Card title="Overview" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow label="Reference" value={application.applicationRef} mono />
              <InfoRow label="Destination" value={application.destinationCountry} />
              <InfoRow label="Visa type" value={application.visaTypeKey || 'SCHENGEN'} />
              <InfoRow label="Accommodation" value={application.accommodationType || 'HOTEL'} />
              <InfoRow label="File completeness" value={`${application.fileCompleteness ?? 0}%`} />
              <InfoRow label="Customer completeness" value={`${application.customerCompleteness ?? 0}%`} />
              <InfoRow label="Applicants" value={String(application.applicantCount ?? '—')} />
              <InfoRow label="Assigned to" value={application.assignedTo?.name || 'Unassigned'} />
            </div>
          </Card>

          {/* Applicants — a grey card per traveller; click to edit their details */}
          <Card title="Applicants" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {applicants.map((a) => {
                const docs = (a.documents || []).filter((d) => d.status !== 'NOT_APPLICABLE');
                const done = docs.filter((d) => (d.satisfiedBy ? d.effectiveStatus === 'APPROVED' : (d.status === 'UPLOADED' || d.status === 'APPROVED'))).length;
                const name = `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Applicant';
                return (
                  <button type="button" key={a._id} onClick={() => setEditingApplicant(a)} className="text-left bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 hover:border-gray-300 transition">
                    <div className="flex items-center gap-2 mb-2.5">
                      <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                      {a.isPrimary && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-700 bg-primary-50 rounded-full px-2 py-0.5 shrink-0">Primary</span>}
                      {a.ageGroup === 'MINOR' && <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 shrink-0">Minor</span>}
                    </div>
                    <dl className="space-y-1 text-[12px]">
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Passport</dt><dd className="text-gray-700 font-medium font-mono truncate">{a.passportNumber || '—'}</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Date of birth</dt><dd className="text-gray-700 font-medium">{fmtDate(a.dateOfBirth)}</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Employment</dt><dd className="text-gray-700 font-medium truncate">{a.employmentStatus || '—'}</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Funding</dt><dd className="text-gray-700 font-medium truncate">{a.financialSupport || '—'}</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Documents</dt><dd className="text-gray-700 font-medium">{done}/{docs.length}</dd></div>
                    </dl>
                    <p className="mt-2.5 text-[11px] font-semibold text-primary-700">Edit details →</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Documents — grouped by source */}
          <Card title="Document file" icon={FileText} action={<AddDocumentControl applicants={applicants} add={addRow} documentTypes={documentTypes} />}>
            <div className="space-y-5">
              {['CUSTOMER', 'AGENT', 'IN_PERSON'].map((source) => {
                const rows = bySource[source] || [];
                const meta = SOURCE_META[source];
                if (!rows.length) return null;
                return (
                  <div key={source}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <meta.icon size={13} className="text-gray-400" />
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{meta.label}</p>
                    </div>
                    <div>{rows.map((doc) => <DocRow key={doc._id} doc={doc} applicantName={doc.__applicantName} actions={actions} allDocs={allDocs} onView={onView} />)}</div>
                  </div>
                );
              })}
              {allDocs.filter((d) => d.status !== 'NOT_APPLICABLE').length === 0 && (
                <p className="text-[12px] text-gray-400 py-2">No documents yet. They appear once the customer answers their profile questions.</p>
              )}
            </div>
          </Card>

        </div>

        <div className="space-y-4 xl:sticky xl:top-6">
          <Card title="Appointment" icon={CalendarCheck} collapsible defaultOpen={false}>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">VFS center</label>
                <input defaultValue={application.vfsCenter || ''} onBlur={(e) => e.target.value !== (application.vfsCenter || '') && update.mutate({ vfsCenter: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Appointment date</label>
                <DatePicker value={application.appointmentDate ? application.appointmentDate.slice(0, 10) : ''} onChange={(v) => update.mutate({ appointmentDate: v })} placeholder="Select date" inputClassName={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Appointment status</label>
                <select value={application.appointmentStatus || 'NOT_BOOKED'} onChange={(e) => update.mutate({ appointmentStatus: e.target.value })} className={inputCls}>
                  {APPT_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
          </Card>

          <Card title="Notes & activity" icon={StickyNote}>
            <div className="flex gap-2 mb-3">
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note…" className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button onClick={() => { if (noteText.trim()) addNote.mutate(noteText.trim(), { onSuccess: () => setNoteText('') }); }} className="px-3 text-[12px] font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition">Add</button>
            </div>
            <ul className="space-y-2 max-h-72 overflow-auto">
              {(application.notes || []).slice().reverse().map((n) => (
                <li key={n._id} className="text-[12px] text-gray-600 border-l-2 border-gray-200 pl-2.5">
                  <span className="block">{n.text}</span>
                  <span className="text-[10px] text-gray-500">{n.createdBy?.name || 'staff'}</span>
                </li>
              ))}
              {(application.activityLog || []).slice().reverse().slice(0, 12).map((l) => (
                <li key={l._id} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <ChevronRight size={11} className="shrink-0 text-gray-300" />
                  {l.action.replace(/_/g, ' ')}{l.toValue ? `: ${l.toValue}` : ''}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {editingApplicant && <ApplicantModal applicationId={id} applicant={editingApplicant} onClose={() => setEditingApplicant(null)} />}

      {viewer && <DocViewerModal viewer={viewer} actions={actions} onClose={closeViewer} />}
    </div>
  );
}
