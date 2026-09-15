import PrimarySection from '../PrimarySection';
import Container from '../Container';

export default function ServiceIntro({ question, answer, paragraphs = [], facts = [] }) {
  return (
    <PrimarySection className="py-15 lg:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[7fr_4fr] lg:gap-20">
          <div>
            <h2 className="text-[26px] lg:text-[34px] font-light leading-[1.2] tracking-tight text-primary-900 mb-6">
              {question}
            </h2>
            <p className="text-[17px] lg:text-[19px] font-light leading-[1.7] text-primary-900 border-l-2 border-accent-500 pl-5 mb-8">
              {answer}
            </p>
            <div className="flex flex-col gap-5">
              {paragraphs.map((text, i) => (
                <p key={i} className="text-[15.5px] font-light leading-[1.9] text-gray-600">
                  {text}
                </p>
              ))}
            </div>
          </div>

          {facts.length > 0 && (
            <dl className="self-start rounded-2xl border border-gray-100 bg-primary-50 p-7 flex flex-col gap-5">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-[11px] tracking-[0.2em] uppercase font-light text-accent-600 mb-1">{fact.label}</dt>
                  <dd className="text-[15px] font-light text-primary-900 leading-relaxed">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Container>
    </PrimarySection>
  );
}
