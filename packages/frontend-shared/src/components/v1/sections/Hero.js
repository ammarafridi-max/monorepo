import Container from "../layout/Container";
import PrimarySection from "../layout/PrimarySection";
import { HiCheck, HiStar } from "react-icons/hi2";

export default function Hero({ title, subtitle, form, pills = [], sectionId = "form" }) {
  return (
    <PrimarySection
      className="relative overflow-hidden bg-[linear-gradient(160deg,#f5fbfb_0%,#eef4ff_52%,#fff9f4_100%)] pt-24 pb-14 md:pt-30 md:pb-16 lg:pt-30 lg:pb-20"
      id={sectionId}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-200/45 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent-100/60 blur-3xl" />
      </div>

      <Container className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-9 lg:gap-14">
        <div className="w-full lg:w-1/2 text-left">
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/75 px-3 py-1 text-[12px] font-medium text-primary-900 backdrop-blur-sm">
            <HiStar className="text-accent-500" />
            Trusted by thousands of visa applicants
          </div> */}

          <h1 className="mt-4 text-[30px] md:text-[46px] leading-[1.3] font-bold font-outfit text-gray-900 mb-5">
            {title}
          </h1>

          {subtitle && (
            <p className="text-[16px] md:text-[18px] text-gray-600 font-normal leading-7">
              {subtitle}
            </p>
          )}

          {pills.length > 0 && (
            <div className="hidden mt-8 lg:grid grid-cols-2 sm:grid-cols-2 gap-2">
              {pills.slice(0, 4).map((text, i) => (
                <ValuePill key={i} text={text} />
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-[46%] rounded-3xl">{form}</div>
      </Container>
    </PrimarySection>
  );
}

function ValuePill({ text }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-primary-100 bg-white/70 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600">
        <HiCheck className="text-white text-[13px]" />
      </span>
      <span className="text-[13px] font-medium text-gray-700">{text}</span>
    </div>
  );
}
