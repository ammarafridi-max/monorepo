"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  Menu,
  X,
  Shield,
  Plane,
  CalendarDays,
  Users,
  GraduationCap,
  Briefcase,
  Luggage,
  Sun,
  Globe,
  MapPin,
  Mountain,
  Anchor,
  Snowflake,
  Laptop,
  ArrowRight,
  ChevronRight,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../../contexts/UserAuthContext.js";
import { useCurrency } from "../../../contexts/CurrencyContext.js";
import { logoutUserSessionApi } from "../../../services/apiAuth.js";

const TRIP_TYPES = [
  {
    Icon: Plane,
    label: "Single Trip",
    desc: "Cover for one specific journey",
    href: "/?journeyType=single",
  },
  {
    Icon: CalendarDays,
    label: "Annual Multi-Trip",
    desc: "Unlimited trips over 12 months",
    href: "/?journeyType=annual",
  },
  {
    Icon: Users,
    label: "Family",
    desc: "One policy for the whole family",
    href: "/?journeyType=single&group=family&adults=2&children=2",
  },
  {
    Icon: GraduationCap,
    label: "Student",
    desc: "Long-stay study abroad protection",
    href: "/?journeyType=single",
  },
  {
    Icon: Luggage,
    label: "Backpacker",
    desc: "Flexible cover for extended travel",
    href: "/?journeyType=single",
  },
  {
    Icon: Briefcase,
    label: "Business Travel",
    desc: "Corporate trips with equipment cover",
    href: "/?journeyType=single",
  },
];

