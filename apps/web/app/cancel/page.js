export default function CancelPage() {
  return (
    <main className="wrap">
      <h1 className="h2">Checkout canceled.</h1>
      <p className="lede muted">
        No charge was made and your photos are still here. You can pick up where you left off.
      </p>
      <p style={{ marginTop: 24 }}>
        <a href="/">Back to your order</a>
      </p>
    </main>
  );
}
