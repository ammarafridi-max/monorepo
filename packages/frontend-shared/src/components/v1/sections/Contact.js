import PrimarySection from '../PrimarySection';
import Container from '../layout/Container';
import SectionTitle from '../layout/SectionTitle';
import PrimaryLink from '../PrimaryLink';

export default function Contact({
  title = 'Contact Us Now',
  text = "Still have questions or doubts about our service? Feel free to send us an email. We'd be happy to help you out.",
}) {
  return (
    <PrimarySection id="contact" className="py-14 md:py-18 lg:py-24">
      <Container>
        <div className="relative overflow-hidden flex flex-col md:flex-row items-center gap-10 rounded-3xl border border-primary-100 bg-[linear-gradient(145deg,#f5fbfb_0%,#eff7ff_55%,#fff7f0_100%)] p-8 md:p-12">
          <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-primary-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -bottom-16 h-44 w-44 rounded-full bg-accent-200/30 blur-3xl" />

          <div className="relative w-full md:w-3/5 mb-6 md:mb-0">
            <SectionTitle className="mb-5">{title}</SectionTitle>
            <p className="text-[16px] md:text-[18px] text-gray-600 font-light leading-7">{text}</p>
            <PrimaryLink size="small" href="mailto:info@travl.ae" className="mt-6">
              Send Us An Email
            </PrimaryLink>
          </div>

          <div className="relative w-full md:w-2/5">
            <img
              src="/contact-img.webp"
              alt="Contact Travl Now"
              className="w-full h-full object-cover rounded-[16px_44px_16px_44px] shadow-lg"
            />
          </div>
        </div>
      </Container>
    </PrimarySection>
  );
}
