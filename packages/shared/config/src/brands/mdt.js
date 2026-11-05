const mdt = {
  key: 'mdt',
  name: 'My Dummy Ticket',
  domain: 'mydummyticket.ae',
  cloudinaryFolder: 'mdt',
  currency: 'AED',
  timezone: 'Asia/Dubai',
  locale: 'en-AE',
  emails: {
    from: 'info@mydummyticket.ae',
    support: 'info@mydummyticket.ae',
    noReply: 'info@mydummyticket.ae',
  },
  theme: {
    primaryColor: '#14948f',
    accentColor: '#ff603a',
  },
  seo: {
    titleTemplate: '%s | My Dummy Ticket',
    defaultTitle: 'My Dummy Ticket',
    defaultDescription:
      'Need a dummy ticket for your visa application? Get a verifiable flight reservation with a real PNR, emailed in minutes. Trusted by UAE residents.',
    ogImage: '/og-image.png',
  },
  legal: {
    companyName: 'TRAVL Technologies',
    address: 'Abraj Al Mamzar, Al Mamzar, Dubai, United Arab Emirates',
    postalAddress: {
      streetAddress: 'Abraj Al Mamzar',
      addressLocality: 'Al Mamzar',
      addressRegion: 'Dubai',
      addressCountry: 'AE',
    },
  },
};

export default mdt;
