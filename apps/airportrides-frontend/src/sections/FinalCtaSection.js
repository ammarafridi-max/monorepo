import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import { ArrowRight } from 'lucide-react';

export default function FinalCtaSection({
  title = 'Ready for a smoother arrival?',
  subtitle = 'Book your airport transfer in minutes and start your trip the easy way.',
  ctaHref = '#book',
  ctaLabel = 'Find your transfer',
}) {
  return (
    <section id="launch" className="scroll-mt-24 px-4 py-12 md:py-16">
      <Container>
        <div
          className="grain relative overflow-hidden rounded-panel px-6 py-16 text-center md:px-12 md:py-20"
          style={{
            backgroundImage:
              'radial-gradient(100% 120% at 0% 0%, #3f6aeb 0%, #2f5be6 45%, #2449c4 100%)',
          }}
        >
          <h2 className="mx-auto max-w-2xl text-h2 font-semibold text-sand-50">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lead font-light text-sand-100/85">{subtitle}</p>

          <div className="mt-8 flex justify-center">
            <a
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-pill bg-sand-50 px-7 py-4 text-base font-semibold text-clay-700 shadow-warm-sm transition-all duration-200 hover:bg-white hover:shadow-warm"
            >
              {ctaLabel}
              <ArrowRight size={18} />
            </a>
          </div>

        </div>
      </Container>
    </section>
  );
}
