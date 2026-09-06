import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import { PRICING_OPTIONS } from '@/config';

const bestFor = {
  '2 Days': 'Short-notice visa appointments',
  '7 Days': 'Standard visa processing windows',
  '14 Days': 'Longer processing or multi-stage applications',
};

export default function PricingTiers({
  title = 'Dummy Ticket Pricing',
  subtitle = 'Pick the validity period that matches your application timeline',
  keyword = 'dummy ticket',
}) {
  return (
    <PrimarySection className="py-14 md:py-18 lg:py-24" id="pricing">
      <Container>
        <SectionTitle
          textAlign="center"
          subtitle={subtitle}
          className="mb-10 md:mb-12"
        >
          {title}
        </SectionTitle>

        <p className="mx-auto mb-8 max-w-3xl text-center text-[16px] font-light leading-7 text-gray-600">
          A {keyword} costs AED 49 for 2 days, AED 69 for 7 days, or AED 79 for
          14 days. The price depends on the validity period you select, not on
          availability, and it covers both one way and return reservations per
          person.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only">
              Dummy ticket pricing by validity period
            </caption>
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  scope="col"
                  className="px-4 py-3 font-outfit text-[16px] font-normal text-gray-900"
                >
                  Validity
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-outfit text-[16px] font-normal text-gray-900"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-outfit text-[16px] font-normal text-gray-900"
                >
                  Best for
                </th>
              </tr>
            </thead>
            <tbody>
              {PRICING_OPTIONS.map((option) => (
                <tr key={option.value} className="border-b border-gray-100">
                  <th
                    scope="row"
                    className="px-4 py-4 text-[16px] font-normal text-gray-900"
                  >
                    {option.label}
                  </th>
                  <td className="px-4 py-4 text-[16px] font-normal text-gray-900">
                    AED {option.price}
                  </td>
                  <td className="px-4 py-4 text-[16px] font-light leading-7 text-gray-600">
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
