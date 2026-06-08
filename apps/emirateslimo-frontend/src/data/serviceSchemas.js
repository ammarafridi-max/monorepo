// Airport Transfer Schemas

export const airportTransferSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/dubai-airport-transfer',
  name: 'Dubai Airport Transfer',
  description:
    'Premium Dubai airport transfer service with professional chauffeurs, luxury vehicles, flight tracking, and 60 minutes of complimentary waiting time at the airport.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Dubai, United Arab Emirates',
  },
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceLocation: {
      '@type': 'Place',
      name: 'Dubai International Airport (DXB)',
    },
  },
  serviceType: 'Airport Transfer',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/dubai-airport-transfer',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};

export const dubaiAirportTransferToHotelSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/dubai-airport-transfer-to-hotel',
  name: 'Dubai Airport Transfer to Hotel',
  description:
    'Luxury Dubai airport transfer to hotel with professional chauffeurs, premium vehicles, meet-and-greet service, and on-time pickups.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Dubai, United Arab Emirates',
  },
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceLocation: {
      '@type': 'Place',
      name: 'Dubai International Airport (DXB)',
    },
  },
  serviceType: 'Airport Transfer',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/dubai-airport-transfer-to-hotel',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};

export const abuDhabiAirportTransferSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/abu-dhabi-airport-transfer',
  name: 'Abu Dhabi Airport Transfer',
  description:
    'Premium Abu Dhabi airport transfer service with professional chauffeurs, luxury vehicles, reliable pickups, and comfortable transportation to or from Abu Dhabi International Airport.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Abu Dhabi, United Arab Emirates',
  },
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceLocation: {
      '@type': 'Place',
      name: 'Abu Dhabi International Airport (AUH)',
    },
  },
  serviceType: 'Airport Transfer',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/abu-dhabi-airport-transfer',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};

export const abuDhabiToDubaiAirportTransferSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/abu-dhabi-airport-to-dubai-transfer',
  name: 'Abu Dhabi to Dubai Airport Transfer',
  alternateName: 'Airport Transfer Abu Dhabi to Dubai',
  description:
    'Luxury Abu Dhabi to Dubai Airport transfer with professional chauffeurs, premium vehicles, and reliable on-time service. Perfect for departures to Dubai International Airport (DXB) and Al Maktoum International Airport (DWC).',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: [
    {
      '@type': 'AdministrativeArea',
      name: 'Abu Dhabi, United Arab Emirates',
    },
    {
      '@type': 'AdministrativeArea',
      name: 'Dubai, United Arab Emirates',
    },
  ],
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceLocation: {
      '@type': 'Place',
      name: 'Dubai International Airport (DXB) & Al Maktoum International Airport (DWC)',
    },
  },
  serviceType: 'Airport Transfer',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/abu-dhabi-airport-to-dubai-transfer',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};

// Chauffeur Schemas

export const chauffeurSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/chauffeur-service',
  name: 'Chauffeur Hire Dubai | Luxury Chauffeur Service',
  alternateName: 'Luxury Chauffeur Services Dubai',
  description:
    'Chauffeur hire in Dubai with luxury vehicles and professional drivers. Premium chauffeur service in Dubai for business travel, events, city rides, airport transfers, and VIP transportation across the UAE.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Dubai, United Arab Emirates',
  },
  serviceType: 'Chauffeur Hire Dubai',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/chauffeur-service',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};

export const hourlyChauffeurSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/hourly-chauffeur',
  name: 'Hourly Chauffeur Service Dubai',
  description:
    'Premium hourly chauffeur service in Dubai with professional drivers, luxury vehicles, flexible booking, corporate travel, events, city tours, and personalized service across the UAE.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Dubai, United Arab Emirates',
  },
  serviceType: 'Hourly Chauffeur Service',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/hourly-chauffeur',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
  hoursAvailable: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  },
};

export const carHireWithDriverDubaiSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/car-hire-with-driver-dubai',
  name: 'Car Hire With Driver Dubai',
  alternateName: 'Car with Driver for Rent in Dubai',
  description:
    'Car hire with driver in Dubai including luxury Sedans, SUVs, and Vans with professional chauffeurs. Perfect for city travel, business trips, events, hotel transfers, and hourly hire.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Dubai, United Arab Emirates',
  },
  serviceType: 'Car Hire With Driver Dubai',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/car-hire-with-driver-dubai',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};

export const abuDhabiChauffeurSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/chauffeur-service-abu-dhabi',
  name: 'Abu Dhabi Chauffeur Service',
  alternateName: 'Chauffeur Service Abu Dhabi',
  description:
    'Luxury chauffeur service in Abu Dhabi with professional drivers, premium vehicles, hourly hire, corporate travel, intercity transfers, and VIP transportation across the UAE.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Abu Dhabi, United Arab Emirates',
  },
  serviceType: 'Abu Dhabi Chauffeur Service',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/chauffeur-service-abu-dhabi',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};

export const limoServiceDubaiSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/limo-service-dubai',
  name: 'Limo Service Dubai',
  alternateName: 'Dubai Limousine Service',
  description:
    'Luxury limo service in Dubai with premium limousine vehicles, professional chauffeurs, and first-class transport for business travel, events, airport transfers, and VIP journeys across the UAE.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Dubai, United Arab Emirates',
  },
  serviceType: 'Limo Service Dubai',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/limo-service-dubai',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};

// Transfer Schemas

export const dubaiTransferSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/dubai-transfer',
  name: 'Dubai Transfer',
  description:
    'Luxury, private Dubai transfer service available 24/7 with professional chauffeurs, premium vehicles, airport pickups, hotel transfers, and city-to-city transportation across the UAE.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Dubai, United Arab Emirates',
  },
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceLocation: {
      '@type': 'Place',
      name: 'Dubai, UAE',
    },
  },
  serviceType: 'Private Luxury Transfer',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/dubai-transfer',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
  hoursAvailable: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  },
};

export const abuDhabiToDubaiTransferSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/abu-dhabi-to-dubai-transfer',
  name: 'Abu Dhabi to Dubai Transfer',
  description:
    'Private Abu Dhabi to Dubai transfer with professional chauffeurs, premium vehicles, and reliable intercity service.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: [
    {
      '@type': 'AdministrativeArea',
      name: 'Abu Dhabi, United Arab Emirates',
    },
    {
      '@type': 'AdministrativeArea',
      name: 'Dubai, United Arab Emirates',
    },
  ],
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceLocation: {
      '@type': 'Place',
      name: 'Abu Dhabi to Dubai',
    },
  },
  serviceType: 'Intercity Transfer',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/abu-dhabi-to-dubai-transfer',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};

export const dubaiToAbuDhabiTransferSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.emirateslimo.com/dubai-to-abu-dhabi-transfer',
  name: 'Dubai to Abu Dhabi Transfer',
  description:
    'Private Dubai to Abu Dhabi transfer with professional chauffeurs, premium vehicles, and dependable intercity service.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Emirates Limo',
    url: 'https://www.emirateslimo.com',
    telephone: '+971569964924',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Block, Abraj Al Mamzar',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
  },
  areaServed: [
    {
      '@type': 'AdministrativeArea',
      name: 'Dubai, United Arab Emirates',
    },
    {
      '@type': 'AdministrativeArea',
      name: 'Abu Dhabi, United Arab Emirates',
    },
  ],
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceLocation: {
      '@type': 'Place',
      name: 'Dubai to Abu Dhabi',
    },
  },
  serviceType: 'Intercity Transfer',
  offers: {
    '@type': 'Offer',
    url: 'https://www.emirateslimo.com/dubai-to-abu-dhabi-transfer',
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
  },
};
