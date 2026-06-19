import Container from "@travel-suite/frontend-shared/components/shared/layout/Container";
import SectionHeading from "./SectionHeading";
import { ArrowRight } from "lucide-react";

const DEFAULT_DESTINATIONS = [
  {
    city: "Dubai",
    code: "DXB",
    span: "col-span-2 row-span-2",
    grad: "from-clay-700 via-clay-800 to-clay-900",
    big: true,
  },
  {
    city: "Abu Dhabi",
    code: "AUH",
    span: "lg:col-span-2",
    grad: "from-honey-600 to-clay-800",
  },
  {
    city: "London",
    code: "LHR",
    span: "lg:col-span-2",
    grad: "from-ink to-ink",
  },
  {
    city: "Istanbul",
    code: "IST",
    span: "lg:col-span-2",
    grad: "from-clay-800 to-ink",
  },
  { city: "Bangkok", code: "BKK", span: "", grad: "from-ink to-clay-900" },
  {
    city: "Barcelona",
    code: "BCN",
    span: "",
    grad: "from-sand-500 to-clay-800",
  },
  {
    city: "Paris",
    code: "CDG",
    span: "lg:col-span-2",
    grad: "from-clay-900 to-ink",
  },
  {
    city: "Rome",
    code: "FCO",
    span: "col-span-2 lg:col-span-2",
    grad: "from-ink via-clay-800 to-clay-900",
  },
];

export default function DestinationsSection({
  eyebrow = "Where we roam",
  title = "Airport transfers in popular destinations",
  subtitle = "Tap a city to see transfers from its main airport.",
  destinations = DEFAULT_DESTINATIONS,
  moreCitiesHref = "#launch",
  moreCitiesText = "Get notified when we launch in your destination.",
}) {
  return (
    <section
      id="destinations"
      className="scroll-mt-24 bg-sand-50 py-20 md:py-28"
    >
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div className="mt-14 grid grid-cols-2 gap-4 auto-rows-[150px] lg:grid-cols-4 lg:auto-rows-[180px]">
          {destinations.map(({ city, code, span, grad, big }) => (
            <a
              key={code}
              href="#"
              className={`group relative overflow-hidden rounded-card bg-linear-to-br ${grad} ${span} ring-1 ring-black/5`}
            >
              <span
                aria-hidden="true"
                className={`absolute -right-2 bottom-2 font-display font-semibold leading-none text-white/15 ${
                  big ? "text-[9rem]" : "text-7xl"
                }`}
              >
                {code}
              </span>
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span
                  className={`font-display font-semibold text-white drop-shadow ${
                    big ? "text-3xl" : "text-xl"
                  }`}
                >
                  {city}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
                  Transfers from {code}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </span>
              </div>
            </a>
          ))}
        </div>

        <p className="mt-10 text-center text-[15px] font-light text-ink-soft">
          More cities added every week. Don&apos;t see yours?{" "}
          <a
            href={moreCitiesHref}
            className="font-semibold text-clay-600 underline underline-offset-4 hover:text-clay-700"
          >
            {moreCitiesText}
          </a>
        </p>
      </Container>
    </section>
  );
}
