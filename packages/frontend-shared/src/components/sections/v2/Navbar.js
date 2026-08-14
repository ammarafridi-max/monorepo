"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContextBase.js";
import { logoutUserSessionApi } from "../../../services/apiAuth.js";
import Container from "../../shared/layout/Container.js";
import MobileNavigation from "./MobileNavigation.js";

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
export default function Navbar({
  pages = [],
  // Defaults keep every brand already using this component rendering exactly as
  // before. Width/height only set the intrinsic ratio Next uses to pick a
  // srcset — the rendered size comes from the CSS below — so a brand whose logo
  // is a different shape should pass its real pixel dimensions or the optimizer
  // serves an image sized for the wrong aspect.
  logoSrc = "/logo.webp",
  logoWidth = 90,
  logoHeight = 30,
  logoAlt = "Logo",
  loginHref = "/login",
  signupHref = "/signup",
}) {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const [megaOpen, setMegaOpen] = useState(null);
  const [megaTab, setMegaTab] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const megaTimer = useRef(null);
  const dropTimer = useRef(null);

  function openMega(i) {
    clearTimeout(megaTimer.current);
    // megaTab is shared across menus — a menu with fewer tabs than the last one
    // would otherwise open on an index it doesn't have.
    if (megaOpen !== i) setMegaTab(0);
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
    <header className="absolute top-0 left-0 right-0 bg-white border-b border-gray-100 shadow-sm z-50">
      <Container className="py-5 flex items-center justify-between gap-10">
        <Link href="/" className="h-5 lg:h-7 flex items-center shrink-0">
          <Image
            src={logoSrc}
            alt={logoAlt}
            title={logoAlt}
            width={logoWidth}
            height={logoHeight}
            priority
            className="w-auto object-contain"
            style={{ height: "100%" }}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-600 flex-1">
          {pages.map((page, i) => {
            const isActive = page.links?.some(
              (l) => l === pathname || (l !== "/" && pathname?.startsWith(l)),
            );
            const isMegaItem = !!page.mega;
            const activeMegaTab = isMegaItem
              ? Math.min(megaTab, page.mega.columns.length - 1)
              : 0;
            const isDropItem = !!page.subpages;

            return (
              <div
                key={i}
                onMouseEnter={() => {
                  if (isMegaItem) {
                    openMega(i);
                    setMegaTab(0);
                  } else if (isDropItem) openDrop(i);
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
                    {page.mega.layout === "tabs" ? (
                      /* Tabbed layout (opt-in): heading tabs on the left, the
                         active tab's items in a 4-per-row grid on the right. */
                      <Container className="py-6 flex gap-8">
                        <div className="w-56 shrink-0 flex flex-col gap-1 border-r border-gray-100 pr-4">
                          {page.mega.columns.map((col, ci) => (
                            <button
                              key={ci}
                              type="button"
                              onClick={() => setMegaTab(ci)}
                              onMouseEnter={() => setMegaTab(ci)}
                              className={`flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                activeMegaTab === ci
                                  ? "bg-primary-50 text-primary-700"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {col.heading}
                              <ChevronRight
                                size={15}
                                className={
                                  activeMegaTab === ci
                                    ? "opacity-100"
                                    : "opacity-30"
                                }
                              />
                            </button>
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <ul className="grid grid-cols-4 gap-x-2 gap-y-1">
                            {(
                              page.mega.columns[activeMegaTab]?.items ?? []
                            ).map(({ Icon, flag, label, desc, href }) => (
                              <li key={label}>
                                <Link
                                  href={href}
                                  onClick={() => setMegaOpen(null)}
                                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary-50 group transition-colors"
                                >
                                  {flag ? (
                                    <img
                                      src={`https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@latest/flags/${flag}.svg`}
                                      alt=""
                                      aria-hidden="true"
                                      loading="lazy"
                                      className="w-8 h-8 rounded-full shrink-0 object-cover"
                                    />
                                  ) : Icon ? (
                                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                                      <Icon
                                        size={15}
                                        className="text-primary-700"
                                      />
                                    </div>
                                  ) : null}
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm leading-none mb-0.5">
                                      {label}
                                    </p>
                                    {desc && (
                                      <p className="text-xs text-gray-400 leading-snug">
                                        {desc}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Container>
                    ) : (
                      <Container className="py-6 flex gap-6">
                        {page.mega.columns.map((col, ci) => {
                          // Columns can opt into a wider footprint via `span: 2`,
                          // which doubles the column width and lays its items
                          // out in a 2-per-row grid.
                          const isWide = (col.span ?? 1) === 2;
                          return (
                            <div
                              key={ci}
                              className={isWide ? "flex-2" : "flex-1"}
                            >
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                {col.heading}
                              </p>
                              <ul
                                className={
                                  isWide
                                    ? "grid grid-cols-2 gap-x-2 gap-y-1"
                                    : "flex flex-col gap-1"
                                }
                              >
                                {col.items.map(
                                  ({ Icon, flag, label, desc, href }) => (
                                    <li key={label}>
                                      <Link
                                        href={href}
                                        onClick={() => setMegaOpen(null)}
                                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary-50 group transition-colors"
                                      >
                                        {flag ? (
                                          <img
                                            src={`https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@latest/flags/${flag}.svg`}
                                            alt=""
                                            aria-hidden="true"
                                            loading="lazy"
                                            className="w-8 h-8 rounded-full shrink-0 object-cover"
                                          />
                                        ) : Icon ? (
                                          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                                            <Icon
                                              size={15}
                                              className="text-primary-700"
                                            />
                                          </div>
                                        ) : null}
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
                                  ),
                                )}
                              </ul>
                            </div>
                          );
                        })}

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
                    )}
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

        {/* Right side: auth + mobile nav */}
        <div className="flex items-center gap-2">
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
            <div className="hidden lg:inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
              <User size={16} className="text-primary-700 shrink-0" />
              {signupHref && (
                <>
                  <Link
                    href={signupHref}
                    className="hover:text-primary-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                  <span className="text-gray-300" aria-hidden="true">
                    /
                  </span>
                </>
              )}
              <Link
                href={loginHref}
                className="hover:text-primary-700 transition-colors"
              >
                Log In
              </Link>
            </div>
          )}

          <MobileNavigation pages={pages} />
        </div>
      </Container>
    </header>
  );
}
