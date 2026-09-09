import PrimarySection from '../../shared/layout/PrimarySection';
import Container from '../../shared/layout/Container';
import SectionTitle from '../../shared/layout/SectionTitle';

const stepsTemplate = [
  {
    title: 'Tell us what you need',
    text: 'Fill in your trip details, travel dates, and traveler information using our simple online form. The whole process takes less than two minutes.',
  },
  {
    title: 'Choose your service',
    text: 'Select from dummy tickets, hotel reservations, or travel insurance. Pick the plan or validity period that works best for your visa application.',
  },
  {
    title: 'Pay and receive instantly',
    text: 'Complete your secure payment and your documents arrive in your inbox within minutes. No office visits, no waiting around.',
  },
];

export default function Process({
  title = 'Simple, Hassle-Free Process',
  subtitle = 'How it Works',
  keyword = 'flight reservation',
  steps = stepsTemplate,
}) {
  return (
    <PrimarySection className="py-section" id="process">
      <Container>
        <SectionTitle
          align="center"
          subtitle={subtitle}
          className="mb-10 md:mb-12"
        >
          {title}
        </SectionTitle>

        <ol className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
          {steps.map((step, i) => (
            <li key={i} className="relative flex gap-5 lg:block">
              {i < steps.length - 1 && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute left-5 top-12 -bottom-8 w-px bg-gray-200 lg:hidden"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute hidden lg:block top-5 left-12 -right-6 h-px bg-gray-200"
                  />
                </>
              )}

              <span className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-[15px] font-semibold">
                {i + 1}
              </span>

              <div className="min-w-0 lg:mt-5">
                <h3 className="text-[20px] font-semibold text-gray-900 tracking-[-0.01em]! mb-2">
                  {step.title}
                </h3>
                <p className="text-[16px] text-gray-600 font-light leading-7">
                  {step.text.replaceAll('{keyword}', keyword)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </PrimarySection>
  );
}
