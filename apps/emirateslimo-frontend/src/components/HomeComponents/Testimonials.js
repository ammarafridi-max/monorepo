import PrimarySection from '../PrimarySection';
import Container from '../Container';
import SectionTitle from '../SectionTitle';

export default function Testimonials({
  title = 'What Our Clients Say',
  subtitle = 'Client Testimonials',
  testimonials = [],
}) {
  return (
    <PrimarySection id="testimonials" className="bg-primary-900 py-15 lg:py-30">
      <Container>
        <SectionTitle dark textAlign="center" subtitle={subtitle}>
          {title}
        </SectionTitle>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group flex flex-col justify-between bg-white/5 border border-white/8 p-8 rounded-2xl hover:border-accent-500/30 hover:bg-white/8 transition-all duration-300"
            >
              <div className="text-[56px] leading-none text-accent-500/70 font-serif mb-1 -mt-2 select-none">
                &ldquo;
              </div>

              <p className="text-[15px] font-light leading-[1.85] text-white/65 mb-7 flex-1">{t.text}</p>

              <div className="flex items-center gap-3 pt-5 border-t border-white/8">
                <div className="w-10 h-10 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400 text-sm font-medium flex-shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[14.5px] font-light text-white/85">{t.name}</p>
                  <p className="text-[12.5px] font-light text-white/40">{t.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
