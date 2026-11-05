import NotFoundPage from '@travel-suite/frontend-shared/seo/NotFoundPage';

export default function PageNotFound() {
  return (
    <NotFoundPage
      headingClassName="text-[72px] md:text-[96px] font-bold text-[#ff6b00] leading-none"
      linkClassName="inline-block bg-[#ff6b00] text-white text-[16px] font-medium px-6 py-3 rounded-full shadow-md hover:bg-[#e65e00] transition-all duration-300"
    />
  );
}
