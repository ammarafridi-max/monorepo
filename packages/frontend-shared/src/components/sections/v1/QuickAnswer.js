import Container from '../../shared/layout/Container.js';
import PrimarySection from '../../shared/layout/PrimarySection.js';

const MIN_VERDICT = 12;
const MAX_VERDICT = 220;

function splitVerdict(answer) {
  const text = String(answer || '').trim();
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
  if (sentences.length < 2) return { verdict: text, detail: '' };

  let i = 0;
  let verdict = '';
  while (i < sentences.length && verdict.length < MIN_VERDICT) {
    verdict = verdict ? `${verdict} ${sentences[i]}` : sentences[i];
    i += 1;
  }
  const detail = sentences.slice(i).join(' ').trim();
  if (!detail || verdict.length > MAX_VERDICT) return { verdict: text, detail: '' };
  return { verdict, detail };
}

export default function QuickAnswer({
  question,
  answer,
  verdict: verdictProp,
  detail: detailProp,
  tiers,
  tiersLabel = 'How long it stays live',
  faqHref = '#faq',
}) {
  const split = splitVerdict(answer);
  const verdict = verdictProp ?? split.verdict;
  const detail = detailProp ?? split.detail;
  const hasTiers = Array.isArray(tiers) && tiers.length > 0;

  return (
    <PrimarySection className="py-12 md:py-16 bg-white">
      <Container>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-5 h-[3px] rounded-sm bg-accent-500" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-500">
            Quick answer
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-14">
          <div className="grow max-w-[700px]">
            <h2 className="text-h2 font-semibold tracking-[-0.015em] text-primary-900 mb-4">
              {question}
            </h2>
            <p className="text-[19px] md:text-[20px] leading-[1.6] font-medium text-gray-900">
              {verdict}
            </p>
            {detail && (
              <p className="mt-3 text-[16px] md:text-[17px] leading-[1.75] text-gray-600">
                {detail}
              </p>
            )}
          </div>

          {hasTiers && (
            <div className="lg:w-[260px] lg:shrink-0 border-t border-gray-200 pt-5 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-3">
                {tiersLabel}
              </p>
              <div className="flex gap-2 lg:flex-col lg:gap-1.5">
                {tiers.map(({ label, price }) => (
                  <div
                    key={label}
                    className="flex-1 rounded-xl border border-gray-200 p-2.5 text-center lg:flex-none lg:border-0 lg:p-0 lg:text-left lg:flex lg:justify-between lg:items-baseline"
                  >
                    <span className="block text-[13px] text-gray-500 lg:text-[15px] lg:text-gray-900">
                      {label}
                    </span>
                    <span className="block text-[15px] font-semibold text-gray-900">{price}</span>
                  </div>
                ))}
              </div>
              <a
                href={faqHref}
                className="mt-5 inline-flex items-center justify-center lg:justify-start gap-1.5 w-full lg:w-auto min-h-[48px] lg:min-h-0 rounded-xl lg:rounded-none border border-primary-100 lg:border-0 bg-primary-50/50 lg:bg-transparent text-[15px] lg:text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Read the full FAQ
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </Container>
    </PrimarySection>
  );
}
