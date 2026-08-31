import Link from "next/link";
import PrimarySection from "../../shared/layout/PrimarySection.js";
import Container from "../../shared/layout/Container.js";
import { HiCheck, HiChevronRight } from "react-icons/hi2";
import HeroQuoteForm from "../../ui/v2/HeroQuoteForm.js";

export default function Hero({
  title = "Travel the World with Peace of Mind",
  text = "Comprehensive travel insurance covering medical emergencies, trip cancellations, lost luggage, and more — anywhere in the world.",
  form,
  below,
  layout = "split",
  dark = false,
  pills = [],
  breadcrumbPaths = [],
  trustBar,
}) {
  const centered = layout === "centered";

  if (centered) {
    return (
      <PrimarySection
        className={`relative ${dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute -top-32 -right-32 w-125 h-125 rounded-full ${
              dark ? "bg-primary-500/10" : "bg-primary-100/40"
            }`}
          />
          <div
            className={`absolute -bottom-20 -left-20 w-87.5 h-87.5 rounded-full ${
              dark ? "bg-primary-500/10" : "bg-primary-100/30"
            }`}
          />
        </div>

        <Container className="relative py-16 md:py-24">
          <div className="max-w-3xl lg:mx-auto lg:text-center">
            <h1
              className={`text-4xl md:text-5xl xl:text-5xl font-bold leading-tight tracking-tight ${
                dark ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h1>

            <p
              className={`mt-6 text-base md:text-lg leading-relaxed lg:mx-auto ${
                dark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {text}
            </p>

            {trustBar && (
              <div className="mt-6 lg:flex lg:justify-center">{trustBar}</div>
            )}
          </div>

          {below && (
            <div className="relative mt-10 max-w-4xl lg:mx-auto">{below}</div>
          )}

          {/* Below the search bar: the tool is what people came for, so nothing
              sits between it and the headline. */}
          {pills.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2.5 lg:justify-center">
              {pills.map((pill) => (
                <span
                  key={pill}
                  className={`inline-flex items-center gap-1.5 border text-xs font-medium px-3 py-1.5 rounded-full ${
                    dark
                      ? "bg-white/5 border-white/15 text-gray-200"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  <HiCheck
                    size={12}
                    className={`shrink-0 ${dark ? "text-primary-300" : "text-primary-600"}`}
                  />
                  {pill}
                </span>
              ))}
            </div>
          )}
        </Container>
      </PrimarySection>
    );
  }

  return (
    <PrimarySection className="relative bg-gray-50 text-gray-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary-100/40" />
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-primary-100/30" />
      </div>

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

          <p className="mt-6 text-base md:text-lg text-gray-600 leading-relaxed max-w-md">
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
