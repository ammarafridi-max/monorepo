'use client';

import { useEffect } from 'react';

// app/global-error.js replaces the root layout, so this renders its own html
// and body and uses inline styles: no stylesheet is guaranteed to be loaded.
export default function GlobalErrorPage({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            padding: '24px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>Something went wrong</p>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
              A critical error occurred. Please refresh the page or contact support.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
