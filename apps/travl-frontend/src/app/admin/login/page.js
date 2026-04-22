import { Suspense } from "react";
import Link from "next/link";
import { Plane } from "lucide-react";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign In — Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary-950 via-primary-900 to-primary-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/2 border border-white/10" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Plane size={20} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">
            Travl
          </span>
          <span className="ml-1 text-xs font-semibold bg-white/15 text-white/80 px-2 py-0.5 rounded-full border border-white/20">
            Admin
          </span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Manage your
            <br />
            ticketing platform
          </h1>
          <p className="text-primary-200 text-base leading-relaxed max-w-sm">
            Access orders, insurance applications, affiliates, content, and
            financial settings from one secure dashboard.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Dummy Tickets", value: "Order management" },
              { label: "Insurance", value: "Policy management" },
              { label: "Affiliates", value: "Commission mgmt" },
              { label: "Blog", value: "Content tools" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-white/10 border border-white/15 rounded-xl p-4"
              >
                <p className="text-xs text-primary-300 font-medium mb-0.5">
                  {label}
                </p>
                <p className="text-sm text-white font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-400">
          Restricted access — authorised personnel only
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Plane size={22} className="text-primary-700" />
            <span className="font-extrabold text-gray-900 text-lg">
              Travl
            </span>
            <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full border border-primary-200">
              Admin
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              Sign in
            </h2>
            <p className="text-sm text-gray-500 mb-7">
              Enter your admin credentials to continue.
            </p>

            {/* Wrapped in Suspense because LoginForm uses useSearchParams */}
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-10">
                  <span className="w-5 h-5 rounded-full border-2 border-primary-200 border-t-primary-700 animate-spin" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link href="/" className="hover:text-gray-600 transition">
              ← Back to Travl
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
