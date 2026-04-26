import HeroQuoteForm from '../ui/HeroQuoteForm.js';

export default function Hero({
  title = 'Travel the World with Peace of Mind',
  subtitle = 'Trusted by 500,000+ travellers',
  text = 'Comprehensive travel insurance covering medical emergencies, trip cancellations, lost luggage, and more — anywhere in the world.',
  benefits = [
    '✓ 150+ countries',
    '✓ 24/7 emergency support',
    '✓ Instant policy',
  ],
}) {
  return (
    <section className="relative bg-linear-to-br from-primary-700 via-primary-600 to-accent-400 text-white overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-white/5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            {subtitle}
          </span>
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight">
            {title}
          </h1>
          <p className="mt-6 text-lg text-primary-100 leading-relaxed max-w-md">
            {text}
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-primary-200">
            {benefits.map((benefit) => (
              <span key={benefit}>✓ {benefit}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <HeroQuoteForm />
        </div>
      </div>
    </section>
  );
}
