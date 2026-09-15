import Image from 'next/image';

// A single portfolio frame: renders the image when a URL is present, otherwise a
// tasteful labelled placeholder so the layout holds until real URLs are added.
// One place to change how every sample slot looks.
//
// Rendered through next/image so every frame ships a srcset and the browser picks
// a size for its slot instead of always downloading the 1024px source. `sizes`
// is the slot's rendered width and must be set honestly per use, or the browser
// picks wrong. `priority` marks an above-the-fold frame (the hero cluster): it
// loads eagerly at high fetch priority, because it is the LCP element. `ratio`
// overrides the default square for a frame whose grid cell is not square.
export default function Frame({
  src,
  alt = '',
  className = '',
  priority = false,
  ratio,
  sizes = '(max-width: 760px) 50vw, 25vw',
}) {
  const [w, h] = ratio === 'portrait' ? [900, 1200] : [1024, 1024];

  return (
    <div
      className={`frame${src ? '' : ' frame--empty'}${ratio ? ` frame--${ratio}` : ''}${className ? ` ${className}` : ''}`}
    >
      {src ? (
        <Image src={src} alt={alt} width={w} height={h} sizes={sizes} priority={priority} />
      ) : (
        <span className="frame__ph">Sample</span>
      )}
    </div>
  );
}
