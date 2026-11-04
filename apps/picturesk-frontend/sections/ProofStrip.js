import Frame from '../components/Frame';

export default function ProofStrip({ images, caption }) {
  return (
    <section className="proofstrip" aria-label="Recent work">
      <div className="proofstrip__rail">
        {images.map((src) => (
          <Frame
            className="proofstrip__shot"
            src={src}
            sizes="(max-width: 760px) 44vw, 16vw"
            key={src}
          />
        ))}
      </div>
      {caption && <p className="proofstrip__caption">{caption}</p>}
    </section>
  );
}
