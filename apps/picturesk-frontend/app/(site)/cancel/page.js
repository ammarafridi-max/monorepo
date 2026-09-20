import Container from '../../../components/Container';

export const metadata = { title: 'Checkout canceled. Picturesk.ai', robots: { index: false, follow: false } };

export default function CancelPage() {
  return (
    <main className="page">
      <Container size="narrow">
        <h1 className="h2">Checkout canceled.</h1>
        <p className="lede muted">
          No charge was made and your photos are still here. You can pick up where you left off.
        </p>
        <p style={{ marginTop: 24 }}>
          <a href="/ai-headshot-generator/review">Back to review and pay</a>
        </p>
        <p className="muted" style={{ marginTop: 8 }}>
          Ordering dating photos? <a href="/ai-dating-photos/review">Back to that order</a>.
        </p>
      </Container>
    </main>
  );
}
