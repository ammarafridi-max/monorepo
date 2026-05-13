'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Mail, Send, SkipForward, Inbox } from 'lucide-react';
import PageLoader from '../../components/ui/v1/PageLoader.js';
import { useAdminAuth } from '../../contexts/AdminAuthContext.js';
import { useEmailSupport } from '../../hooks/email-support/useEmailSupport.js';
import { useSendEmailReply } from '../../hooks/email-support/useSendEmailReply.js';
import { useSkipEmail } from '../../hooks/email-support/useSkipEmail.js';
import { useUpdateEmailDraft } from '../../hooks/email-support/useUpdateEmailDraft.js';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'skipped', label: 'Skipped' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
}

function StatusBadge({ status }) {
  if (status === 'pending') {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        Pending
      </span>
    );
  }
  if (status === 'sent') {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Sent
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      Skipped
    </span>
  );
}

export default function AdminEmailsPage() {
  const { adminUser, isLoadingAdminAuth } = useAdminAuth();
  const isAllowed = adminUser?.role === 'admin' || adminUser?.role === 'agent';

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [draftText, setDraftText] = useState('');

  const { emails, pagination, isLoadingEmails } = useEmailSupport({
    status: statusFilter || undefined,
    page,
    limit: 20,
  });

  const { sendReply, isSendingReply } = useSendEmailReply();
  const { skipEmail, isSkippingEmail } = useSkipEmail();
  const { updateDraft } = useUpdateEmailDraft();

  const debounceRef = useRef(null);

  useEffect(() => {
    if (selectedEmail) {
      setDraftText(selectedEmail.draft || '');
    } else {
      setDraftText('');
    }
  }, [selectedEmail?._id]);

  useEffect(() => {
    if (selectedEmail) {
      const refreshed = emails.find((e) => e._id === selectedEmail._id);
      if (refreshed) {
        setSelectedEmail(refreshed);
      }
    }
  }, [emails]);

  const handleDraftChange = useCallback(
    (value) => {
      setDraftText(value);
      if (!selectedEmail) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateDraft({ id: selectedEmail._id, draft: value });
      }, 800);
    },
    [selectedEmail, updateDraft],
  );

  const handleSend = () => {
    if (!selectedEmail) return;
    sendReply(selectedEmail._id, {
      onSuccess: () => setSelectedEmail(null),
    });
  };

  const handleSkip = () => {
    if (!selectedEmail) return;
    skipEmail(selectedEmail._id, {
      onSuccess: () => setSelectedEmail(null),
    });
  };

  if (isLoadingAdminAuth || !adminUser) return <PageLoader />;
  if (!isAllowed) return null;

  return (
    <>
      <h2 className="text-2xl font-extrabold text-gray-900">Email Support</h2>

      <div className="mt-5 flex items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
              setSelectedEmail(null);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-4" style={{ minHeight: '600px' }}>

        <div className="w-1/3 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {isLoadingEmails ? (
            <div className="flex flex-1 items-center justify-center py-16 text-gray-400">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-gray-400">
              <Inbox size={28} />
              <p className="text-sm">No emails found</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {emails.map((email) => (
                <button
                  key={email._id}
                  type="button"
                  onClick={() => setSelectedEmail(email)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${
                    selectedEmail?._id === email._id ? 'bg-primary-50 border-l-2 border-primary-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {email.fromName || email.fromEmail || 'Unknown'}
                    </span>
                    <StatusBadge status={email.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-600 truncate">
                    {email.subject || '(no subject)'}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {formatDate(email.receivedAt)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
              <span>
                {pagination.page}/{pagination.totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40 hover:bg-gray-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {!selectedEmail ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400">
              <Mail size={32} />
              <p className="text-sm">No email selected</p>
              <p className="text-xs text-gray-300">Select an email from the list to view it</p>
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">

              <div className="border-b border-gray-100 px-6 py-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-base font-bold text-gray-900 leading-tight">
                    {selectedEmail.subject || '(no subject)'}
                  </h2>
                  <StatusBadge status={selectedEmail.status} />
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                  <p>
                    <span className="font-medium text-gray-700">From:</span>{' '}
                    {selectedEmail.fromName
                      ? `${selectedEmail.fromName} <${selectedEmail.fromEmail}>`
                      : selectedEmail.fromEmail || selectedEmail.from || '—'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Received:</span>{' '}
                    {formatDate(selectedEmail.receivedAt)}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Customer Message
                  </label>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed min-h-[100px]">
                    {selectedEmail.bodyText || '(empty)'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Draft Reply {selectedEmail.status === 'sent' ? '(sent)' : '(editable)'}
                  </label>
                  <textarea
                    value={draftText}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    disabled={selectedEmail.status === 'sent' || selectedEmail.status === 'skipped'}
                    rows={10}
                    placeholder="AI-generated draft will appear here..."
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {selectedEmail.status === 'pending' && (
                <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSendingReply || isSkippingEmail || !draftText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingReply ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Send Reply
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isSendingReply || isSkippingEmail}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSkippingEmail ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <SkipForward size={14} />
                    )}
                    Skip
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
