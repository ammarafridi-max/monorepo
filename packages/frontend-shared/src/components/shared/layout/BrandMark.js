import Image from 'next/image';
import Link from 'next/link';

export default function BrandMark({
  logoSrc,
  logoSrcOnDark,
  brandName,
  logoAlt = '',
  onDark = false,
  size = 34,
  href = '/',
  priority = false,
  className = '',
}) {
  const src = onDark && logoSrcOnDark ? logoSrcOnDark : logoSrc;
  const altText = logoAlt || (typeof brandName === 'string' ? brandName : '');

  return (
    <Link href={href} className={`flex items-center gap-2 no-underline ${className}`}>
      <Image
        src={src}
        alt={altText}
        title={altText}
        width={size}
        height={size}
        priority={priority}
        className="rounded-full object-contain shrink-0"
        style={{ width: size, height: size }}
      />
      <span
        className={`font-outfit font-semibold tracking-tight whitespace-nowrap text-[15px] md:text-base ${
          onDark ? 'text-white' : 'text-primary-700'
        }`}
      >
        {brandName}
      </span>
    </Link>
  );
}
