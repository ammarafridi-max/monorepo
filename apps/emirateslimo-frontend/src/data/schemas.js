export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Emirates Limo',
  alternateName: 'Emirates Limo Dubai',
  url: 'https://www.emirateslimo.com',
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LimousineService',
  '@id': 'https://www.emirateslimo.com/#localbusiness',
  name: 'Emirates Limo',
  url: 'https://www.emirateslimo.com',
  logo: 'https://www.emirateslimo.com/logo-light.webp',
  image: 'https://www.emirateslimo.com/logo-light.webp',
  description: 'Luxury chauffeur and airport transfer services in the UAE.',
  telephone: '+971569964924',
  email: 'contact@emirateslimo.com',
  priceRange: '$$',
  openingHours: ['Mo-Su 00:00-23:59'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'A Block, Abraj Al Mamzar',
    addressLocality: 'Dubai',
    addressRegion: 'Dubai',
    postalCode: '00000', // TODO: Verify and update postalCode with correct Dubai postal code
    addressCountry: 'AE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 25.2842,
    longitude: 55.3311,
  },
  hasMap: 'https://www.google.com/maps/search/Emirates+Limo+Abraj+Al+Mamzar+Dubai',
  sameAs: [
    'https://www.facebook.com/emirateslimo',
    'https://www.instagram.com/emirateslimo',
  ],
  areaServed: [
    {
      '@type': 'City',
      name: 'Dubai',
    },
    {
      '@type': 'City',
      name: 'Abu Dhabi',
    },
    {
      '@type': 'City',
      name: 'Sharjah',
    },
  ],
};
