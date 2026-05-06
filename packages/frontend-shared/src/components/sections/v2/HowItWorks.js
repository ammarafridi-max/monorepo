import PrimarySection from '../../shared/layout/PrimarySection.js';
import Container from '../../shared/layout/Container.js';

const defaultSteps = [
  {
    title: 'Get a Quote',
    text: 'Enter your destination, dates, and traveller details to instantly compare plans.',
  },
  {
    title: 'Choose Your Plan',
    text: 'Select the coverage level that suits your trip and budget. Add extras if needed.',
  },
  {
    title: 'Travel with Confidence',
    text: "Receive your policy instantly via email and travel knowing we've got your back.",
  },
];

export default function HowItWorks({
  title = 'How It Works',
  subtitle = 'Get covered in under 3 minutes.',
  steps = defaultSteps,
}) {
  return (
    <PrimarySection className="bg-gray-50 py-20">
      <Container className="max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
          <p className="text-gray-500 mt-3">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary-700 text-white font-bold text-lg flex items-center justify-center shadow-md">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-5 font-semibold text-lg">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
