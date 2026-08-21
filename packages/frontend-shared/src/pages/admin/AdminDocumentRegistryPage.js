'use client';

import { useEffect, useState } from 'react';
import { Loader2, X, FileText, ListChecks } from 'lucide-react';
import {
  useDocumentTypes, useCreateDocumentType, useUpdateDocumentType,
  useTemplates, useUpsertTemplate, usePreviewTemplate,
} from '../../hooks/visa-applications/useRegistry.js';
import AdminFab from '../../components/admin/AdminFab';

const SOURCE_BADGE = {
  CUSTOMER: 'bg-primary-50 text-primary-700', AGENT: 'bg-indigo-50 text-indigo-600', IN_PERSON: 'bg-amber-50 text-amber-700',
};
const SUBMITTER = { CUSTOMER: 'Customer', AGENT: 'Team', IN_PERSON: 'In person' };

const SOURCES = ['CUSTOMER', 'AGENT', 'IN_PERSON'];
const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500';

function DocumentTypeModal({ initial, onClose }) {
  const create = useCreateDocumentType();
  const update = useUpdateDocumentType();
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState({
    key: initial?.key || '', label: initial?.label || '', customerHelpText: initial?.customerHelpText || '',
    source: initial?.source || 'CUSTOMER', isActive: initial?.isActive !== false, sortOrder: initial?.sortOrder ?? 0,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const busy = create.isPending || update.isPending;

  function submit(e) {
    e.preventDefault();
    if (editing) update.mutate({ id: initial._id, patch: { label: form.label, customerHelpText: form.customerHelpText, source: form.source, isActive: !!form.isActive, sortOrder: Number(form.sortOrder) || 0 } }, { onSuccess: onClose });
    else create.mutate({ ...form, sortOrder: Number(form.sortOrder) || 0 }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{editing ? `Edit ${initial.key}` : 'New document type'}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Key {editing && '(stable, not editable)'}</label>
          <input value={form.key} onChange={set('key')} disabled={editing} placeholder="EMPLOYMENT_NOC" className={`${inputCls} font-mono uppercase disabled:bg-gray-50`} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Label</label>
          <input value={form.label} onChange={set('label')} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer help text</label>
          <textarea value={form.customerHelpText} onChange={set('customerHelpText')} rows={2} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Source</label>
            <select value={form.source} onChange={set('source')} className={inputCls}>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sort order</label>
            <input type="number" value={form.sortOrder} onChange={set('sortOrder')} className={inputCls} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active
        </label>
        <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-60">
          {busy ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
        </button>
      </form>
    </div>
  );
}

function DocumentTypesTab() {
  const { documentTypes, isLoading } = useDocumentTypes();
  const [editing, setEditing] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-400">
          {isLoading ? 'Loading…' : `${documentTypes.length} document type${documentTypes.length !== 1 ? 's' : ''}`}
        </p>
        <AdminFab onClick={() => setEditing('new')} label="New document type" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
        ) : documentTypes.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No document types yet. Run the seed script or add one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Key', 'Document', 'To Be Submitted By', 'Help text', 'Status', ''].map((h, i) => (
                    <th key={i} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documentTypes.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-gray-700 whitespace-nowrap">{t.key}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{t.label}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center text-[11px] font-semibold rounded-full px-2 py-0.5 ${SOURCE_BADGE[t.source] || 'bg-gray-100 text-gray-500'}`}>{SUBMITTER[t.source] || t.source}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-400 hidden md:table-cell max-w-xs truncate">{t.customerHelpText || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.isActive ? <span className="text-[11px] font-semibold text-green-700">Active</span> : <span className="text-[11px] font-semibold text-gray-400">Inactive</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditing(t)} className="text-[12px] font-semibold text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && <DocumentTypeModal initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function conditionSummary(when = {}) {
  const parts = [];
  for (const [k, v] of Object.entries(when)) {
    if (v == null) continue;
    if (Array.isArray(v)) { if (v.length) parts.push(`${k} ∈ [${v.join(', ')}]`); }
    else parts.push(`${k} = ${v}`);
  }
  return parts.length ? parts.join(' AND ') : 'everyone';
}

function PreviewPanel({ preview }) {
  if (!preview) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview — what each sample applicant gets</p>
      {preview.warnings?.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[12px] font-bold text-amber-800 mb-1">{preview.warnings.length} problem(s) — fix before saving:</p>
          <ul className="list-disc pl-5 space-y-0.5">{preview.warnings.map((w, i) => <li key={i} className="text-[12px] text-amber-800">{w}</li>)}</ul>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(preview.samples || []).map((s) => (
          <div key={s.label}>
            <p className="text-[12px] font-bold text-gray-700 mb-1.5">{s.label}</p>
            <ul className="space-y-1">
              {s.documents.map((d) => (
                <li key={d.key} className="flex items-center gap-2 text-[12px]">
                  <span className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 ${d.unresolved ? 'bg-red-50 text-red-600' : (SOURCE_BADGE[d.source] || 'bg-gray-100 text-gray-500')}`}>{d.unresolved ? 'missing' : d.source}</span>
                  <span className="text-gray-700">{d.label}</span>
                  {d.isOptional && <span className="text-[10px] text-gray-400">optional</span>}
                </li>
              ))}
              {s.documents.length === 0 && <li className="text-[12px] text-gray-400">No documents.</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesTab() {
  const { templates, isLoading } = useTemplates();
  const upsert = useUpsertTemplate();
  const previewMut = usePreviewTemplate();
  const schengen = templates.find((t) => t.visaTypeKey === 'SCHENGEN');
  const [json, setJson] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(null);

  const runPreview = (rulesText) => {
    let rules;
    try { rules = JSON.parse(rulesText); } catch { return; }
    if (!Array.isArray(rules)) return;
    previewMut.mutate(rules, { onSuccess: (data) => setPreview(data) });
  };

  useEffect(() => {
    if (schengen) { const text = JSON.stringify(schengen.rules || [], null, 2); setJson(text); runPreview(text); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schengen]);

  function save() {
    setErr('');
    let rules;
    try { rules = JSON.parse(json); } catch (e) { setErr(`Invalid JSON: ${e.message}`); return; }
    if (!Array.isArray(rules)) { setErr('Rules must be an array.'); return; }
    upsert.mutate({ visaTypeKey: 'SCHENGEN', name: schengen?.name || 'Schengen visa', isActive: true, rules });
  }

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-300" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Document', 'Applies when'].map((h, i) => (
                  <th key={i} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(schengen?.rules || []).map((r, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-gray-700 whitespace-nowrap">{r.documentTypeKey}{r.isOptional && <span className="ml-2 text-[10px] font-semibold text-gray-400">optional</span>}</td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500">{conditionSummary(r.when)}</td>
                </tr>
              ))}
              {(!schengen || !schengen.rules?.length) && <tr><td className="px-4 py-4 text-[12px] text-gray-400" colSpan={2}>No rules. Run the seed script or paste rules below.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Edit rules (JSON)</p>
        <p className="text-[11px] text-gray-400 mb-2">Each rule: {'{'} documentTypeKey, when: {'{'} ageGroup, employmentStatus, financialSupport, accommodationType, minorTravellingWith, isPrimary {'}'}, isOptional {'}'}. An absent condition matches anything.</p>
        <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={16} spellCheck={false}
          className="w-full px-3 py-2 text-[12px] font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
        {err && <p className="text-[12px] text-red-600 mt-2">{err}</p>}
        {upsert.isError && <p className="text-[12px] text-red-600 mt-2">{upsert.error?.message}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => runPreview(json)} disabled={previewMut.isPending} className="inline-flex items-center gap-2 py-2.5 px-4 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:border-primary-300 hover:text-primary-700 transition disabled:opacity-60">
            {previewMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Refresh preview'}
          </button>
          <button onClick={save} disabled={upsert.isPending} className="inline-flex items-center gap-2 py-2.5 px-5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-60">
            {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save Schengen template'}
          </button>
        </div>
      </div>

      <PreviewPanel preview={preview} />
    </div>
  );
}

export default function AdminDocumentRegistryPage() {
  const [tab, setTab] = useState('types');
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Document Registry</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage document types and the checklist rules. Changes take effect on the next reconcile.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {[['types', 'Document types', FileText], ['templates', 'Checklist rules', ListChecks]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${tab === key ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>
      {tab === 'types' ? <DocumentTypesTab /> : <TemplatesTab />}
    </div>
  );
}
