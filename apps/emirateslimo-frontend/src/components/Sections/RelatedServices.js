import Link from 'next/link';
import PrimarySection from '../PrimarySection';
import Container from '../Container';
import SectionTitle from '../SectionTitle';

export default function RelatedServices({ title = 'You May Also Need', subtitle = 'Related Services', links = [] }) {
  if (links.length === 0) return null;

  return (
    <PrimarySection className="py-15 lg:py-20 bg-primary-50">
      <Container>
        <SectionTitle subtitle={subtitle}>{title}</SectionTitle>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-accent-300/50 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
              <h3 className="text-[18px] font-light tracking-wide text-primary-900 mb-2">{link.label}</h3>
              <p className="text-[13.5px] font-light leading-relaxed text-gray-500">{link.text}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-light text-accent-600">
                Learn more
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
