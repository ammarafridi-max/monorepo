'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ChevronDown, Upload, Eye, CheckCircle2, AlertCircle, Clock, ArrowLeft, Home } from 'lucide-react';
import Container from '../../components/shared/layout/Container.js';
import DatePicker from '../../components/form-elements/v1/DatePicker.js';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
import { useAuth } from '../../contexts/AuthContextBase.js';
import { useApplication } from '../../hooks/visa-applications/useApplication.js';
import { useUploadDocument, useUpdateApplicant, useUpdateApplicationProfile } from '../../hooks/visa-applications/useVisaAppMutations.js';
import { getDocumentViewUrlApi } from '../../services/apiVisaApplications.js';

const EMPLOYMENT_CHOICES = [
  ['EMPLOYED', 'Employed'],
  ['SELF_EMPLOYED', 'Self-employed'],
  ['BUSINESS_OWNER', 'Business owner'],
  ['STUDENT', 'Student'],
  ['RETIRED', 'Retired'],
  ['UNEMPLOYED', 'Not working'],
];
const FINANCIAL_CHOICES = [['SELF', 'I fund my own trip'], ['SPONSORED', 'Someone sponsors me']];
const MINOR_WITH_CHOICES = [['BOTH_PARENTS', 'Both parents'], ['ONE_PARENT', 'One parent'], ['NEITHER', 'Neither parent']];

const STATUS_STYLES = {
  REQUIRED: { cls: 'bg-gray-100 text-gray-500', label: 'To upload', Icon: Clock },
  UPLOADED: { cls: 'bg-blue-50 text-blue-700', label: 'Under review', Icon: Clock },
  APPROVED: { cls: 'bg-green-50 text-green-700', label: 'Approved', Icon: CheckCircle2 },
  REJECTED: { cls: 'bg-red-50 text-red-700', label: 'Needs fixing', Icon: AlertCircle },
  PROVIDED: { cls: 'bg-green-50 text-green-700', label: 'Provided', Icon: CheckCircle2 },
};

function deriveAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

async function openDocument(documentId) {
  try {
    const { url } = await getDocumentViewUrlApi(documentId);
    if (url) window.open(url, '_blank', 'noopener');
  } catch { /* toast handled elsewhere */ }
}

function DocRow({ doc, applicantId, applicationRef }) {
  const inputRef = useRef(null);
  const { mutate, isPending } = useUploadDocument(applicationRef);
  const satisfied = Boolean(doc.satisfiedBy);
  const statusKey = satisfied ? 'PROVIDED' : (doc.effectiveStatus || doc.status);
  const s = STATUS_STYLES[statusKey] || STATUS_STYLES.REQUIRED;
  const accept = (doc.acceptedMimeTypes || ['application/pdf', 'image/jpeg', 'image/png']).join(',');

  return (
    <div className="flex flex-col gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-medium text-gray-800">{doc.label || doc.docTypeKey}</span>
            {doc.isOptional && <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">Optional</span>}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>
              <s.Icon size={11} /> {s.label}
            </span>
          </div>
          {doc.customerHelpText && !satisfied && <p className="text-[12px] text-gray-400 mt-1">{doc.customerHelpText}</p>}
          {satisfied && (
            <p className="text-[12px] text-gray-500 mt-1">
              Covered by <strong>{doc.satisfiedByInfo?.applicantName}</strong>&apos;s document. Nothing to do here.
            </p>
          )}
        </div>
        {!satisfied && (
          <div className="flex items-center gap-2 shrink-0">
            {doc.cloudinaryPublicId && (
              <button type="button" onClick={() => openDocument(doc._id)} className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-800">
                <Eye size={13} /> View
              </button>
            )}
            <button type="button" onClick={() => inputRef.current?.click()} disabled={isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 px-2.5 py-1 text-[12px] font-semibold hover:bg-primary-100 disabled:opacity-60">
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {doc.status === 'REQUIRED' ? 'Upload' : 'Replace'}
            </button>
            <input ref={inputRef} type="file" accept={accept} className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) mutate({ applicantId, documentId: doc._id, file }); e.target.value = ''; }} />
          </div>
        )}
      </div>
      {!satisfied && doc.status === 'REJECTED' && doc.rejectionReason && (
        <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2"><strong>Needs fixing:</strong> {doc.rejectionReason}</p>
      )}
    </div>
  );
}

