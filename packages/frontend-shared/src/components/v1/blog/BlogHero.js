import Link from 'next/link';
import Container from '../layout/Container';
import PrimarySection from '../PrimarySection';

export default function BlogHero({ title, subtitle, paths = [] }) {
  return (
    <PrimarySection className="relative overflow-hidden bg-[linear-gradient(160deg,#f5fbfb_0%,#eef4ff_52%,#fff9f4_100%)] pb-12 pt-24 md:pb-14 md:pt-28 lg:pb-16 lg:pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />
      </div>
      <Container className="relative">
        <BlogBreadcrumb paths={paths} />
        <h1 className="mb-5 mt-4 font-outfit text-3xl font-medium tracking-[-0.02em] text-gray-900 lg:text-5xl">
          {title}
        </h1>
        <p className="text-md leading-7 text-gray-600 lg:text-lg">{subtitle}</p>
      </Container>
    </PrimarySection>
  );
}

export function BlogBreadcrumb({ paths = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[14px] text-gray-500 lg:text-sm">
      <ol className="flex flex-wrap items-center gap-y-1">
        {paths.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center font-light">
            {index > 0 && <span className="mx-2 lg:mx-3">/</span>}
            {index === paths.length - 1 ? (
              <span aria-current="page" className="text-gray-900">
                {item.label}
              </span>
            ) : (
              <Link href={item.path} className="transition-colors hover:text-primary-600">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
