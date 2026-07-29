'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, FileText } from 'lucide-react';
import Container from '../../../components/shared/layout/Container.js';
import { useAuth } from '../../../contexts/AuthContextBase.js';
import { useMyApplications } from '../../../hooks/visa-applications/useMyApplications.js';

const STATUS_LABELS = {
  DRAFT: 'Draft', INFO_PENDING: 'Details needed', INFO_COMPLETE: 'Details complete',
  DOCS_READY: 'Under review', APPOINTMENT_BOOKED: 'Appointment booked', SUBMITTED: 'Submitted',
  DELIVERED: 'Delivered', APPROVED: 'Approved', REJECTED: 'Rejected', CANCELLED: 'Cancelled',
};

function CompletenessBar({ value }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-gray-400">Completeness</span>
        <span className="text-[11px] font-semibold text-gray-600">{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ApplyDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const { applications, isLoading } = useMyApplications();

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) router.replace('/apply/login');
  }, [isLoadingAuth, isAuthenticated, router]);

  if (isLoadingAuth || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        <Loader2 size={26} className="animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-14 bg-gray-50 min-h-[70vh]">
      <Container className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your visa applications</h1>
          <p className="text-sm text-gray-500 mt-1">Signed in as {user?.email}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-400"><Loader2 size={22} className="animate-spin" /></div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <FileText className="mx-auto text-gray-300 mb-3" size={30} />
            <p className="text-sm text-gray-500">You don't have any applications yet. Our team will create one for you and email you a link.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Link
                key={app._id}
                href={`/apply/${app.applicationRef}`}
                className="group block bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-[15px] font-bold text-gray-900">{app.destinationCountry} Visa</h2>
                      <span className="text-[11px] font-mono text-gray-400">{app.applicationRef}</span>
                    </div>
                    <p className="text-[12px] text-gray-500">
                      {app.applicantCount} applicant{app.applicantCount > 1 ? 's' : ''}
                      {app.packageName ? ` · ${app.packageName}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-600 transition-colors" />
                  </div>
                </div>
                <div className="mt-4 max-w-xs"><CompletenessBar value={app.completeness ?? 0} /></div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
