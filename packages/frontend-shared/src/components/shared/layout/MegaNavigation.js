"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Container from "./Container";
import Currency from "../flight/Currency";

export default function MegaNavigation({ pages = [], logoAlt = "Logo" }) {
  const pathname = usePathname();

  return (
    <header className="hidden lg:block absolute top-0 left-0 right-0 z-50 bg-transparent">
      <Container>
        <nav className="flex items-center justify-between py-3 font-outfit">
          <div className="w-25 shrink-0">
            <Link href="/" className="block">
              <Image
                src="/logo.webp"
                alt={logoAlt}
                title={logoAlt}
                width={224}
                height={60}
                priority
                className="w-full h-auto object-contain"
                style={{ height: "auto" }}
              />
            </Link>
          </div>

          <div className="flex items-center gap-1 rounded-2xl bg-transparent p-1">
            {pages.map((page, i) => {
              const isActive = page.links.some(
                (l) => l === pathname || (l !== "/" && pathname.startsWith(l)),
              );
              const hasMega = page.subpages?.some((s) => s.description);

              return (
                <div key={i} className="relative group">
                  <Link
                    href={page.links[0]}
                    title={page.name}
                    className={`flex items-center gap-1.5 text-[14px] font-medium py-2 px-3 capitalize transition-all duration-300 rounded-xl ${
                      isActive
                        ? "bg-primary-100 text-primary-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page.icon && <span className="text-sm">{page.icon}</span>}
                    <span>{page.name}</span>
                    {page.subpages && (
                      <ChevronDown size={14} className="opacity-60" />
                    )}
                  </Link>

                  {page.subpages && (
                    <div
                      className={`hidden group-hover:block absolute top-[calc(100%+4px)] left-0 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-50 ${
                        hasMega ? "w-80" : "w-72"
                      } p-2`}
                    >
                      {hasMega ? (
                        <div className="flex flex-col gap-0.5">
                          {page.subpages.map((sub, j) => (
                            <Link
                              key={j}
                              href={sub.link}
                              className="group/item flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0 mt-[7px]" />
                              <div className="min-w-0">
                                <p className="text-[14px] font-semibold text-gray-800 group-hover/item:text-primary-700 transition-colors leading-snug">
                                  {sub.name}
                                </p>
                                {sub.description && (
                                  <p className="text-[12px] font-light text-gray-400 mt-0.5 leading-5">
                                    {sub.description}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        page.subpages.map((sub, j) => (
                          <Link
                            key={j}
                            href={sub.link}
                            className="block text-[14px] font-medium text-gray-600 hover:text-gray-900 px-3 py-2.5 hover:bg-gray-100 rounded-xl"
                          >
                            {sub.name}
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="ml-2 pl-2 border-l">
              <Currency />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
