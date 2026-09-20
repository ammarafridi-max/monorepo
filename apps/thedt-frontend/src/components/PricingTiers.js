import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import BookCta from '@/components/BookCta';
import { CURRENCY, PRICING_OPTIONS } from '@/config';

const bestFor = {
  '2 Days': 'Short-notice visa appointments',
  '7 Days': 'Standard visa processing windows',
  '14 Days': 'Longer processing or multi-stage applications',
};

const POPULAR = '7 Days';

function PopularBadge() {
  return (
    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium tracking-normal text-primary-700">
      Most popular
    </span>
  );
}

export default function PricingTiers({
  title = 'Dummy Ticket Pricing',
  subtitle = 'Pick the validity period that matches your application timeline',
  keyword = 'dummy ticket',
}) {
  const [two, seven, fourteen] = PRICING_OPTIONS.map((o) => o.price);

  return (
    <PrimarySection className="py-section" id="pricing">
      <Container>
        <SectionTitle align="center" subtitle={subtitle} className="mb-8 md:mb-10">
          {title}
        </SectionTitle>

        <p className="mb-8 max-w-3xl text-[16px] font-light leading-7 text-gray-600 md:mx-auto md:text-center">
          A {keyword} costs {CURRENCY} {two} for 2 days, {CURRENCY} {seven} for 7 days, or{' '}
          {CURRENCY} {fourteen} for 14 days. The price depends on the validity period you select,
          not on availability, and it covers both one way and return reservations per person.
        </p>

        <div className="flex flex-col gap-3 md:hidden">
          {PRICING_OPTIONS.map((option) => (
            <div
              key={option.value}
              className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 px-5 py-4"
            >
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-[16px] font-semibold text-gray-900">
                  {option.label}
                  {option.value === POPULAR && <PopularBadge />}
                </span>
                <span className="text-[14px] font-light leading-6 text-gray-600">
                  {bestFor[option.value]}
                </span>
              </div>
              <span className="shrink-0 text-[20px] font-semibold text-primary-700">
                {CURRENCY} {option.price}
              </span>
            </div>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 md:block">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Dummy ticket pricing by validity period</caption>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Validity', 'Price', 'Best for'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3.5 font-outfit text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PRICING_OPTIONS.map((option) => (
                <tr key={option.value} className="transition-colors hover:bg-gray-50/60">
                  <th
                    scope="row"
                    className="px-5 py-5 text-[16px] font-semibold text-gray-900 whitespace-nowrap"
                  >
                    <span className="flex items-center gap-2.5">
                      {option.label}
                      {option.value === POPULAR && <PopularBadge />}
                    </span>
                  </th>
                  <td className="px-5 py-5 text-[20px] font-semibold text-primary-700 whitespace-nowrap">
                    {CURRENCY} {option.price}
                  </td>
                  <td className="px-5 py-5 text-[16px] font-light leading-7 text-gray-600">
                    {bestFor[option.value]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <BookCta
          className="mt-8"
          text="Every option is the same real reservation with a live PNR. Only the validity period changes."
        />
      </Container>
    </PrimarySection>
  );
}
