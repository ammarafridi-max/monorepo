// Landing pages under /lp are for paid and direct traffic only, never search.
export const metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function LandingLayout({ children }) {
  return children;
}
