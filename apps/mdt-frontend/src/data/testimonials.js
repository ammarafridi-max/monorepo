export const testimonials = [
  {
    quote: 'MDT made my visa process incredibly smooth and totally stress-free. The booking was fast, the ticket looked real, and I had no issues at the embassy. Great service for anyone needing quick and professional travel documents on short notice.',
    name: 'David S.',
    location: 'Traveler from the United States',
    stars: 5,
  },
  {
    quote: 'I was in a rush and MDT delivered exactly what I needed. The process was simple, the service was reliable, and I had my ticket ready in minutes. It saved me a lot of stress when applying for my visa. Definitely using this again in the future.',
    name: 'Maria K.',
    location: 'Tourist from the United Kingdom',
    stars: 5,
  },
  {
    quote: 'The entire experience with MDT was seamless from start to finish. I got my {keyword} within minutes, and it worked perfectly for my Schengen visa. Fast response, clear instructions, and great support — highly recommend to travelers in need.',
    name: 'Ahmed R.',
    location: 'Frequent Flyer from India',
    stars: 5,
  },
];

export function formatTestimonialsArray(arr, keyword = 'dummy ticket') {
  return arr.map((test) => ({
    ...test,
    quote: test.quote.replace('{keyword}', keyword),
  }));
}
