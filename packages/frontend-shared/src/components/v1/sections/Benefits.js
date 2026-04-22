import Container from '../layout/Container';
import PrimarySection from '../PrimarySection';
import SectionTitle from '../layout/SectionTitle';

export default function Benefits({
  title = 'Why Choose Travl?',
  subtitle = 'Trusted supplier based in Dubai',
  benefits,
}) {
  return (
    <PrimarySection className="py-14 md:py-18 lg:py-24 bg-gray-50/70" id="benefits">
      <Container>
        <SectionTitle textAlign="center" subtitle={subtitle} className="mb-10 md:mb-12">
          {title}
        </SectionTitle>
        <div className="flex flex-col gap-5 md:grid md:grid-cols-3 md:gap-7">
          {benefits.map((item, i) => (
            <div
              className="w-full md:mb-0 font-outfit rounded-2xl border border-white bg-white p-7 shadow-[0_14px_35px_rgba(16,24,40,0.08)]"
              key={i}
            >
              <div className="w-10 h-10 flex items-center justify-center bg-primary-600 text-white text-lg font-medium font-outfit rounded-xl">
                <item.icon />
              </div>
              <h3 className="text-[20px] font-normal text-gray-900 capitalize font-outfit text-left mt-4 mb-2">
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

// function IconCard({ icon, title, text }) {
//   return (

//   );
// }
