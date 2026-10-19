'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAssistantConversationApi, streamAssistantMessageApi } from '../../services/apiAssistant.js';

let nextId = 0;
const makeId = () => {
  nextId += 1;
  return `m${nextId}`;
};

export function useAssistantChat({ nav } = {}) {
  const queryClient = useQueryClient();
  const abortRef = useRef(null);

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateLastAssistant = useCallback((updater) => {
    setMessages((current) => {
      const next = [...current];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].role === 'assistant') {
          next[i] = updater(next[i]);
          break;
        }
      }
      return next;
    });
  }, []);

  const startNewConversation = useCallback(() => {
    abortRef.current?.abort();
    setConversationId(null);
    setMessages([]);
    setNotice(null);
    setStreaming(false);
  }, []);

  const openConversation = useCallback(async (id) => {
    abortRef.current?.abort();
    setStreaming(false);
    setNotice(null);

    const conversation = await getAssistantConversationApi(id);
    if (!conversation) return;

    setConversationId(conversation.id);
    setMessages(
      conversation.messages.map((message) => ({
        id: makeId(),
        role: message.role,
        text: message.text || '',
        tools: (message.tools || []).map((tool) => ({
          name: tool.name,
          dataset: tool.input?.dataset ?? null,
          pending: false,
        })),
      })),
    );
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const send = useCallback(
    async (input) => {
      const text = String(input ?? '').trim();
      if (!text || streaming) return;

      const controller = new AbortController();
      abortRef.current = controller;

      setNotice(null);
      setStreaming(true);
      setMessages((current) => [
        ...current,
        { id: makeId(), role: 'user', text, tools: [] },
        { id: makeId(), role: 'assistant', text: '', tools: [] },
      ]);

      try {
        await streamAssistantMessageApi({
          conversationId,
          message: text,
          nav,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === 'text') {
              updateLastAssistant((message) => ({ ...message, text: message.text + event.text }));
              return;
            }

            if (event.type === 'tool') {
              updateLastAssistant((message) => ({
                ...message,
                tools: [...message.tools, { name: event.name, dataset: event.input?.dataset ?? null, pending: true }],
              }));
              return;
            }

            if (event.type === 'tool_result') {
              updateLastAssistant((message) => {
                const tools = [...message.tools];
                for (let i = tools.length - 1; i >= 0; i -= 1) {
                  if (tools[i].pending && tools[i].name === event.name) {
                    tools[i] = {
                      ...tools[i],
                      pending: false,
                      dataset: event.dataset ?? tools[i].dataset,
                      rowCount: event.rowCount,
                      error: event.error ?? null,
                    };
                    break;
                  }
                }
                return { ...message, tools };
              });
              return;
            }

            if (event.type === 'done') {
              setConversationId(event.conversationId);
              if (event.stopped) setNotice(event.stopped);
              queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
              return;
            }

            if (event.type === 'error') {
              updateLastAssistant((message) => ({ ...message, error: event.message }));
            }
          },
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          updateLastAssistant((message) => ({ ...message, error: error.message }));
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [conversationId, nav, queryClient, streaming, updateLastAssistant],
  );

  return {
    conversationId,
    messages,
    streaming,
    notice,
    send,
    stop,
    startNewConversation,
    openConversation,
  };
}
