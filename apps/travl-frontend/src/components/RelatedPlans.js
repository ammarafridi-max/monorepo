import Link from "next/link";
import Container from "@travel-suite/frontend-shared/components/shared/layout/Container";
import PrimarySection from "@travel-suite/frontend-shared/components/shared/layout/PrimarySection";
import SectionTitle from "@travel-suite/frontend-shared/components/shared/layout/SectionTitle";

export const PLAN_TYPES = [
  { name: "Single Trip Insurance", href: "/travel-insurance/single-trip" },
  { name: "Annual Multi-Trip Insurance", href: "/travel-insurance/annual-multi-trip" },
  { name: "Family Travel Insurance", href: "/travel-insurance/family" },
  { name: "Travel Medical Insurance", href: "/travel-insurance/medical" },
  { name: "International Travel Insurance", href: "/travel-insurance/international" },
];

export const DESTINATIONS = [
  { name: "Schengen Visa", href: "/travel-insurance/schengen-visa" },
  { name: "France Visa", href: "/travel-insurance/france-visa" },
  { name: "Spain Visa", href: "/travel-insurance/spain-visa" },
  { name: "Italy Visa", href: "/travel-insurance/italy-visa" },
  { name: "Germany Visa", href: "/travel-insurance/germany-visa" },
  { name: "Greece Visa", href: "/travel-insurance/greece-visa" },
  { name: "Switzerland Visa", href: "/travel-insurance/switzerland-visa" },
  { name: "Netherlands Visa", href: "/travel-insurance/netherlands-visa" },
  { name: "Austria Visa", href: "/travel-insurance/austria-visa" },
  { name: "UK Visa", href: "/travel-insurance/uk-visa" },
  { name: "US Visa", href: "/travel-insurance/us-visa" },
  { name: "Canada Visa", href: "/travel-insurance/canada-visa" },
  { name: "Australia Visa", href: "/travel-insurance/australia-visa" },
  { name: "Bali and Indonesia", href: "/travel-insurance/indonesia" },
];

const chip =
  "px-4 py-2 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 text-[14px] font-medium hover:bg-primary-100 transition-colors";

function Group({ heading, links, current }) {
  const visible = links.filter((l) => l.href !== current);
  if (!visible.length) return null;
  return (
    <div className="mb-8 last:mb-0">
      <h3 className="text-[15px] font-semibold text-gray-800 mb-3 text-center">{heading}</h3>
      <div className="flex flex-wrap justify-center gap-3">
        {visible.map((link) => (
          <Link key={link.href} href={link.href} className={chip}>
            {link.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RelatedPlans({ current, title = "Other Travel Insurance Plans" }) {
  return (
    <PrimarySection className="py-10 lg:py-14">
      <Container>
        <SectionTitle className="mb-6">{title}</SectionTitle>
        <Group heading="By trip type" links={PLAN_TYPES} current={current} />
        <Group heading="Insurance by visa and destination" links={DESTINATIONS} current={current} />
        {current !== "/travel-insurance" && (
          <div className="flex justify-center mt-2">
            <Link href="/travel-insurance" className={chip}>
              All Travel Insurance Plans
            </Link>
          </div>
        )}
      </Container>
    </PrimarySection>
  );
}
