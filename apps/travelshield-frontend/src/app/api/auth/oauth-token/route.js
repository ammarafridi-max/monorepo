import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SignJWT } from 'jose';
import { authOptions } from '../[...nextauth]/route';

function getJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured');
  }

  return new TextEncoder().encode(secret);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const token = await new SignJWT({
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    provider: session.user.provider ?? 'google',
    providerId: session.user.providerId ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('60s')
    .sign(getJwtSecret());

  return NextResponse.json({ token });
}
