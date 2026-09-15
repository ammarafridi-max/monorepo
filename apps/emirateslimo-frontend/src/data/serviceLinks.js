export const serviceLinks = {
  '/dubai-airport-transfer': {
    label: 'Dubai Airport Transfer',
    text: 'Private pickup or drop-off at DXB with flight tracking and 60 minutes of free waiting time.',
  },
  '/dubai-airport-transfer-to-hotel': {
    label: 'Dubai Airport to Hotel Transfer',
    text: 'Meet and greet at arrivals, then a direct chauffeur-driven ride to your hotel anywhere in Dubai.',
  },
  '/abu-dhabi-airport-transfer': {
    label: 'Abu Dhabi Airport Transfer',
    text: 'Pickup or drop-off at Zayed International Airport with a name board and flight monitoring.',
  },
  '/abu-dhabi-airport-to-dubai-transfer': {
    label: 'Abu Dhabi to Dubai Airport Transfer',
    text: 'Timed departures from Abu Dhabi to DXB or DWC in a private luxury vehicle.',
  },
  '/chauffeur-service': {
    label: 'Chauffeur Service Dubai',
    text: 'A private chauffeur and luxury vehicle for business travel, events and city journeys.',
  },
  '/chauffeur-service-abu-dhabi': {
    label: 'Abu Dhabi Chauffeur Service',
    text: 'Professional chauffeurs and premium vehicles across Abu Dhabi, by the hour or full day.',
  },
  '/hourly-chauffeur': {
    label: 'Hourly Chauffeur',
    text: 'Keep your driver and vehicle on standby for as many hours as you need, with unlimited stops.',
  },
  '/car-hire-with-driver-dubai': {
    label: 'Car Hire With Driver',
    text: 'Rent a luxury car with a professional driver for meetings, shopping, sightseeing and more.',
  },
  '/limo-service-dubai': {
    label: 'Limo Service Dubai',
    text: 'Chauffeur-driven limousine hire for business, VIP travel and special occasions in Dubai.',
  },
  '/dubai-transfer': {
    label: 'Dubai Transfer',
    text: 'Private transfers between hotels, business districts and residential areas across Dubai.',
  },
  '/abu-dhabi-to-dubai-transfer': {
    label: 'Abu Dhabi to Dubai Transfer',
    text: 'Door-to-door intercity transfer from Abu Dhabi to Dubai, available around the clock.',
  },
  '/dubai-to-abu-dhabi-transfer': {
    label: 'Dubai to Abu Dhabi Transfer',
    text: 'Door-to-door intercity transfer from Dubai to Abu Dhabi, available around the clock.',
  },
};

export const getServiceLinks = (hrefs = []) =>
  hrefs.filter((href) => serviceLinks[href]).map((href) => ({ href, ...serviceLinks[href] }));
