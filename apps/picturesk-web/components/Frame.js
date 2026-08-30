// A single portfolio frame: renders the image when a URL is present, otherwise a
// tasteful labelled placeholder so the layout holds until real R2 URLs are added
// to data/samples.js. One place to change how every sample slot looks.
export default function Frame({ src, alt = '', className = '' }) {
  return (
    <div className={`frame${src ? '' : ' frame--empty'}${className ? ` ${className}` : ''}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <span className="frame__ph">Sample</span>
      )}
    </div>
  );
}
