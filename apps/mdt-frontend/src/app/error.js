'use client';

import { useEffect } from 'react';
import PrimaryLink from '@travel-suite/frontend-shared/components/v1/PrimaryLink';
import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PrimarySection className="bg-gray-50 py-28 md:py-30 font-outfit">
      <Container>
        <div className="text-center space-y-6">
          <h1 className="text-[72px] md:text-[96px] font-bold text-[#ff6b00] leading-none">
            500
          </h1>

          <h2 className="text-[26px] md:text-[32px] font-semibold text-gray-800">
            Something Went Wrong
          </h2>

          <p className="text-[16px] md:text-[18px] text-gray-600 max-w-lg mx-auto font-light">
            An unexpected error occurred. Please try again, or go back home if
            the problem persists.
          </p>

          <div className="pt-6 flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={reset}
              className="inline-block bg-[#ff6b00] text-white text-[16px] font-medium px-6 py-3 rounded-full shadow-md hover:bg-[#e65e00] transition-all duration-300"
            >
              Try Again
            </button>
            <PrimaryLink
              to="/"
              className="inline-block border border-[#ff6b00] text-[#ff6b00] text-[16px] font-medium px-6 py-3 rounded-full hover:bg-[#fff3ed] transition-all duration-300"
            >
              Go Back Home
            </PrimaryLink>
          </div>
        </div>
      </Container>
    </PrimarySection>
  );
}
