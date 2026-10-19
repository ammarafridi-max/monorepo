import PrimarySection from '../../shared/layout/PrimarySection';
import Container from '../../shared/layout/Container';
import SectionTitle from '../../shared/layout/SectionTitle';

export default function TermsSummary({
  id = 'terms',
  title = 'The terms that decide the money',
  subtitle,
  items = [],
  footnote,
}) {
  if (!items.length) return null;

  return (
    <PrimarySection id={id} className="py-section bg-gray-50/70">
      <Container>
        <SectionTitle subtitle={subtitle} className="mb-8 md:mb-10">
          {title}
        </SectionTitle>

        <dl className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
          {items.map((item, i) => (
            <div
              key={i}
              className="p-5 md:p-7 md:grid md:grid-cols-[220px_1fr] md:gap-8 lg:gap-12"
            >
              <dt className="text-[17px] md:text-[18px] font-semibold text-gray-900 tracking-[-0.01em]! mb-2 md:mb-0">
                {item.term}
              </dt>
              <dd className="text-[15px] md:text-[16px] text-gray-600 font-light leading-7">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>

        {footnote && (
          <p className="mt-6 text-[14px] md:text-[15px] text-gray-500 font-light leading-7">
            {footnote}
          </p>
        )}
      </Container>
    </PrimarySection>
  );
}
