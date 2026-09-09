import Container from '../../shared/layout/Container';
import PrimarySection from '../../shared/layout/PrimarySection';
import SectionTitle from '../../shared/layout/SectionTitle';

export default function Benefits({
  title = 'Why Choose Us?',
  subtitle = 'Trusted supplier based in Dubai',
  benefits,
}) {
  return (
    <PrimarySection className="py-section bg-gray-50/70" id="benefits">
      <Container>
        <SectionTitle align="center" subtitle={subtitle} className="mb-10 md:mb-12">
          {title}
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {benefits.map((item, i) => (
            <div
              className="h-full font-outfit rounded-2xl border border-gray-200 bg-white p-6 md:p-7 transition-colors duration-200 hover:border-primary-300"
              key={i}
            >
              <div className="w-11 h-11 flex items-center justify-center bg-primary-50 text-primary-700 text-[19px] rounded-xl">
                <item.icon />
              </div>
              <h3 className="text-[20px] font-semibold text-gray-900 tracking-[-0.01em]! text-left mt-5 mb-2">
                {item?.title}
              </h3>
              <p className="text-[16px] text-gray-600 font-light leading-7">{item?.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
