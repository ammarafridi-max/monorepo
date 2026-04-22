const defaultSteps = [
  {
    step: '01',
    title: 'Get a Quote',
    desc: 'Enter your destination, dates, and traveller details to instantly compare plans.',
  },
  {
    step: '02',
    title: 'Choose Your Plan',
    desc: 'Select the coverage level that suits your trip and budget. Add extras if needed.',
  },
  {
    step: '03',
    title: 'Travel with Confidence',
    desc: "Receive your policy instantly via email and travel knowing we've got your back.",
  },
];

export default function HowItWorks({
  title = 'How It Works',
  description = 'Get covered in under 3 minutes.',
  steps = defaultSteps,
}) {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
          <p className="text-gray-500 mt-3">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary-700 text-white font-bold text-lg flex items-center justify-center shadow-md">
                {step}
              </div>
              <h3 className="mt-5 font-semibold text-lg">{title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
