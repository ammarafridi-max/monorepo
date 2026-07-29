import ApplyDashboardPage from '@travel-suite/frontend-shared/pages/client/shared/ApplyDashboardPage';

export const metadata = {
  title: 'My visa applications',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ApplyDashboardPage />;
}
