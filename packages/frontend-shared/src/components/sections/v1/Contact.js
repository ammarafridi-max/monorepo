import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import {
  HiArrowUpRight,
  HiOutlineEnvelope,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2';
import PrimarySection from '../../shared/layout/PrimarySection';
import Container from '../../shared/layout/Container';

export default function Contact({
  title = 'Talk to a real person',
  text = 'Questions about your order, the documents you need, or a change to a booking you already made. Send a message and a human answers.',
  email,
  whatsappNumber,
  faqHref = '/faq',
  replyTime,
}) {
  if (!email && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[Contact] `email` prop is required. ' +
        'Pass the brand-specific support email from the consuming app.',
    );
  }

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${String(whatsappNumber).replace(/\D/g, '')}`
    : null;

  return (
    <PrimarySection id="contact" className="py-14 md:py-18 lg:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-primary-900 bg-linear-to-br from-primary-900 via-primary-800 to-primary-900 p-7 md:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-24 h-56 w-56 rounded-full bg-accent-500/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center lg:gap-14">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-300">
                Support
              </p>

              <h2 className="text-[26px] md:text-[32px] lg:text-[36px] font-medium leading-[1.15] tracking-[-0.01em] text-white">
                {title}
              </h2>

              <p className="mt-4 max-w-xl text-[15px] md:text-[16px] leading-6 md:leading-7 text-white/70">
                {text}
              </p>

              {replyTime && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] text-white/80">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-300 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-300" />
                  </span>
                  Usually replies {replyTime}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {email && (
                <ContactTile
                  href={`mailto:${email}`}
                  icon={<HiOutlineEnvelope className="text-[19px]" aria-hidden="true" />}
                  label="Email us"
                  value={email}
                />
              )}

              {whatsappHref && (
                <ContactTile
                  href={whatsappHref}
                  external
                  icon={<FaWhatsapp className="text-[19px]" aria-hidden="true" />}
                  label="WhatsApp"
                  value="Start a chat"
                />
              )}

              {faqHref && (
                <ContactTile
                  href={faqHref}
                  internal
                  icon={<HiOutlineQuestionMarkCircle className="text-[19px]" aria-hidden="true" />}
                  label="Common questions"
                  value="Read the FAQ"
                />
              )}
            </div>
          </div>
        </div>
      </Container>
    </PrimarySection>
  );
}

function ContactTile({ href, icon, label, value, external = false, internal = false }) {
  const className =
    'group flex items-center gap-3.5 rounded-2xl border border-white/12 bg-white/8 px-4 py-3.5 transition-colors hover:border-white/25 hover:bg-white/14';

  const body = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11.5px] uppercase tracking-[0.1em] text-white/50">
          {label}
        </span>
        <span className="block truncate text-[14.5px] font-medium text-white">{value}</span>
      </span>
      <HiArrowUpRight
        className="text-[15px] text-white/40 transition-colors group-hover:text-white"
        aria-hidden="true"
      />
    </>
  );

  if (internal) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {body}
    </a>
  );
}
