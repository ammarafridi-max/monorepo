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
  features: {
    dummyTickets: true,
    insurance: true,
    hotelVouchers: false,
  },
  seo: {
    titleTemplate: '%s | My Dummy Ticket',
    defaultTitle: 'My Dummy Ticket',
    defaultDescription:
      'Get a verifiable dummy flight ticket for your visa application. Instant delivery. Trusted by UAE residents.',
    ogImage: '/og-image.png',
  },
  legal: {
    companyName: 'TRAVL Technologies',
    address: 'Abraj Al Mamzar, Al Mamzar, Dubai, United Arab Emirates',
  },
};

export default mdt;
