"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Menu, X, User, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useAuth } from "../../../contexts/AuthContextBase.js";
import { logoutUserSessionApi } from "../../../services/apiAuth.js";
import Currency from "../../ui/v2/Currency.js";

export default function MobileNavigation({ pages = [] }) {
  const { user, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      <div className="lg:hidden flex items-center gap-1">
        <Currency className="block" />
        <button
          onClick={() => setOpen((p) => !p)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-x-0 top-0 bottom-0 z-40 bg-white overflow-y-auto py-6">
          <div className="px-4 sm:px-6 flex flex-col gap-1 text-sm font-medium text-gray-700">
            <div className="flex items-center justify-between py-3 mb-1 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Menu
              </span>
              <button
                onClick={() => setOpen(false)}
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
                          setOpenIndex((p) => (p === i ? null : i))
                        }
                        className="flex items-center justify-between w-full py-3 border-b border-gray-100"
                      >
                        <span className="font-semibold">{page.name}</span>
                        <ChevronRight
                          size={16}
                          className={`text-gray-400 transition-transform ${openIndex === i ? "rotate-90" : ""}`}
                        />
                      </button>
                      {openIndex === i && (
                        <div className="pl-2 flex flex-col gap-1 py-2">
                          {allSubpages.map((sub, j) => (
                            <Link
                              key={j}
                              href={sub.link}
                              onClick={() => setOpen(false)}
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
                      onClick={() => setOpen(false)}
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
                  onClick={() => setOpen(false)}
                  className="py-3 border-b border-gray-100 hover:text-primary-700 transition-colors flex items-center gap-2"
                >
                  <User size={14} className="text-gray-400" /> My Account
                </Link>
                <button
                  onClick={async () => {
                    setOpen(false);
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
                onClick={() => setOpen(false)}
                className="py-3 border-b border-gray-100 hover:text-primary-700 transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