const DESTINATIONS = [
  {
    Icon: Sun,
    label: "Gulf Countries",
    sub: "UAE, KSA, Qatar, Kuwait & more",
    href: "/?region=gulf",
  },
  {
    Icon: Globe,
    label: "Europe",
    sub: "Including Schengen countries",
    href: "/?region=europe",
  },
  {
    Icon: Globe,
    label: "Worldwide",
    sub: "Including USA & Canada",
    href: "/?region=worldwide",
  },
  {
    Icon: Globe,
    label: "Worldwide (Excl. USA)",
    sub: "Excludes USA, Canada & Caribbean",
    href: "/?region=worldwide_ex",
  },
  {
    Icon: MapPin,
    label: "Asian Subcontinent",
    sub: "India, Pakistan, Bangladesh, Sri Lanka",
    href: "/?region=subcon",
  },
];
const SPECIALTY = [
  {
    Icon: Mountain,
    label: "Adventure Sports",
    desc: "Skiing, diving, hiking & more",
    href: "/",
  },
  {
    Icon: Anchor,
    label: "Cruise Cover",
    desc: "Tailored for cruise holidays",
    href: "/",
  },
  {
    Icon: Snowflake,
    label: "Ski & Winter",
    desc: "On and off-piste protection",
    href: "/",
  },
  {
    Icon: Laptop,
    label: "Digital Nomad",
    desc: "Long-stay remote worker cover",
    href: "/",
  },
];

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const {
    currencies = [],
    selectedCurrency: currency,
    setCurrency,
  } = useCurrency();

  const [megaOpen, setMegaOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileInsurance, setMobileInsurance] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const megaTimeout = useRef(null);

  function openMega() {
    clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  }
  function closeMega() {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 120);
  }

  function pickCurrency(c) {
    setCurrency(c);
    setCurrencyOpen(false);
  }

  return (
    <header className="relative bg-white border-b border-gray-100 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-primary-700 shrink-0"
        >
          <Shield size={22} className="text-primary-600" />
          TravelShield
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-600 flex-1">
          <div onMouseEnter={openMega} onMouseLeave={closeMega}>
            <button
              className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${megaOpen ? "text-primary-700 bg-primary-50" : "hover:text-primary-700 hover:bg-gray-50"}`}
            >
              Insurance
              <ChevronDown
                size={14}
                className={`transition-transform ${megaOpen ? "rotate-180" : ""}`}
              />
            </button>

            {megaOpen && (
              <div
                onMouseEnter={openMega}
                onMouseLeave={closeMega}
                className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-2xl"
              >
                <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      By Trip Type
                    </p>
                    <ul className="flex flex-col gap-1">
                      {TRIP_TYPES.map(({ Icon, label, desc, href }) => (
                        <li key={label}>
                          <Link
                            href={href}
                            onClick={() => setMegaOpen(false)}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary-50 group transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                              <Icon size={15} className="text-primary-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm leading-none mb-0.5">
                                {label}
                              </p>
                              <p className="text-xs text-gray-400">{desc}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      By Destination
                    </p>
                    <ul className="flex flex-col gap-1">
                      {DESTINATIONS.map(({ Icon, label, sub, href }) => (
                        <li key={label}>
                          <Link
                            href={href}
                            onClick={() => setMegaOpen(false)}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary-50 group transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                              <Icon size={15} className="text-primary-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm leading-none mb-0.5">
                                {label}
                              </p>
                              <p className="text-xs text-gray-400">{sub}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Specialty Cover
                      </p>
                      <ul className="flex flex-col gap-1">
                        {SPECIALTY.map(({ Icon, label, desc, href }) => (
                          <li key={label}>
                            <Link
                              href={href}
                              onClick={() => setMegaOpen(false)}
                              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary-50 group transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                                <Icon size={15} className="text-primary-700" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm leading-none mb-0.5">
                                  {label}
                                </p>
                                <p className="text-xs text-gray-400">{desc}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto bg-linear-to-br from-primary-700 to-accent-500 rounded-xl p-4 text-white">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary-200 mb-1">
                        Not sure what you need?
                      </p>
                      <p className="font-bold text-sm mb-3">
                        Answer 3 quick questions and we'll recommend a plan.
                      </p>
                      <Link
                        href="/insurance-booking/quote"
                        onClick={() => setMegaOpen(false)}
                        className="inline-flex items-center gap-1.5 bg-white text-primary-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        Find my plan <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/claims"
            className="px-4 py-2 rounded-lg hover:text-primary-700 hover:bg-gray-50 transition-colors"
          >
            Claims
          </Link>
          <Link
            href="/blog"
            className="px-4 py-2 rounded-lg hover:text-primary-700 hover:bg-gray-50 transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/about"
            className="px-4 py-2 rounded-lg hover:text-primary-700 hover:bg-gray-50 transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2 rounded-lg hover:text-primary-700 hover:bg-gray-50 transition-colors"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <button
              onClick={() => setCurrencyOpen((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>{currency?.code}</span>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform ${currencyOpen ? "rotate-180" : ""}`}
              />
            </button>

            {currencyOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCurrencyOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="p-2 max-h-72 overflow-y-auto">
                    {currencies.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => pickCurrency(c)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${currency?.code === c.code ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        <span className="font-medium">{c.code}</span>
                        <span className="text-gray-400 text-xs ml-auto">
                          {c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* -- Auth: Log in / User avatar -- */}
          {isAuthenticated ? (
            <div className="hidden lg:block relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
              >
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "Account"}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold">
                    {(user?.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user?.name?.split(" ")[0] ?? "Account"}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                      >
                        <User size={14} className="text-gray-400" />
                        My Account
                      </Link>
                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          try {
                            await logoutUserSessionApi();
                          } catch (error) {
                            void error;
                          }
                          await signOut({ callbackUrl: "/" });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              Login
            </Link>
          )}

          {/* <Link
            href="/insurance-booking/quote"
            className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Get a Quote
          </Link> */}

          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-6 pb-6 flex flex-col gap-1 text-sm font-medium text-gray-700">
          <button
            onClick={() => setMobileInsurance((p) => !p)}
            className="flex items-center justify-between w-full py-3 border-b border-gray-100"
          >
            <span className="font-semibold">Insurance</span>
            <ChevronRight
              size={16}
              className={`text-gray-400 transition-transform ${mobileInsurance ? "rotate-90" : ""}`}
            />
          </button>

          {mobileInsurance && (
            <div className="pl-2 flex flex-col gap-3 py-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                By Trip Type
              </p>
              {TRIP_TYPES.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="text-gray-600 hover:text-primary-700 transition-colors"
                >
                  {label}
                </Link>
              ))}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
                By Destination
              </p>
              {DESTINATIONS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="text-gray-600 hover:text-primary-700 transition-colors"
                >
                  {label}
                </Link>
              ))}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
                Specialty
              </p>
              {SPECIALTY.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="text-gray-600 hover:text-primary-700 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}

          {[
            { label: "Claims", href: "/claims" },
            { label: "Blog", href: "/blog" },
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="py-3 border-b border-gray-100 hover:text-primary-700 transition-colors"
            >
              {label}
            </Link>
          ))}

          {isAuthenticated ? (
            <>
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="py-3 border-b border-gray-100 hover:text-primary-700 transition-colors flex items-center gap-2"
              >
                <User size={14} className="text-gray-400" />
                My Account
              </Link>
              <button
                onClick={async () => {
                  setMobileOpen(false);
                  try {
                    await logoutUserSessionApi();
                  } catch (error) {
                    void error;
                  }
                  await signOut({ callbackUrl: "/" });
                }}
                className="py-3 text-left text-red-600 hover:text-red-700 transition-colors flex items-center gap-2"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="py-3 border-b border-gray-100 hover:text-primary-700 transition-colors"
            >
              Log in
            </Link>
          )}

          <div className="mt-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Currency
            </p>
            <div className="grid grid-cols-4 gap-2">
              {currencies.slice(0, 8).map((c) => (
                <button
                  key={c.code}
                  onClick={() => pickCurrency(c)}
                  className={`flex flex-col items-center py-2 rounded-xl border text-xs font-semibold transition-colors ${currency?.code === c.code ? "border-primary-400 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:border-primary-200"}`}
                >
                  <span>{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
