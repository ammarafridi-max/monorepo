import { formatISODuration } from './dates.js';

export function transformItinerary(itinerary) {
  return {
    duration: formatISODuration(itinerary.duration),
    segments: itinerary.segments.map((segment) => ({
      departure: {
        iataCode: segment.departure.iataCode,
        date: segment.departure.at.split('T')[0],
        time: segment.departure.at.split('T')[1],
      },
      arrival: {
        iataCode: segment.arrival.iataCode,
        date: segment.arrival.at.split('T')[0],
        time: segment.arrival.at.split('T')[1],
      },
      duration: formatISODuration(segment.duration),
      carrierCode: segment.carrierCode,
      flightNumber: segment.number,
      aircraftCode: segment.aircraft?.code,
      airline: {
        name: segment.airlineDetail?.commonName || segment.airlineDetail?.businessName || '',
        logo: segment.airlineDetail?.logo || '',
      },
    })),
  };
}
