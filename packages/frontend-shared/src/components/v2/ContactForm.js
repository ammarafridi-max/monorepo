"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { useSubmitContactRequest } from "../../hooks/contact/useSubmitContactRequest";

const subjects = [
  "General Enquiry",
  "Get a Quote",
  "Policy Question",
  "Make a Claim",
  "Billing & Payments",
  "Technical Support",
  "Press & Partnerships",
];

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("idle");
  const [requestId, setRequestId] = useState(null);
  const { submitContactRequest, isSubmittingContactRequest } =
    useSubmitContactRequest();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");

    submitContactRequest(form, {
      onSuccess: (data) => {
        setRequestId(data?.requestId || null);
        setStatus("success");
      },
      onError: () => {
        setStatus("idle");
      },
    });
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
          <CheckCircle className="text-primary-600" size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Message sent!</h3>
        <p className="text-gray-500 max-w-sm">
          Thanks for reaching out. A member of our team will get back to you
          within 1 business day.
        </p>
        {requestId && (
          <p className="text-xs text-gray-400">Reference: {requestId}</p>
        )}
        <button
          onClick={() => {
            setForm({ name: "", email: "", subject: "", message: "" });
            setRequestId(null);
            setStatus("idle");
          }}
          className="mt-2 text-sm font-semibold text-primary-700 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">Full name</label>
          <input
            name="name"
            type="text"
            required
            placeholder="Jane Smith"
            value={form.name}
            onChange={handleChange}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">
            Email address
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="jane@example.com"
            value={form.email}
            onChange={handleChange}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">Subject</label>
        <select
          name="subject"
          required
          value={form.subject}
          onChange={handleChange}
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white transition"
        >
          <option value="" disabled>
            Select a subject…
          </option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">Message</label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Tell us how we can help…"
          value={form.message}
          onChange={handleChange}
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmittingContactRequest}
        className="flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-70 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors"
      >
        {isSubmittingContactRequest ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send size={15} /> Send Message
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        We typically respond within 1 business day. For urgent matters, call our
        24/7 helpline.
      </p>
    </form>
  );
}
