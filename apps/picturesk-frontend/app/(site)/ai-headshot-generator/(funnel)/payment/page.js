import { redirect } from 'next/navigation';

export default async function Page({ searchParams }) {
  const qs = new URLSearchParams(await searchParams).toString();
  redirect(`/ai-headshot-generator/review${qs ? `?${qs}` : ''}`);
}
