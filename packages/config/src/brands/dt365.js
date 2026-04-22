const dt365 = {
  key: 'dt365',
  name: 'Dummy Ticket 365',
  domain: 'dummyticket365.com',
  cloudinaryFolder: 'dt365',
  currency: 'USD',
  timezone: 'Asia/Dubai',
  locale: 'en-US',
  emails: {
    from: 'info@dummyticket365.com',
    support: 'info@dummyticket365.com',
    noReply: 'info@dummyticket365.com',
  },
  theme: {
    primaryColor: '#1e60a6',
    accentColor: '#ff603a',
  },
  features: {
    dummyTickets: true,
    insurance: false, // implemented — pending international supplier integration
    hotelVouchers: false,
  },
  seo: {
    titleTemplate: '%s | Dummy Ticket 365',
    defaultTitle: 'Dummy Ticket 365',
    defaultDescription:
      'Get a verifiable dummy flight ticket for your visa application. Instant delivery. Serving travellers worldwide.',
    ogImage: '/og-image.png',
  },
  legal: {
    companyName: 'TRAVL Technologies',
    address: 'Abraj Al Mamzar, Al Mamzar, Dubai, United Arab Emirates',
  },
};

export default dt365;
