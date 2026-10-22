import Image from 'next/image';

export default function ProofStrip({ images, caption }) {
  return (
    <section className="proofstrip" aria-label="Recent work">
      <div className="proofstrip__rail">
        {images.map((src) => (
          <div className="proofstrip__shot" key={src}>
            <Image src={src} alt="" width={1024} height={1024} sizes="(max-width: 760px) 44vw, 16vw" />
          </div>
        ))}
      </div>
      {caption && <p className="proofstrip__caption">{caption}</p>}
    </section>
  );
}
