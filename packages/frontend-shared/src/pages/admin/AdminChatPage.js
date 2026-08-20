'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Loader2, Search, Clock, AlertTriangle, Send, Paperclip, Zap, Trash2, Plus, X, FileText, Download, UserCheck, ArrowLeft, ChevronDown, Copy, Reply } from 'lucide-react';
import { useConversations } from '../../hooks/conversations/useConversations';
import { useConversationThread } from '../../hooks/conversations/useConversationThread';
import { useMarkConversationRead } from '../../hooks/conversations/useMarkConversationRead';
import { useSendConversationMessage } from '../../hooks/conversations/useSendConversationMessage';
import { useSendConversationMedia } from '../../hooks/conversations/useSendConversationMedia';
import { useSavedReplies } from '../../hooks/conversations/useSavedReplies';
import { useMessageMedia } from '../../hooks/conversations/useMessageMedia';
import { playChatPing } from '../../utils/chatPing';
import { useAssignableAgents, useConversationAssignment } from '../../hooks/conversations/useConversationAssignment';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
];

function fmtTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function fmtFullTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function windowRemaining(lastInboundAt) {
  if (!lastInboundAt) return null;
  const msLeft = new Date(lastInboundAt).getTime() + 24 * 60 * 60 * 1000 - Date.now();
  if (msLeft <= 0) return null;
  const hours = Math.floor(msLeft / 3_600_000);
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

function WindowBadge({ lastInboundAt }) {
  const remaining = windowRemaining(lastInboundAt);
  if (!remaining) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
        <AlertTriangle size={11} />
        Window closed — template only
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
      <Clock size={11} />
      {remaining}
    </span>
  );
}

function ImageAttachment({ message }) {
  const { url, isLoadingMedia, isErrorMedia, mediaError } = useMessageMedia(message._id);

  if (isLoadingMedia) {
    return (
      <div className="h-40 w-56 rounded-xl bg-gray-100 flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-gray-300" />
      </div>
    );
  }
  if (isErrorMedia) {
    return <p className="text-xs text-amber-700">{mediaError?.message || 'Could not load this image'}</p>;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img src={url} alt={message.media?.filename || 'attachment'} className="max-h-64 rounded-xl" />
    </a>
  );
}

function FileAttachment({ message }) {
  const [wanted, setWanted] = useState(false);
  const { url, isLoadingMedia, isErrorMedia, mediaError } = useMessageMedia(message._id, { enabled: wanted });

  const name = message.media?.filename || message.type;

  if (isErrorMedia) {
    return <p className="text-xs text-amber-700">{mediaError?.message || 'Could not load this file'}</p>;
  }

  if (url) {
    return (
      <a
        href={url}
        download={name}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
      >
        <Download size={13} />
        Save {name}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setWanted(true)}
      disabled={isLoadingMedia}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-primary-700 transition-colors"
    >
      {isLoadingMedia ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
      {name}
    </button>
  );
}

function MessageMenu({ message, onReply }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const copy = async () => {
    const text = message.text || message.media?.filename || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="absolute -top-1 right-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`p-0.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        aria-label="Message options"
      >
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-6 z-20 w-32 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => { onReply(message); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Reply size={13} /> Reply
          </button>
          <button
            type="button"
            onClick={copy}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Copy size={13} /> Copy
          </button>
        </div>
      )}
    </div>
  );
}

function QuotedPreview({ message, compact = false }) {
  if (!message) return null;
  return (
    <div className={`border-l-2 border-primary-300 pl-2 ${compact ? '' : 'mb-1.5'}`}>
      <p className="text-[10px] font-semibold text-primary-700">
        {message.direction === 'INBOUND' ? 'Customer' : 'You'}
      </p>
      <p className="text-[11px] text-gray-500 truncate">
        {message.text || message.media?.filename || `[${message.type}]`}
      </p>
    </div>
  );
}

