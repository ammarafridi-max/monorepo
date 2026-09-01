import Breadcrumb from "../../shared/layout/Breadcrumb";
import Container from "../../shared/layout/Container";
import PrimarySection from "../../shared/layout/PrimarySection";
import { HiCheck, HiStar } from "react-icons/hi2";

export default function Hero({
  title,
  subtitle,
  form,
  pills = [],
  sectionId = "form",
  breadcrumbPaths = [],
}) {
  return (
    <PrimarySection
      className="relative overflow-hidden bg-primary-900 bg-linear-to-br from-primary-900 via-primary-800 to-primary-900 pt-20 pb-14 md:pt-30 md:pb-16 lg:pt-30 lg:pb-20"
      id={sectionId}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-500/30 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
      </div>

      <Container className="relative flex flex-col lg:flex-row items-start justify-between gap-9 lg:gap-14">
        <div className="w-full lg:w-1/2 text-left">

          {breadcrumbPaths.length > 0 && (
            <Breadcrumb paths={breadcrumbPaths} dark />
          )}

          <h1 className="mt-4 text-[30px] md:text-[46px] leading-[1.15] md:leading-[1.3] font-bold font-outfit text-white mb-5">
            {title}
          </h1>

          {subtitle && (
            <p className="text-[15px] md:text-[18px] text-white/75 font-normal leading-6 md:leading-7">
              {subtitle}
            </p>
          )}

          {pills.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 lg:mt-8 lg:grid lg:grid-cols-2 lg:gap-x-3 lg:gap-y-2.5">
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
    <div className="flex items-center gap-1.5 whitespace-nowrap lg:gap-2">
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary-400 lg:h-4 lg:w-4">
        <HiCheck className="text-primary-950 text-[9px] lg:text-[11px]" />
      </span>
      <span className="text-[11px] font-medium text-white/90 lg:text-[13px]">{text}</span>
    </div>
  );
}
