export default function manifest() {
  return {
    name: 'The Dummy Ticket AE',
    short_name: 'The Dummy Ticket',
    description:
      'Verifiable flight reservations with a live PNR for UAE visa applications, from AED 49.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#053d6c',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
