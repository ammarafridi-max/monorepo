import Link from "next/link";
import Navbar from "@travel-suite/frontend-shared/components/v2/sections/Navbar";
import Footer from "@travel-suite/frontend-shared/components/v2/sections/Footer";
import ContactForm from "@travel-suite/frontend-shared/components/v2/ContactForm";
import { Mail, MapPin, Clock, MessageCircle, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Contact Us — TravelShield",
  description:
    "Get in touch with the TravelShield team. We're here to help with quotes, policy questions, and guidance on the claims process.",
};

const contactDetails = [
  {
    Icon: Mail,
    label: "Email Us",
    value: "hello@travelshield.com",
    sub: "We aim to respond within 1 business day",
    href: "mailto:hello@travelshield.com",
  },
  {
    Icon: MapPin,
    label: "Based In",
    value: "Dubai, United Arab Emirates",
    sub: "Serving customers across the UAE and beyond",
    href: null,
  },
  {
    Icon: Clock,
    label: "Office Hours",
    value: "Sun – Thu, 9am – 6pm GST",
    sub: "Outside hours? Email us and we'll respond next business day",
    href: null,
  },
];

const quickLinks = [
  {
    Icon: MessageCircle,
    title: "Have a question about a quote?",
    desc: "Fill in the form and we'll help you find the right policy for your trip.",
    action: "Send us a message →",
    href: "#contact-form",
  },
  {
    Icon: AlertCircle,
    title: "Need to make a claim?",
    desc: "Claims are handled directly by your insurer. Check your policy documents for their emergency and claims contact details.",
    action: "Learn about the claims process →",
    href: "/claims",
  },
];

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />

      <main className="flex-1">
        {/* -- Hero -- */}
        <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-accent-400 text-white py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
              Get in Touch
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              We&apos;re here to help
            </h1>
            <p className="mt-4 text-primary-100 text-lg max-w-xl mx-auto leading-relaxed">
              Whether you have a question about a quote, need help understanding
              your policy, or want guidance on anything else — our team is
              ready.
            </p>
          </div>
        </section>

        {/* -- Quick links -- */}
        <section className="border-b border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map(({ Icon, title, desc, action, href }) => (
              <Link
                key={title}
                href={href}
                className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-5 hover:border-primary-300 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  <span className="mt-2 inline-block text-xs font-semibold text-primary-700 group-hover:underline">
                    {action}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* -- Form + details -- */}
        <section
          id="contact-form"
          className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start scroll-mt-8"
        >
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Send us a message
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              Fill in the form and we&apos;ll get back to you as soon as
              possible.
            </p>
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-gray-900">Contact details</h2>

            <div className="flex flex-col gap-4">
              {contactDetails.map(({ Icon, label, value, sub, href }) => (
                <div
                  key={label}
                  className="flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-primary-700" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {label}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        className="text-sm font-semibold text-gray-900 hover:text-primary-700 transition-colors mt-0.5 block"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {value}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer note */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-xs font-bold text-amber-800 mb-1">
                About claims
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                TravelShield is an insurance intermediary. All claims are
                handled directly by the insurer named on your policy. In an
                emergency, call the 24/7 helpline printed on your policy
                certificate — do not wait to contact us first.
              </p>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
}
