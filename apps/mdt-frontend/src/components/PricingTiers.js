import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import { PRICING_OPTIONS } from '@/config';

const bestFor = {
  '2 Days': 'Short-notice visa appointments',
  '7 Days': 'Standard visa processing windows',
  '14 Days': 'Longer processing or multi-stage applications',
};

const POPULAR = '7 Days';

export default function PricingTiers({
  title = 'Dummy Ticket Pricing',
  subtitle = 'Pick the validity period that matches your application timeline',
  keyword = 'dummy ticket',
}) {
  return (
    <PrimarySection className="py-section" id="pricing">
      <Container>
        <SectionTitle align="center" subtitle={subtitle} className="mb-8 md:mb-10">
          {title}
        </SectionTitle>

        <p className="mb-8 max-w-3xl text-[16px] font-light leading-7 text-gray-600 md:mx-auto md:text-center">
          A {keyword} costs AED 49 for 2 days, AED 69 for 7 days, or AED 79 for
          14 days. The price depends on the validity period you select, not on
          availability, and it covers both one way and return reservations per
          person.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only">
              Dummy ticket pricing by validity period
            </caption>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th
                  scope="col"
                  className="px-5 py-3.5 font-outfit text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-500"
                >
                  Validity
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 font-outfit text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-500"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 font-outfit text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-500"
                >
                  Best for
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PRICING_OPTIONS.map((option) => (
                <tr
                  key={option.value}
                  className="transition-colors hover:bg-gray-50/60"
                >
                  <th
                    scope="row"
                    className="px-5 py-5 text-[16px] font-semibold text-gray-900 whitespace-nowrap"
                  >
                    <span className="flex items-center gap-2.5">
                      {option.label}
                      {option.value === POPULAR && (
                        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium tracking-normal text-primary-700">
                          Most popular
                        </span>
                      )}
                    </span>
                  </th>
                  <td className="px-5 py-5 text-[20px] font-semibold text-primary-700 whitespace-nowrap">
                    AED {option.price}
                  </td>
                  <td className="px-5 py-5 text-[16px] font-light leading-7 text-gray-600">
                    {bestFor[option.value]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </PrimarySection>
  );
}
