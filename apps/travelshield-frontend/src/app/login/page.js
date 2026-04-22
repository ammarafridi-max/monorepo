"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  Globe,
  HeartPulse,
  Plane,
  AlertCircle,
} from "lucide-react";
import { FaGoogle, FaFacebook } from "react-icons/fa6";
import Link from "next/link";

/* --- OAuth button ------------------------------------------------------------- */

function OAuthButton({ icon: Icon, label, color, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${color}`}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin shrink-0" />
      ) : (
        <Icon size={18} className="shrink-0" />
      )}
      <span className="flex-1 text-left">
        {loading ? "Redirecting…" : label}
      </span>
      {!loading && <ArrowRight size={14} className="opacity-40" />}
    </button>
  );
}

/* --- Left panel features ------------------------------------------------------ */

const FEATURES = [
  {
    Icon: ShieldCheck,
    title: "Manage your policies",
    body: "View active policies, download documents, and check cover details.",
  },
  {
    Icon: HeartPulse,
    title: "Track your purchases",
    body: "See all the policies you have bought through TravelShield in one place.",
  },
  {
    Icon: Globe,
    title: "Trip history",
    body: "Access your past and upcoming covered trips at any time.",
  },
  {
    Icon: Plane,
    title: "Instant quotes",
    body: "Get a personalised quote in seconds with pre-filled details.",
  },
];

/* --- Error messages ----------------------------------------------------------- */

const ERROR_MESSAGES = {
  OAuthAccountNotLinked:
    "This email is already linked to a different sign-in method. Try the other option.",
  OAuthCallback: "Something went wrong during sign-in. Please try again.",
  OAuthCreateAccount: "Could not create an account. Please try again.",
  Callback: "Sign-in was interrupted. Please try again.",
  Default: "Sign-in failed. Please try again.",
};

function sanitizeCallbackUrl(value) {
  if (!value || typeof value !== "string") return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

/* --- Login form (uses useSearchParams — must be inside Suspense) -------------- */

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
  const errorCode = searchParams.get("error");

  const [loading, setLoading] = useState(null); // 'google' | 'facebook' | null

  async function handleOAuth(provider) {
    setLoading(provider);
    // signIn() from next-auth/react starts the OAuth redirect flow.
    // On success:  redirects to callbackUrl
    // On failure:  redirects to /login?error=<ErrorCode>
    await signIn(provider, { callbackUrl });
    // If signIn() returns without redirecting, reset loading
    setLoading(null);
  }

  return (
    <div className="w-full max-w-md">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <span className="font-extrabold text-gray-900 text-xl tracking-tight">
          TravelShield
        </span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
          Welcome back
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          Sign in to manage your policies and trip history.
        </p>

        {/* Error banner */}
        {errorCode && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">
              {ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default}
            </p>
          </div>
        )}

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3">
          <OAuthButton
            icon={FaGoogle}
            label="Continue with Google"
            color="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            onClick={() => handleOAuth("google")}
            loading={loading === "google"}
          />
          <OAuthButton
            icon={FaFacebook}
            label="Continue with Facebook"
            color="bg-[#1877F2] border-[#1877F2] text-white hover:bg-[#166FE5] hover:border-[#166FE5]"
            onClick={() => handleOAuth("facebook")}
            loading={loading === "facebook"}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">
            Secure sign-in via OAuth 2.0
          </span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Trust note */}
        <p className="text-center text-xs text-gray-400 leading-relaxed">
          By signing in you agree to our{" "}
          <Link
            href="/terms"
            className="text-primary-700 font-semibold hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-primary-700 font-semibold hover:underline"
          >
            Privacy Policy
          </Link>
          . We never post without your permission.
        </p>
      </div>

      {/* Footer links */}
      <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          ← Back to home
        </Link>
        <Link
          href="/"
          className="font-semibold text-primary-700 hover:text-primary-900 transition-colors"
        >
          Get a quote →
        </Link>
      </div>
    </div>
  );
}

/* --- Page --------------------------------------------------------------------- */

export default function UserLoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* -- Left panel -- */}
      <div className="hidden lg:flex lg:w-[55%] bg-linear-to-br from-primary-950 via-primary-900 to-primary-800 flex-col justify-between p-14 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/5" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">
            TravelShield
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative">
          <p className="text-primary-300 text-xs font-bold uppercase tracking-widest mb-4">
            Your account
          </p>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-5">
            Everything you need,
            <br />
            <span className="text-accent-300">in one place.</span>
          </h1>
          <p className="text-primary-200 text-base leading-relaxed max-w-sm mb-10">
            Policies, trip history, and instant quotes — all in your
            TravelShield account.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-4">
            {FEATURES.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-primary-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-xs text-primary-300 mt-0.5 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-primary-500">
          Your data is shared only with the insurer you choose. We never sell
          your information.
        </p>
      </div>

      {/* -- Right panel -- */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
