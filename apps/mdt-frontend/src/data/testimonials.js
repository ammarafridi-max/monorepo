export const testimonials = [
  {
    title: 'Stress-Free',
    name: 'David S.',
    img: '/david.webp',
    text: 'MDT made my visa process incredibly smooth and totally stress-free. The booking was fast, the ticket looked real, and I had no issues at the embassy. Great service for anyone needing quick and professional travel documents on short notice.',
    purpose: 'Traveler from the United States',
  },
  {
    title: 'Dependable',
    name: 'Maria K.',
    img: '/maria.webp',
    text: 'I was in a rush and MDT delivered exactly what I needed. The process was simple, the service was reliable, and I had my ticket ready in minutes. It saved me a lot of stress when applying for my visa. Definitely using this again in the future.',
    purpose: 'Tourist from the United Kingdom',
  },
  {
    title: 'Super Fast',
    name: 'Ahmed R.',
    img: '/ahmed.webp',
    text: 'The entire experience with MDT was seamless from start to finish. I got my {keyword} within minutes, and it worked perfectly for my Schengen visa. Fast response, clear instructions, and great support — highly recommend to travelers in need.',
    purpose: 'Frequent Flyer from India',
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
