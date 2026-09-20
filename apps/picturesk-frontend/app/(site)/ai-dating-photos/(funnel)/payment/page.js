import { redirect } from 'next/navigation';

export default async function Page({ searchParams }) {
  const qs = new URLSearchParams(await searchParams).toString();
  redirect(`/ai-dating-photos/review${qs ? `?${qs}` : ''}`);
}
