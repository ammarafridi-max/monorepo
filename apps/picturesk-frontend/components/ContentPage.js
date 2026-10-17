import Container from './Container';

export default function ContentPage({ eyebrow, title, updated, lede, children, schema, contactNote = false }) {
  return (
    <main className="content">
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <Container>
        <div className="content__inner">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="content__title">{title}</h1>
          {updated && <p className="content__meta">Last updated {updated}</p>}
          {lede && <p className="content__lede">{lede}</p>}

          <div className="prose">{children}</div>

          {contactNote && (
            <p className="content__note">
              Questions about this page? Visit our <a href="/contact">contact page</a>.
            </p>
          )}
        </div>
      </Container>
    </main>
  );
}
