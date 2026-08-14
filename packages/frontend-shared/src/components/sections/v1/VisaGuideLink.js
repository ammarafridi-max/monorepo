"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default function VisaGuideLink({ guide, label }) {
  if (!guide?.slug || guide.status !== "published") return null;

  return (
    <div className="mt-8 flex justify-center">
      <Link
        href={`/blog/${guide.slug}`}
        title={guide.title || label}
        className="group inline-flex items-center gap-2 font-outfit font-semibold text-[14px] text-primary-700 hover:text-primary-800 transition-colors"
      >
        <BookOpen size={15} className="shrink-0" />
        <span className="underline underline-offset-4 decoration-primary-200 group-hover:decoration-primary-500 transition-colors">
          {label}
        </span>
        <ArrowRight
          size={15}
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  );
}
