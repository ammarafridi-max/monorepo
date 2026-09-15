import { Suspense } from 'react';

export const metadata = { title: 'Select - Generator' };

export default function Layout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
