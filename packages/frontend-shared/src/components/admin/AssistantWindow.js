'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  Clock,
  Database,
  Loader2,
  PanelRight,
  Plus,
  Maximize2,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useAssistantChat } from '../../hooks/assistant/useAssistantChat.js';
import {
  useAssistantConversations,
  useDeleteAssistantConversation,
} from '../../hooks/assistant/useAssistantConversations.js';
import AssistantText, { splitFollowUps } from './AssistantText.js';

const TOOL_LABELS = {
  count_records: 'Counting',
  aggregate_records: 'Totalling',
  find_records: 'Listing',
  get_record: 'Looking up',
  stripe_balance: 'Stripe balance',
  stripe_revenue: 'Stripe revenue',
  stripe_transactions: 'Stripe transactions',
  stripe_payouts: 'Stripe payouts',
  stripe_disputes: 'Stripe disputes',
  stripe_find_payments: 'Stripe charges',
};

function suggestionsFor(meta) {
  const datasets = meta?.datasets ?? [];
  const primary = datasets[0];

  const suggestions = ['Where do I change my password?'];

  if (meta?.stripe) {
    suggestions.unshift('Stripe revenue by week this month, net of fees');
  }

  if (primary) {
    suggestions.unshift(
      `How many ${primary.label.toLowerCase()} came in this month?`,
      `Break down ${primary.label.toLowerCase()} by status`,
    );
  }

  if (datasets.length > 1) {
    suggestions.push(`What has moved in ${datasets[1].label.toLowerCase()} over the last 7 days?`);
  }

  return suggestions.slice(0, 4);
}

function ToolChip({ tool }) {
  if (tool.error) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
        <AlertTriangle size={11} />
        {TOOL_LABELS[tool.name] ?? tool.name} failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
      {tool.pending ? <Loader2 size={11} className="animate-spin" /> : <Database size={11} />}
      {TOOL_LABELS[tool.name] ?? tool.name}
      {tool.dataset && tool.dataset !== 'stripe' ? ` ${tool.dataset}` : ''}
      {!tool.pending && typeof tool.rowCount === 'number' ? ` · ${tool.rowCount}` : ''}
    </span>
  );
}

function Message({ message, streaming, isLast, onAsk }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary-700 px-3.5 py-2.5 text-[13px] leading-relaxed text-white whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }

  const waiting = streaming && isLast && !message.text;
  const { body, followUps } = splitFollowUps(message.text);
  const showFollowUps = followUps.length > 0 && !streaming;

  return (
    <div className="space-y-2">
      {message.tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {message.tools.map((tool, index) => (
            <ToolChip key={index} tool={tool} />
          ))}
        </div>
      )}

      {waiting && (
        <div className="flex items-center gap-2 text-[12px] text-gray-400">
          <Loader2 size={13} className="animate-spin" />
          Working on it
        </div>
      )}

      {body && <AssistantText text={body} />}

      {showFollowUps && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {followUps.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onAsk(question)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {message.error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-700">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          {message.error}
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ conversations, isLoading, activeId, onOpen, onDelete, deleting }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-[12px] text-gray-400">
        <Loader2 size={13} className="animate-spin" />
        Loading history
      </div>
    );
  }

  if (!conversations.length) {
    return <p className="px-3 py-4 text-[12px] text-gray-400">No earlier conversations.</p>;
  }

  return (
    <div className="space-y-0.5 p-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 ${
            conversation.id === activeId ? 'bg-gray-100' : 'hover:bg-gray-50'
          }`}
        >
          <button
            type="button"
            onClick={() => onOpen(conversation.id)}
            className="min-w-0 flex-1 text-left"
          >
            <span className="block truncate text-[12px] font-medium text-gray-700">{conversation.title}</span>
            <span className="block text-[10px] text-gray-400">
              {new Date(conversation.lastMessageAt).toLocaleString()}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(conversation.id)}
            disabled={deleting}
            aria-label="Delete conversation"
            className="shrink-0 rounded p-1 text-gray-300 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AssistantWindow({ open, onClose, nav, meta }) {
  const [mode, setMode] = useState('modal');
  const [showHistory, setShowHistory] = useState(false);
  const [draft, setDraft] = useState('');

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const {
    conversationId,
    messages,
    streaming,
    notice,
    send,
    stop,
    startNewConversation,
    openConversation,
  } = useAssistantChat({ nav });

  const { conversations, isLoadingConversations } = useAssistantConversations({ enabled: open && showHistory });
  const { deleteConversation, deletingConversation } = useDeleteAssistantConversation();

  const suggestions = useMemo(() => suggestionsFor(meta), [meta]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streaming]);

  if (!open) return null;

  function submit(text) {
    const value = String(text ?? '').trim();
    if (!value || streaming) return;
    setDraft('');
    send(value);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit(draft);
    }
  }

  const frame =
    mode === 'modal'
      ? 'h-[95vh] w-[95vw] rounded-2xl'
      : 'h-full w-full max-w-[520px] rounded-none border-l';

  return (
    <div
      className={`fixed inset-0 z-[60] flex ${
        mode === 'modal' ? 'items-center justify-center bg-gray-900/40 p-4' : 'justify-end bg-transparent'
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`flex flex-col overflow-hidden border-gray-200 bg-white shadow-2xl ${frame}`}>

        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-100 px-3">
          <span className="text-[13px] font-semibold text-gray-800">Assistant</span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Read only
          </span>

          <div className="flex-1" />

          <button
            type="button"
            onClick={startNewConversation}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          >
            <Plus size={13} />
            New
          </button>

          <button
            type="button"
            onClick={() => setShowHistory((value) => !value)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-medium transition hover:bg-gray-50 ${
              showHistory ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Clock size={13} />
            History
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'modal' ? 'panel' : 'modal')}
            aria-label={mode === 'modal' ? 'Dock to the side' : 'Expand'}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-800"
          >
            {mode === 'modal' ? <PanelRight size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close assistant"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-800"
          >
            <X size={15} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          {showHistory && (
            <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-gray-100 sm:block">
              <HistoryPanel
                conversations={conversations}
                isLoading={isLoadingConversations}
                activeId={conversationId}
                onOpen={openConversation}
                onDelete={deleteConversation}
                deleting={deletingConversation}
              />
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.length === 0 ? (
                  <div className="space-y-4 pt-6">
                    <div>
                      <p className="text-[15px] font-semibold text-gray-800">Ask about your data</p>
                      <p className="mt-1 text-[13px] text-gray-500">
                        I can read {meta?.datasets?.length ?? 0} dataset
                        {(meta?.datasets?.length ?? 0) === 1 ? '' : 's'} in this portal
                        {meta?.stripe ? ' and this brand\u2019s Stripe account' : ''}, and tell you where to find
                        things. I cannot change anything.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => submit(suggestion)}
                          className="rounded-full border border-gray-200 px-3 py-1.5 text-[12px] text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <Message
                      key={message.id}
                      message={message}
                      streaming={streaming}
                      isLast={index === messages.length - 1}
                      onAsk={submit}
                    />
                  ))
                )}

                {notice && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-800">{notice}</p>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 p-3">
              <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 focus-within:border-gray-300">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about orders, revenue, customers, or where to find a page"
                  className="max-h-40 flex-1 resize-none bg-transparent px-1.5 py-1 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />

                {streaming ? (
                  <button
                    type="button"
                    onClick={stop}
                    aria-label="Stop"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white transition hover:bg-gray-800"
                  >
                    <Square size={13} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => submit(draft)}
                    disabled={!draft.trim()}
                    aria-label="Send"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white transition hover:bg-primary-800 disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    <ArrowUp size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
