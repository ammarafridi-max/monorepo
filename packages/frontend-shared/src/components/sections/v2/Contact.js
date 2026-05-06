import Link from 'next/link';
import PrimarySection from '../../shared/layout/PrimarySection.js';
import Container from '../../shared/layout/Container.js';

export default function Contact({
  title = 'Still Have Questions?',
  text = "Our team is available 7 days a week. Send us an email and we'll get back to you within minutes.",
  email,
}) {
  return (
    <PrimarySection className="py-20 bg-primary-700 text-white" id="contact">
      <Container className="max-w-3xl text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">{title}</h2>
        <p className="mt-4 text-primary-200 text-lg max-w-lg mx-auto">{text}</p>
        {email && (
          <div className="mt-8">
            <Link
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-bold px-8 py-4 rounded-full text-sm transition-colors"
            >
              Send Us An Email
            </Link>
          </div>
        )}
      </Container>
    </PrimarySection>
  );
}
