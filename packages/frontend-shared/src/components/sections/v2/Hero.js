import Link from "next/link";
import PrimarySection from '../../shared/layout/PrimarySection.js';
import Container from '../../shared/layout/Container.js';
import { HiCheck, HiChevronRight } from "react-icons/hi2";
import HeroQuoteForm from "../../ui/v2/HeroQuoteForm.js";

export default function Hero({
  title = "Travel the World with Peace of Mind",
  text = "Comprehensive travel insurance covering medical emergencies, trip cancellations, lost luggage, and more — anywhere in the world.",
  form,
  pills = [],
  breadcrumbPaths = [],
  trustBar,
}) {
  return (
    <PrimarySection className="relative bg-gray-50 text-gray-900 overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary-100/40 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-primary-100/30 pointer-events-none" />

      <Container className="relative pt-10 pb-14 md:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div>
          {breadcrumbPaths.length > 0 && (
            <nav className="flex items-center gap-1.5 text-gray-400 text-xs mb-6 flex-wrap">
              {breadcrumbPaths.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <HiChevronRight
                      size={12}
                      className="text-gray-300 shrink-0"
                    />
                  )}
                  {i === breadcrumbPaths.length - 1 ? (
                    <span className="text-gray-600">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.path || crumb.href || "/"}
                      className="hover:text-gray-900 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          )}

          <h1 className="text-4xl md:text-5xl xl:text-5xl font-bold leading-tight tracking-tight text-gray-900">
            {title}
          </h1>

          <p className="mt-6 text:base md:text-lg text-gray-600 leading-relaxed max-w-md">
            {text}
          </p>

          {pills.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2.5">
              {pills.map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  <HiCheck size={12} className="shrink-0 text-primary-600" />
                  {pill}
                </span>
              ))}
            </div>
          )}

          {trustBar && <div className="mt-6">{trustBar}</div>}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          {form ?? <HeroQuoteForm />}
        </div>
      </Container>
    </PrimarySection>
  );
}
