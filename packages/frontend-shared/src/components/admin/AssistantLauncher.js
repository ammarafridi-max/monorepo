'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAssistantMeta } from '../../hooks/assistant/useAssistantMeta.js';
import AssistantWindow from './AssistantWindow.js';

export default function AssistantLauncher({ nav }) {
  const [open, setOpen] = useState(false);
  const { meta, assistantAvailable } = useAssistantMeta();

  if (!assistantAvailable) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the assistant"
        title="Assistant"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-primary-700"
      >
        <Sparkles size={16} />
      </button>

      <AssistantWindow open={open} onClose={() => setOpen(false)} nav={nav} meta={meta} />
    </>
  );
}
