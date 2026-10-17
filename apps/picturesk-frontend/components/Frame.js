import Image from 'next/image';

export default function Frame({
  src,
  alt = '',
  className = '',
  priority = false,
  ratio,
  sizes = '(max-width: 760px) 50vw, 25vw',
  placeholder = 'Sample',
}) {
  const [w, h] = ratio === 'portrait' ? [900, 1200] : [1024, 1024];

  return (
    <div
      className={`frame${src ? '' : ' frame--empty'}${ratio ? ` frame--${ratio}` : ''}${className ? ` ${className}` : ''}`}
    >
      {src ? (
        <Image src={src} alt={alt} width={w} height={h} sizes={sizes} priority={priority} />
      ) : (
        <span className="frame__ph">{placeholder}</span>
      )}
    </div>
  );
}
