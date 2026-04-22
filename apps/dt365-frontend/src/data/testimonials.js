export const testimonials = [
  {
    title: 'Stress-Free',
    name: 'David S.',
    img: '/david.webp',
    text: 'The process was quick and straightforward. I received my dummy ticket within minutes, and the PNR was fully verifiable on the airline website. It worked exactly as expected for my onward travel requirement.',
    purpose: 'Traveler – Used dummy ticket for onward travel verification',
  },
  {
    title: 'Dependable',
    name: 'Maria K.',
    img: '/maria.webp',
    text: 'I needed proof of onward travel on short notice and this service delivered instantly. The flight itinerary looked professional, the details were accurate, and everything checked out with the airline.',
    purpose: 'Tourist – Used dummy flight itinerary for airline check-in',
  },
  {
    title: 'Super Fast',
    name: 'Ahmed R.',
    img: '/ahmed.webp',
    text: 'Booking was simple and the dummy ticket arrived by email almost immediately. The PNR was valid and easy to verify, which made my travel process stress-free.',
    purpose: 'International Traveler – Used dummy ticket for immigration check',
  },
];

export function formatTestimonialsArray(arr, keyword = 'dummy ticket') {
  const newTestimonials = arr.map(test => {
    const text = test.text.replace('{keyword}', keyword);
    const purpose = test.purpose.replace('{keyword}', keyword);
    return { ...test, text, purpose };
  });

  return newTestimonials;
}
