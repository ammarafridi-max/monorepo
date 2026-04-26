import Breadcrumb from '../layout/Breadcrumb';
import Container from '../layout/Container';
import PageTitle from '../layout/PageTitle';
import PrimarySection from '../layout/PrimarySection';

export default function PageHero({ paths = [], title = '', subtitle = '' }) {
  return (
    <PrimarySection className="relative overflow-hidden bg-[linear-gradient(160deg,#f5fbfb_0%,#eef4ff_52%,#fff9f4_100%)] pt-24 pb-12 md:pt-28 md:pb-14 lg:pt-28 lg:pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />
      </div>
      <Container className="relative">
        <div className="flex flex-col">
          <Breadcrumb paths={paths} />
          <PageTitle className="mt-4 mb-5">{title}</PageTitle>
          <p className="text-[16px] text-gray-600 font-light leading-7">{subtitle}</p>
        </div>
      </Container>
    </PrimarySection>
  );
}
