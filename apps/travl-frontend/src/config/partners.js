/**
 * Outbound brands Travl refers customers to.
 *
 * Travl sells travel insurance and travel itineraries. It does not issue dummy
 * flight tickets or hotel reservations (Dummy Ticket 365 does) and it does not
 * handle visa applications (VisaWadi does). Naming another brand is a
 * deliberate exception to the repo's brand-neutrality rule, so it is confined
 * to this app config and must never move into frontend-shared.
 */

export const DUMMY_TICKET_365 = {
  name: 'Dummy Ticket 365',
  url: 'https://www.dummyticket365.com',
  fromPrice: 'USD 13',
  icon: '/dummyticket365-icon.png',
};

export const VISAWADI = {
  name: 'VisaWadi',
  url: 'https://www.visawadi.com',
  visaHubUrl: 'https://www.visawadi.com/uae',
  fromPrice: 'AED 299',
  icon: '/visawadi-icon.png',
};
