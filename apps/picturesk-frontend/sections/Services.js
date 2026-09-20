import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

// The services grid: one card per product with who it is for, what you get, the
// price from, the funnel CTA, and the product's landing pages as text links. This
// is the hub's internal-linking engine; each product page gets its exact-match
// anchor from here. Data-driven from data/hub.js so a new service is one entry.
export default function Services({ eyebrow, title, lede, items = [] }) {
  return (
    <section id="services" className="section services-grid">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />
        <ul className="svc-grid">
          {items.map((s) => (
            <li className="svc" key={s.id}>
              <p className="svc__who">{s.who}</p>
              <h3 className="svc__title">
                <a href={s.learn}>{s.title}</a>
              </h3>
              <p className="svc__body">{s.body}</p>
              <div className="svc__actions">
                <a className="btn btn--primary" href={s.href}>
                  Get my {s.id === 'dating' ? 'dating photos' : 'headshots'}{' '}
                  <span className="btn__price">from ${s.from}</span>
                </a>
                <a className="btn btn--link" href={s.learn}>
                  How it works
                </a>
              </div>
              <ul className="svc__links">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
