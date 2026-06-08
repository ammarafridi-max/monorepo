import PrimarySection from '../PrimarySection';
import Container from '../Container';
import SectionTitle from '../SectionTitle';

export default function WhyBookEmiratesLimo({
  title = 'Why Book With Emirates Limo?',
  subtitle = 'Why Choose Us',
  benefits,
}) {
  return (
    <PrimarySection id="why-book" className="pb-15 lg:pb-30">
      <Container>
        <SectionTitle textAlign="center" subtitle={subtitle}>
          {title}
        </SectionTitle>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {benefits.map((item, i) => (
            <div
              key={i}
              className="group flex items-start gap-5 p-6 rounded-2xl border border-gray-100 bg-white hover:border-accent-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-50 border border-accent-100 text-accent-600 transition-all duration-300 group-hover:bg-accent-500 group-hover:border-accent-500 group-hover:text-white">
                <item.icon className="text-[19px]" />
              </div>

              <div className="flex-1">
                <h3 className="text-[17px] font-light tracking-wide text-primary-900 mb-1.5">{item.title}</h3>
                <p className="text-[14.5px] font-light leading-relaxed text-gray-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
