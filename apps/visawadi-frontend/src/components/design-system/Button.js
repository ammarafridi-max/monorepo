import Link from "next/link";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-float hover:bg-brand-700 active:bg-brand-700",
  secondary:
    "border border-line bg-surface text-ink shadow-raised hover:border-ink-faint hover:bg-canvas",
  quiet: "text-ink-body hover:bg-canvas hover:text-ink",
  inverse: "bg-surface text-ink hover:bg-canvas",
};

const SIZES = {
  md: "min-h-11 px-5 text-[0.9375rem]",
  lg: "min-h-14 px-8 text-[1.0625rem]",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60";

export default function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const classes = `${BASE} ${SIZES[size] ?? SIZES.md} ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`;

  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    if (external) {
      return (
        <a href={href} className={classes} {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
