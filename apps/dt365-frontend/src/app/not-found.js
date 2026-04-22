import PrimaryLink from '@travel-suite/frontend-shared/components/v1/PrimaryLink';
import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';

export default function PageNotFound() {
  return (
    <PrimarySection className="bg-gray-50 py-28 md:py-30 font-outfit">
      <Container>
        <div className="text-center space-y-6">
          <h1 className="text-[72px] md:text-[96px] font-bold text-[#ff6b00] leading-none">
            404
          </h1>

          <h2 className="text-[26px] md:text-[32px] font-semibold text-gray-800">
            Oops! Page Not Found
          </h2>

          <p className="text-[16px] md:text-[18px] text-gray-600 max-w-lg mx-auto font-light">
            The page you're looking for doesn’t exist or has been moved. Let’s
            get you back home safely.
          </p>

          <div className="pt-6">
            <PrimaryLink
              to="/"
              className="inline-block bg-[#ff6b00] text-white text-[16px] font-medium px-6 py-3 rounded-full shadow-md hover:bg-[#e65e00] transition-all duration-300"
            >
              Go Back Home
            </PrimaryLink>
          </div>
        </div>
      </Container>
    </PrimarySection>
  );
}
