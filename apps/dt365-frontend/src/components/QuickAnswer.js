import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';

// Quick-answer block: an H2 with the page's core question and a single
// 40-80 word paragraph that answers it verdict-first. Renders directly
// after Hero, before the Process section, on every landing page that
// targets a high-intent query. Designed for Google featured snippets and
// AI Overviews, both reward concise, definitional copy near the top.
//
// Heading matches SectionTitle's typographic role (text-h2 token, medium,
// negative tracking, gray-900) with one deliberate deviation: no
// capitalize. The question is a full sentence and title-casing every word
// reads wrong. Icon sits on the left at primary-500 to mark the role.
export default function QuickAnswer({ question, answer }) {
  return (
    <PrimarySection className="py-12 md:py-16 bg-white">
      <Container>
        <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-6 md:p-8">
          <div className="flex items-start gap-3">
            <HiOutlineQuestionMarkCircle
              className="w-7 h-7 text-primary-500 shrink-0 mt-1"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-h2 text-gray-900 font-medium font-outfit tracking-[-0.01em] text-left mb-2.5">
                {question}
              </h2>
              <p className="text-body-lg max-w-[760px] text-gray-600 font-normal text-left">
                {answer}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </PrimarySection>
  );
}
