'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
              Something went wrong
            </p>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
              A critical error occurred. Please refresh the page or contact support.
            </p>
            <button
              onClick={reset}
              style={{ padding: '10px 24px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
