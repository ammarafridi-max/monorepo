import Breadcrumb from '../Breadcrumb';
import Container from '../Container';
import PageHeading from '../PageHeading';
import PrimarySection from '../PrimarySection';

export default function PageHero({ paths = [], title = '', subtitle = '' }) {
  return (
    <PrimarySection className="relative overflow-hidden bg-primary-900 pt-10 pb-15 md:pt-10 md:pb-15 lg:pt-10 lg:pb-15">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-accent-500/4 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-white/2 blur-3xl" />
      </div>

      <Container className="relative">
        <div className="flex flex-col">
          <Breadcrumb paths={paths} dark />
          <PageHeading className="mt-3 mb-4 text-[30px] lg:text-[44px] font-light leading-[1.15] text-white tracking-tight">
            {title}
          </PageHeading>
          {subtitle && (
            <p className="font-light text-[15px] lg:text-[17px] text-white/50 leading-[1.85] max-w-2xl">{subtitle}</p>
          )}
        </div>
      </Container>
    </PrimarySection>
  );
}
