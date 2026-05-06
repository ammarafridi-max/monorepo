"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  Menu,
  X,
  ChevronRight,
  User,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContextBase.js";
import { useCurrency } from "../../../contexts/CurrencyContext.js";
import { logoutUserSessionApi } from "../../../services/apiAuth.js";
import Container from "../../shared/layout/Container.js";

/**
 * pages: Array of nav items. Each item is one of:
 *
 *  Simple link:
 *    { name, links: [href] }
 *
 *  Simple dropdown (small panel):
 *    { name, links: [activeHref], subpages: [{ name, link, description? }] }
 *
 *  Mega menu (full-width panel):
 *    { name, links: [activeHref], mega: {
 *        columns: [{ heading, items: [{ Icon, label, desc, href }] }],
 *        cta?: { eyebrow, title, href, label }
 *      }
 *    }
 */
export default function Navbar({ pages = [], logoAlt = "Logo" }) {
  const { user, isAuthenticated } = useAuth();
  const {
    currencies = [],
    selectedCurrency: currency,
    setCurrency,
  } = useCurrency();
  const pathname = usePathname();

  const [megaOpen, setMegaOpen] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileOpenIndex, setMobileOpenIndex] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const megaTimer = useRef(null);
  const dropTimer = useRef(null);

  function openMega(i) {
    clearTimeout(megaTimer.current);
    setMegaOpen(i);
  }
  function closeMega() {
    megaTimer.current = setTimeout(() => setMegaOpen(null), 120);
  }
  function openDrop(i) {
    clearTimeout(dropTimer.current);
    setDropdownOpen(i);
  }
  function closeDrop() {
    dropTimer.current = setTimeout(() => setDropdownOpen(null), 120);
  }

  return (
    <header className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-50">
      <Container className="h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo.webp"
            alt={logoAlt}
            title={logoAlt}
            width={90}
            height={30}
            priority
            className="h-7 w-auto object-contain"
            style={{ height: "auto" }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-600 flex-1">
          {pages.map((page, i) => {
            const isActive = page.links?.some(
              (l) => l === pathname || (l !== "/" && pathname?.startsWith(l)),
            );
            const isMegaItem = !!page.mega;
            const isDropItem = !!page.subpages;

            return (
              <div
                key={i}
                onMouseEnter={() => {
                  if (isMegaItem) openMega(i);
                  else if (isDropItem) openDrop(i);
                }}
                onMouseLeave={() => {
                  if (isMegaItem) closeMega();
                  else if (isDropItem) closeDrop();
                }}
              >
                <Link
                  href={page.links?.[0] ?? "#"}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-primary-700 bg-primary-50"
                      : "hover:text-primary-700 hover:bg-gray-50"
                  }`}
                >
                  {page.name}
                  {(isMegaItem || isDropItem) && (
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${
                        (isMegaItem && megaOpen === i) ||
                        (isDropItem && dropdownOpen === i)
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  )}
                </Link>

                {/* Mega panel */}
                {isMegaItem && megaOpen === i && (
                  <div
                    onMouseEnter={() => openMega(i)}
                    onMouseLeave={closeMega}
                    className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-2xl"
                  >
                    <Container className="py-6 flex gap-6">
                      {page.mega.columns.map((col, ci) => (
                        <div key={ci} className="flex-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                            {col.heading}
                          </p>
                          <ul className="flex flex-col gap-1">
                            {col.items.map(({ Icon, label, desc, href }) => (
                              <li key={label}>
                                <Link
                                  href={href}
                                  onClick={() => setMegaOpen(null)}
                                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary-50 group transition-colors"
                                >
                                  {Icon && (
                                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                                      <Icon
                                        size={15}
                                        className="text-primary-700"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm leading-none mb-0.5">
                                      {label}
                                    </p>
                                    {desc && (
                                      <p className="text-xs text-gray-400">
                                        {desc}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {page.mega.cta && (
                        <div className="w-56 shrink-0 flex flex-col">
                          <div className="mt-auto bg-linear-to-br from-primary-700 to-accent-500 rounded-xl p-4 text-white">
                            <p className="text-xs font-bold uppercase tracking-wide text-primary-200 mb-1">
                              {page.mega.cta.eyebrow}
                            </p>
                            <p className="font-bold text-sm mb-3">
                              {page.mega.cta.title}
                            </p>
                            <Link
                              href={page.mega.cta.href}
                              onClick={() => setMegaOpen(null)}
                              className="inline-flex items-center gap-1.5 bg-white text-primary-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                            >
                              {page.mega.cta.label} <ArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      )}
                    </Container>
                  </div>
                )}

                {/* Simple dropdown */}
                {isDropItem && dropdownOpen === i && (
                  <div
                    onMouseEnter={() => openDrop(i)}
                    onMouseLeave={closeDrop}
                    className="absolute top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 w-72 p-2"
                  >
                    {page.subpages.map((sub, j) => (
                      <Link
                        key={j}
                        href={sub.link}
                        onClick={() => setDropdownOpen(null)}
                        className="group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0 mt-[7px]" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700 transition-colors leading-snug">
                            {sub.name}
                          </p>
                          {sub.description && (
                            <p className="text-xs font-light text-gray-400 mt-0.5 leading-5">
                              {sub.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right side: currency + auth + hamburger */}
        <div className="flex items-center gap-2">
          {/* Currency picker */}
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
                        onClick={() => {
                          setCurrency(c);
                          setCurrencyOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          currency?.code === c.code
                            ? "bg-primary-50 text-primary-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
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

          {/* User menu / Login */}
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
                          } catch {
                            void 0;
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
              className="hidden lg:inline-flex bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              Login
            </Link>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-0 bottom-0 z-40 bg-white overflow-y-auto py-6">
          <Container className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          <div className="flex items-center justify-between py-3 mb-1 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Menu
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          {pages.map((page, i) => {
            const allSubpages = page.mega
              ? page.mega.columns.flatMap((col) =>
                  col.items.map((item) => ({
                    name: item.label,
                    link: item.href,
                  })),
                )
              : (page.subpages ?? null);

            return (
              <div key={i}>
                {allSubpages ? (
                  <>
                    <button
                      onClick={() =>
                        setMobileOpenIndex((p) => (p === i ? null : i))
                      }
                      className="flex items-center justify-between w-full py-3 border-b border-gray-100"
                    >
                      <span className="font-semibold">{page.name}</span>
                      <ChevronRight
                        size={16}
                        className={`text-gray-400 transition-transform ${mobileOpenIndex === i ? "rotate-90" : ""}`}
                      />
                    </button>
                    {mobileOpenIndex === i && (
                      <div className="pl-2 flex flex-col gap-1 py-2">
                        {allSubpages.map((sub, j) => (
                          <Link
                            key={j}
                            href={sub.link}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2.5 text-gray-600 hover:text-primary-700 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={page.links?.[0] ?? "#"}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 border-b border-gray-100 hover:text-primary-700 transition-colors"
                  >
                    {page.name}
                  </Link>
                )}
              </div>
            );
          })}

          {isAuthenticated ? (
            <>
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="py-3 border-b border-gray-100 hover:text-primary-700 transition-colors flex items-center gap-2"
              >
                <User size={14} className="text-gray-400" /> My Account
              </Link>
              <button
                onClick={async () => {
                  setMobileOpen(false);
                  try {
                    await logoutUserSessionApi();
                  } catch {
                    void 0;
                  }
                  await signOut({ callbackUrl: "/" });
                }}
                className="py-3 text-left text-red-600 hover:text-red-700 transition-colors flex items-center gap-2"
              >
                <LogOut size={14} /> Sign out
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
                  onClick={() => {
                    setCurrency(c);
                    setMobileOpen(false);
                  }}
                  className={`flex flex-col items-center py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    currency?.code === c.code
                      ? "border-primary-400 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-600 hover:border-primary-200"
                  }`}
                >
                  <span>{c.code}</span>
                </button>
              ))}
            </div>
          </div>
          </Container>
        </div>
      )}
    </header>
  );
}
