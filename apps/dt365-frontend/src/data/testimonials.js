export const testimonials = [
  {
    quote: 'The process was quick and straightforward. I received my dummy ticket within minutes, and the PNR was fully verifiable. It worked exactly as expected for my onward travel requirement.',
    name: 'David S.',
    location: 'Traveler – Used dummy ticket for onward travel verification',
    stars: 5,
  },
  {
    quote: 'I needed proof of onward travel on short notice and this service delivered instantly. The flight itinerary looked professional, the details were accurate, and everything checked out with the airline.',
    name: 'Maria K.',
    location: 'Tourist – Used dummy flight itinerary for airline check-in',
    stars: 5,
  },
  {
    quote: 'Booking was simple and the dummy ticket arrived by email almost immediately. The PNR was valid and easy to verify, which made my travel process stress-free.',
    name: 'Ahmed R.',
    location: 'International Traveler – Used dummy ticket for immigration check',
    stars: 5,
  },
];

export function formatTestimonialsArray(arr, keyword = 'dummy ticket') {
  return arr.map((test) => ({
    ...test,
    quote: test.quote.replaceAll('{keyword}', keyword),
  }));
}