function MessageBubble({ message, quoted, onReply }) {
  const inbound = message.direction === 'INBOUND';
  return (
    <div className={`group relative flex ${inbound ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`relative max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
          inbound ? 'bg-white border border-gray-200 text-gray-700' : 'bg-primary-50 border border-primary-100 text-gray-800'
        }`}
      >
        <MessageMenu message={message} onReply={onReply} />
        {quoted && <QuotedPreview message={quoted} />}
        {message.type !== 'text' && (
          <div className="mb-1">
            {message.media?.mimeType?.startsWith('image/') ? (
              <ImageAttachment message={message} />
            ) : (
              <FileAttachment message={message} />
            )}
          </div>
        )}
        {message.text ? (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        ) : message.type === 'text' ? (
          <p className="italic text-gray-400">[empty]</p>
        ) : null}
        <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-gray-400">
          <span>{fmtFullTime(message.sentAt)}</span>
          {!inbound && <span className="uppercase">{message.status}</span>}
        </div>
      </div>
    </div>
  );
}

function ChatContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeWaId = searchParams.get('waId') ?? '';
  const urlStatus = searchParams.get('status') ?? '';

  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');

  const { conversations = [], isLoadingConversations } = useConversations({ status: urlStatus });
  const { conversation, messages = [], isLoadingThread } = useConversationThread(activeWaId);
  const { markConversationRead } = useMarkConversationRead();
  const { sendMessage, isSending } = useSendConversationMessage();
  const { sendMedia, isSendingMedia } = useSendConversationMedia();
  const { savedReplies, createSavedReply, isCreatingSavedReply, deleteSavedReply } = useSavedReplies();
  const { agents } = useAssignableAgents();
  const { claimConversation, assignConversation, isAssigning } = useConversationAssignment();
  const { adminUser } = useAdminAuth();

  const assignee = conversation?.assignedTo;
  const myId = adminUser?._id ?? adminUser?.id;
  const isMine = !assignee || String(assignee._id ?? assignee) === String(myId);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [newReply, setNewReply] = useState({ title: '', body: '' });

  useEffect(() => {
    if (activeWaId && conversation?.unreadCount > 0) markConversationRead(activeWaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWaId, conversation?.unreadCount]);

  // Opening an unclaimed chat takes ownership, so two agents cannot answer at once.
  useEffect(() => {
    if (activeWaId && conversation && !conversation.assignedTo) claimConversation(activeWaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWaId, conversation?.assignedTo]);

  useEffect(() => {
    setDraft('');
    setRepliesOpen(false);
    setPendingFile(null);
    setReplyTo(null);
  }, [activeWaId]);

  // Ring only for messages that landed after this page opened, never on the first load.
  const lastSeenInboundRef = useRef(null);
  useEffect(() => {
    if (!conversations.length) return;
    const newest = conversations.reduce((max, c) => {
      const at = c.lastInboundAt ? new Date(c.lastInboundAt).getTime() : 0;
      return at > max ? at : max;
    }, 0);
    if (lastSeenInboundRef.current === null) {
      lastSeenInboundRef.current = newest;
      return;
    }
    if (newest > lastSeenInboundRef.current) {
      lastSeenInboundRef.current = newest;
      playChatPing();
    }
  }, [conversations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      (c) =>
        c.profileName?.toLowerCase().includes(term) ||
        c.waId?.includes(term.replace(/\D/g, '')),
    );
  }, [conversations, search]);

  function setParam(key, value) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div
          className={`bg-white border border-gray-200 rounded-2xl overflow-hidden flex-col h-[calc(100dvh-88px-env(safe-area-inset-bottom))] lg:h-[calc(100vh-104px)] lg:flex ${
            activeWaId ? 'hidden' : 'flex'
          }`}
        >
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or number"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
              />
            </div>
            <div className="flex items-center gap-1">
              {STATUS_TABS.map(({ value, label }) => (
                <button
                  key={value || 'all'}
                  onClick={() => setParam('status', value)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                    urlStatus === value
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto divide-y divide-gray-100">
            {isLoadingConversations ? (
              <div className="py-12 flex justify-center">
                <Loader2 size={22} className="animate-spin text-gray-300" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <MessageSquare size={22} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No conversations yet</p>
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.waId}
                  onClick={() => setParam('waId', c.waId)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    c.waId === activeWaId ? 'bg-primary-50/60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {c.profileName || `+${c.waId}`}
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0">{fmtTime(c.lastMessageAt)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 truncate">{c.lastMessagePreview || '—'}</span>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 text-[10px] font-bold text-white bg-primary-500 rounded-full px-1.5 py-0.5">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div
          className={`bg-white border border-gray-200 rounded-2xl overflow-hidden flex-col h-[calc(100dvh-88px-env(safe-area-inset-bottom))] lg:h-[calc(100vh-104px)] lg:flex ${
            activeWaId ? 'flex' : 'hidden'
          }`}
        >
          {!activeWaId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4 py-12">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <MessageSquare size={22} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Pick a conversation to read it</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setParam('waId', '')}
                    className="lg:hidden shrink-0 -ml-1 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {conversation?.profileName || `+${activeWaId}`}
                    </p>
                    <p className="text-xs text-gray-400">+{activeWaId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={13} className={isMine ? 'text-green-500' : 'text-amber-500'} />
                    <select
                      value={assignee?._id ?? assignee ?? ''}
                      disabled={isAssigning}
                      onChange={(e) =>
                        assignConversation({ waId: activeWaId, adminUserId: e.target.value || null })
                      }
                      className="text-[11px] font-semibold px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-[140px]"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((agent) => (
                        <option key={agent._id} value={agent._id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!isMine && (
                    <button
                      type="button"
                      onClick={() => assignConversation({ waId: activeWaId, adminUserId: myId })}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      Take over
                    </button>
                  )}
                  <WindowBadge lastInboundAt={conversation?.lastInboundAt} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/60">
                {isLoadingThread ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 size={22} className="animate-spin text-gray-300" />
                  </div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble
                      key={m.wamid}
                      message={m}
                      quoted={m.replyToWamid ? messages.find((x) => x.wamid === m.replyToWamid) : null}
                      onReply={setReplyTo}
                    />
                  ))
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-100">
                {windowRemaining(conversation?.lastInboundAt) ? (
                  <>
                  {repliesOpen && (
                    <div className="mb-3 border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/60">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Saved replies</p>
                        <button
                          type="button"
                          onClick={() => setRepliesOpen(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {savedReplies.length === 0 ? (
                        <p className="text-xs text-gray-400">Nothing saved yet. Add one below.</p>
                      ) : (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {savedReplies.map((reply) => (
                            <div key={reply._id} className="flex items-center gap-2 group">
                              <button
                                type="button"
                                onClick={() => {
                                  setDraft(reply.body);
                                  setRepliesOpen(false);
                                }}
                                className="flex-1 text-left px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                              >
                                <span className="block text-xs font-semibold text-gray-700">{reply.title}</span>
                                <span className="block text-[11px] text-gray-400 truncate">{reply.body}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteSavedReply(reply._id)}
                                className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          value={newReply.title}
                          onChange={(e) => setNewReply((r) => ({ ...r, title: e.target.value }))}
                          placeholder="Shortcut name"
                          className="w-32 shrink-0 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
                        />
                        <input
                          value={newReply.body}
                          onChange={(e) => setNewReply((r) => ({ ...r, body: e.target.value }))}
                          placeholder="Message text"
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
                        />
                        <button
                          type="button"
                          disabled={!newReply.title.trim() || !newReply.body.trim() || isCreatingSavedReply}
                          onClick={() =>
                            createSavedReply(
                              { title: newReply.title, body: newReply.body },
                              { onSuccess: () => setNewReply({ title: '', body: '' }) },
                            )
                          }
                          className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  {!isMine ? (
                    <p className="text-xs text-amber-700 text-center">
                      Assigned to {assignee?.name || 'another agent'}. Take over to reply.
                    </p>
                  ) : (
                  <>
                  {replyTo && (
                    <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <QuotedPreview message={replyTo} compact />
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                        title="Cancel reply"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {pendingFile && (
                    <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <span className="flex-1 text-xs text-gray-600 truncate">{pendingFile.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {(pendingFile.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const text = draft.trim();
                      if (isSending || isSendingMedia) return;
                      if (pendingFile) {
                        sendMedia(
                          { waId: activeWaId, file: pendingFile, caption: text || undefined, replyTo: replyTo?.wamid },
                          { onSuccess: () => { setDraft(''); setPendingFile(null); setReplyTo(null); } },
                        );
                        return;
                      }
                      if (!text) return;
                      sendMessage(
                        { waId: activeWaId, text, replyTo: replyTo?.wamid },
                        { onSuccess: () => { setDraft(''); setReplyTo(null); } },
                      );
                    }}
                    className="flex items-end gap-2"
                  >
                    <label
                      title="Attach a file"
                      className={`shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer transition-colors ${
                        isSendingMedia ? 'opacity-40 pointer-events-none' : ''
                      }`}
                    >
                      {isSendingMedia ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Paperclip size={15} />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file) setPendingFile(file);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      title="Saved replies"
                      onClick={() => setRepliesOpen((open) => !open)}
                      className={`shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-xl border transition-colors ${
                        repliesOpen
                          ? 'border-primary-300 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Zap size={15} />
                    </button>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={1}
                      placeholder={pendingFile ? 'Add a caption, Enter to send' : 'Type a reply, Enter to send'}
                      className="flex-1 resize-none px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 max-h-32"
                    />
                    <button
                      type="submit"
                      disabled={(!draft.trim() && !pendingFile) || isSending || isSendingMedia}
                      className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSending || isSendingMedia ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </form>
                  </>
                  )}
                  </>
                ) : (
                  <p className="text-xs text-amber-700 text-center">
                    The 24 hour window has closed. Only an approved template can reopen this chat.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
