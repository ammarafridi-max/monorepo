const airportrides = {
  key: "airportrides",
  name: "Airport Rides",
  domain: "airportrides.com",
  cloudinaryFolder: "airportrides",
  currency: "USD",
  timezone: "Asia/Dubai",
  locale: "en-US",
  emails: {
    from: "info@airportrides.com",
    support: "info@airportrides.com",
    noReply: "info@airportrides.com",
  },
  theme: {
    primaryColor: "#1e60a6",
    accentColor: "#ff603a",
  },
  features: {
    dummyTickets: true,
    insurance: false, // implemented — pending international supplier integration
    hotelVouchers: false,
  },
  seo: {
    titleTemplate: "%s | Airport Rides",
    defaultTitle: "Airport Rides",
    defaultDescription:
      "Get a verifiable dummy flight ticket for your visa application. Instant delivery. Serving travellers worldwide.",
    ogImage: "/og-image.png",
  },
  legal: {
    companyName: "TRAVL Technologies",
    address: "Abraj Al Mamzar, Al Mamzar, Dubai, United Arab Emirates",
  },
};

export default airportrides;
