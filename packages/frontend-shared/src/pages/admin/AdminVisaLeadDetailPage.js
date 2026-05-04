'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, AlertCircle, MessageSquare, Phone, Mail,
  ChevronDown, ChevronUp, Trash2, UserCircle, Send,
} from 'lucide-react';
import { useGetVisaLead }            from '../../hooks/visa-leads/useGetVisaLead.js';
import { useUpdateVisaLeadStatus }   from '../../hooks/visa-leads/useUpdateVisaLeadStatus.js';
import { useAssignVisaLead }         from '../../hooks/visa-leads/useAssignVisaLead.js';
import { useAddVisaLeadNote }        from '../../hooks/visa-leads/useAddVisaLeadNote.js';
import { useDeleteVisaLead }         from '../../hooks/visa-leads/useDeleteVisaLead.js';
import { useGetAdminUsers }          from '../../hooks/admin-users/useGetAdminUsers.js';
import { useAdminAuth }              from '../../contexts/AdminAuthContext.js';

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

const STATUS_CFG = {
  new:       { label: 'New',       cls: 'bg-blue-50   text-blue-700   border-blue-200',   dot: 'bg-blue-500'   },
  contacted: { label: 'Contacted', cls: 'bg-amber-50  text-amber-700  border-amber-200',  dot: 'bg-amber-500'  },
  qualified: { label: 'Qualified', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  converted: { label: 'Converted', cls: 'bg-green-50  text-green-700  border-green-200',  dot: 'bg-green-500'  },
  lost:      { label: 'Lost',      cls: 'bg-gray-100  text-gray-500   border-gray-200',   dot: 'bg-gray-400'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.contacted;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function fmtFull(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: true,
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  { const m = Math.floor(secs / 60);   return `${m}m ago`; }
  if (secs < 86400) { const h = Math.floor(secs / 3600); return `${h}h ago`; }
  return fmtFull(iso);
}

function describeActivity(entry) {
  const who = entry.performedBy?.name || 'System';
  switch (entry.action) {
    case 'created':
      return 'Lead created';
    case 'status_changed':
      return `${who} changed status from ${entry.fromValue || '?'} to ${entry.toValue || '?'}`;
    case 'assigned':
      return entry.toValue === 'unassigned'
        ? `${who} unassigned this lead`
        : `${who} assigned this lead to ${entry.toValue}`;
    case 'note_added':
      return `${who} added a note`;
    default:
      return `${who}: ${entry.action}`;
  }
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="text-sm font-bold text-gray-700">{children}</h3>
    </div>
  );
}

function CardBody({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 ${className}`}>{children}</div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 shrink-0 mt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-800 leading-5 flex-1 min-w-0 break-words">
        {value ?? '—'}
      </span>
    </div>
  );
}

const SOURCE_LABELS = {
  hero_cta:     'Hero CTA',
  package_card: 'Package card',
  final_cta:    'Bottom CTA',
};

export default function AdminVisaLeadDetailPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const { adminUser } = useAdminAuth();

  const { lead, isLoadingLead, isErrorLead } = useGetVisaLead(id);

  const { updateStatus, isUpdatingStatus }   = useUpdateVisaLeadStatus();
  const { assignLead, isAssigning }          = useAssignVisaLead();
  const { addNote, isAddingNote }            = useAddVisaLeadNote();
  const { deleteLead, isDeletingLead }       = useDeleteVisaLead();

  const { users: adminUsers = [] } = useGetAdminUsers({ limit: 100 });
  const userList = Array.isArray(adminUsers) ? adminUsers : [];

  const [noteText,       setNoteText]       = useState('');
  const [optimisticNotes, setOptimisticNotes] = useState([]);
  const [activityOpen,   setActivityOpen]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTechDetails,   setShowTechDetails]   = useState(false);
  const noteRef = useRef(null);

  function handleStatusChange(e) {
    const newStatus = e.target.value;
    if (newStatus === lead.status) return;
    updateStatus({ id, status: newStatus });
  }

  function handleAssign(e) {
    const val = e.target.value;
    assignLead({ id, assignedTo: val || null });
  }

  function handleAssignToMe() {
    if (!adminUser?._id) return;
    assignLead({ id, assignedTo: adminUser._id });
  }

  function handleAddNote(e) {
    e.preventDefault();
    const text = noteText.trim();
    if (!text) return;

    setOptimisticNotes((prev) => [
      ...prev,
      {
        _id: `pending-${Date.now()}`,
        text,
        createdBy: { name: adminUser?.name || 'You' },
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);
    setNoteText('');

    addNote({ id, text }, {
      onSuccess: () => setOptimisticNotes([]),
      onError:   () => setOptimisticNotes([]),
    });
  }

  function handleDelete() {
    deleteLead(id, {
      onSuccess: () => router.push('/admin/visa-leads'),
    });
  }

  if (isLoadingLead) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading lead…</p>
        </div>
      </div>
    );
  }

  if (isErrorLead || !lead) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Lead not found</p>
            <p className="text-xs text-gray-400 mt-1">This lead may have been deleted.</p>
          </div>
          <Link
            href="/admin/visa-leads"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
          >
            <ArrowLeft size={13} /> Back to leads
          </Link>
        </div>
      </div>
    );
  }

  const fullName   = `${lead.firstName} ${lead.lastName}`;
  const waPhone    = (lead.phone || '').replace(/[^0-9]/g, '');
  const allNotes   = [
    ...(lead.notes ?? []).slice().reverse(),
    ...optimisticNotes,
  ];
  const activityLog = [...(lead.activityLog ?? [])].reverse();

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      <div className="flex items-start gap-4">
        <Link
          href="/admin/visa-leads"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-700 transition-colors mt-1 shrink-0"
        >
          <ArrowLeft size={14} /> All leads
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-extrabold text-gray-900 truncate">{fullName}</h2>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {lead.visaCountryName} Visa · submitted {fmtFull(lead.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-5 items-start">

        <div className="space-y-5">

          <Card>
            <CardHeader>Lead details</CardHeader>
            <CardBody>
              <InfoRow label="Name"        value={fullName} />
              <InfoRow label="Nationality" value={lead.nationality} />
              <InfoRow label="Email"       value={lead.email} />
              <InfoRow label="Phone"       value={lead.phone} />
              <InfoRow label="Visa"        value={`${lead.visaCountryName || lead.visaSlug}`} />
              <InfoRow
                label="Package"
                value={
                  lead.packageRequested === 'undecided'
                    ? 'Not decided yet'
                    : lead.packageRequested
                }
              />
              <InfoRow label="Applicants"  value={String(lead.applicantCount ?? 1)} />
              <InfoRow label="Source"      value={SOURCE_LABELS[lead.source] || lead.source} />
              <InfoRow label="Submitted"   value={fmtFull(lead.createdAt)} />

              <div className="mt-3 pt-3 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowTechDetails((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showTechDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Technical details
                </button>
                {showTechDetails && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-gray-400">
                      <span className="font-semibold">IP:</span> {lead.ipAddress || '—'}
                    </p>
                    <p className="text-xs text-gray-400 break-all">
                      <span className="font-semibold">User-Agent:</span> {lead.userAgent || '—'}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      <span className="font-semibold not-font-mono">Lead ID:</span> {lead._id}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Contact</CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-3">

                <a
                  href={`https://wa.me/${waPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors"
                >
                  <MessageSquare size={15} />
                  <span>WhatsApp</span>
                  <span className="text-green-500 text-xs font-normal">{lead.phone}</span>
                </a>

                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Phone size={15} />
                  <span>Call</span>
                  <span className="text-blue-500 text-xs font-normal">{lead.phone}</span>
                </a>

                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  <Mail size={15} />
                  <span>Email</span>
                  <span className="text-gray-500 text-xs font-normal">{lead.email}</span>
                </a>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Notes</CardHeader>
            <CardBody className="space-y-4">

              {allNotes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {allNotes.map((note) => (
                    <div
                      key={note._id}
                      className={`rounded-xl p-4 ${note.pending ? 'bg-gray-50 opacity-60' : 'bg-gray-50'}`}
                    >
                      <p className="text-sm text-gray-800 leading-6 whitespace-pre-wrap">{note.text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <UserCircle size={13} className="text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {note.createdBy?.name || 'Unknown'}
                          {note.createdAt && ` · ${timeAgo(note.createdAt)}`}
                        </span>
                        {note.pending && (
                          <span className="text-xs text-gray-300 ml-auto">Saving…</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddNote} className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <textarea
                  ref={noteRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note…"
                  rows={3}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-gray-300 w-full"
                />
                <button
                  type="submit"
                  disabled={!noteText.trim() || isAddingNote}
                  className="self-end flex items-center gap-1.5 px-4 py-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {isAddingNote ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Add note
                </button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <button
              type="button"
              onClick={() => setActivityOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50/60 transition-colors"
            >
              <span>Activity log ({activityLog.length})</span>
              {activityOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
            </button>

            {activityOpen && (
              <div className="px-5 pb-4 space-y-3 border-t border-gray-100 pt-4">
                {activityLog.length === 0 ? (
                  <p className="text-sm text-gray-400">No activity yet.</p>
                ) : (
                  activityLog.map((entry) => (
                    <div key={entry._id} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0 mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-5">
                          {describeActivity(entry)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmtFull(entry.performedAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

        </div>

        <div className="space-y-4">

          <Card>
            <CardHeader>Status</CardHeader>
            <CardBody>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={lead.status} />
              </div>
              <select
                value={lead.status}
                onChange={handleStatusChange}
                disabled={isUpdatingStatus}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-full disabled:opacity-50"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>
                ))}
              </select>
              {isUpdatingStatus && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" /> Updating…
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Assigned to</CardHeader>
            <CardBody>

              {adminUser?._id && lead.assignedTo?._id !== adminUser._id && (
                <button
                  type="button"
                  onClick={handleAssignToMe}
                  disabled={isAssigning}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-primary-700 border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors disabled:opacity-50 mb-3"
                >
                  <UserCircle size={13} />
                  Assign to me
                </button>
              )}
              <select
                value={lead.assignedTo?._id || ''}
                onChange={handleAssign}
                disabled={isAssigning}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-full disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {userList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
              {isAssigning && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" /> Saving…
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Danger zone</CardHeader>
            <CardBody>
              {showDeleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">
                    This will permanently delete this lead and all its notes. This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeletingLead}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isDeletingLead ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <Trash2 size={13} />
                  Delete lead
                </button>
              )}
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
}