function ProfileQuestions({ applicant, applicationRef }) {
  const { mutate: save, isPending } = useUpdateApplicant(applicationRef);
  const needed = new Set(applicant.neededProfileFields || []);
  const [form, setForm] = useState({
    dateOfBirth: applicant.dateOfBirth ? applicant.dateOfBirth.slice(0, 10) : '',
    employmentStatus: applicant.employmentStatus || '',
    financialSupport: applicant.financialSupport || '',
    minorTravellingWith: applicant.minorTravellingWith || '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const age = deriveAge(form.dateOfBirth);
  const isMinor = age != null && age < 18;
  const inputCls = 'w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500';

  const showEmployment = needed.has('employmentStatus') && (age == null || !isMinor);
  const showMinorWith = needed.has('minorTravellingWith') && (age == null || isMinor);

  function submit() {
    const patch = {};
    if (needed.has('dateOfBirth')) patch.dateOfBirth = form.dateOfBirth || undefined;
    if (showEmployment) patch.employmentStatus = form.employmentStatus || null;
    if (needed.has('financialSupport')) patch.financialSupport = form.financialSupport || null;
    if (showMinorWith) patch.minorTravellingWith = form.minorTravellingWith || null;
    save({ applicantId: applicant._id, patch });
  }

  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-4 space-y-3">
      <p className="text-[13.5px] font-bold text-gray-900">A few quick questions</p>
      <p className="text-[12px] text-gray-500 -mt-1">We use these to show you the exact documents you need — nothing more.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {needed.has('dateOfBirth') && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Date of birth</label>
            <DatePicker value={form.dateOfBirth} onChange={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))} placeholder="Select date" maxDate={todayStr()} inputClassName={inputCls} />
          </div>
        )}
        {showEmployment && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Work situation</label>
            <select value={form.employmentStatus} onChange={set('employmentStatus')} className={inputCls}>
              <option value="">Select…</option>
              {EMPLOYMENT_CHOICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
        {needed.has('financialSupport') && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Who pays for the trip?</label>
            <select value={form.financialSupport} onChange={set('financialSupport')} className={inputCls}>
              <option value="">Select…</option>
              {FINANCIAL_CHOICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
        {showMinorWith && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Who is the child travelling with?</label>
            <select value={form.minorTravellingWith} onChange={set('minorTravellingWith')} className={inputCls}>
              <option value="">Select…</option>
              {MINOR_WITH_CHOICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
      </div>
      <button type="button" onClick={submit} disabled={isPending}
        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
        {isPending && <Loader2 size={12} className="animate-spin" />} Save &amp; continue
      </button>
    </div>
  );
}

function ApplicantPanel({ applicant, applicationRef, open, onToggle }) {
  const docs = (applicant.documents || []).filter((d) => d.source === 'CUSTOMER' && d.status !== 'NOT_APPLICABLE');
  const done = docs.filter((d) => (d.satisfiedBy ? d.effectiveStatus === 'APPROVED' : (d.status === 'UPLOADED' || d.status === 'APPROVED'))).length;
  const needsProfile = (applicant.neededProfileFields || []).length > 0;
  const name = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Applicant';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div>
          <p className="text-[14px] font-bold text-gray-900">
            {name}
            {applicant.isPrimary && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-primary-600">Primary</span>}
          </p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {needsProfile ? 'Answer a few questions to begin' : `${done}/${docs.length} documents provided`}
          </p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5">
          {needsProfile ? (
            <ProfileQuestions applicant={applicant} applicationRef={applicationRef} />
          ) : (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Your documents</p>
              {docs.length === 0
                ? <p className="text-[12px] text-gray-400 py-2">No documents to upload for this traveller.</p>
                : <div>{docs.map((doc) => <DocRow key={doc._id} doc={doc} applicantId={applicant._id} applicationRef={applicationRef} />)}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccommodationCard({ application }) {
  const { mutate, isPending } = useUpdateApplicationProfile(application.applicationRef);
  const value = application.accommodationType || 'HOTEL';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Home size={15} className="text-primary-600" />
        <p className="text-[13.5px] font-bold text-gray-900">Where will you stay?</p>
      </div>
      <p className="text-[12px] text-gray-500 mb-3">Choose one — it changes which documents we ask for.</p>
      <div className="flex gap-2">
        {[['HOTEL', 'A hotel'], ['HOST', 'With a host / friend']].map(([v, l]) => (
          <button key={v} type="button" disabled={isPending} onClick={() => v !== value && mutate({ accommodationType: v })}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition disabled:opacity-60
              ${v === value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ApplyDetailPage() {
  const params = useParams();
  const applicationRef = params?.applicationRef;
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { application, isLoading, isError } = useApplication(applicationRef);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) router.replace('/apply/login');
  }, [isLoadingAuth, isAuthenticated, router]);

  useEffect(() => {
    if (application?.applicants?.length && openId === null) setOpenId(application.applicants[0]._id);
  }, [application, openId]);

  if (isLoadingAuth || !isAuthenticated || isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-400"><Loader2 size={26} className="animate-spin" /></div>;
  }
  if (isError || !application) {
    return (
      <Container className="max-w-2xl py-20 text-center">
        <p className="text-sm text-gray-500">Application not found.</p>
        <Link href="/apply" className="mt-4 inline-block text-sm font-medium text-primary-700">← Back to my applications</Link>
      </Container>
    );
  }

  const completeness = application.customerCompleteness ?? 0;

  return (
    <section className="py-12 bg-gray-50 min-h-[70vh]">
      <Container className="max-w-3xl">
        <Link href="/apply" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={14} /> My applications
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{application.destinationCountry} Visa</h1>
            <span className="text-[12px] font-mono text-gray-400">{application.applicationRef}</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-primary-500" style={{ width: `${completeness}%` }} />
            </div>
            <span className="text-[12px] font-semibold text-gray-600">{completeness}%</span>
          </div>
          <p className="mt-2 text-[12px] text-gray-400">Our team prepares your application forms separately. You only handle your own documents here.</p>
        </div>

        {application.accommodationQuestionNeeded && <AccommodationCard application={application} />}

        <div className="space-y-3">
          {application.applicants.map((a) => (
            <ApplicantPanel
              key={a._id}
              applicant={a}
              applicationRef={application.applicationRef}
              open={openId === a._id}
              onToggle={() => setOpenId((id) => (id === a._id ? null : a._id))}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
