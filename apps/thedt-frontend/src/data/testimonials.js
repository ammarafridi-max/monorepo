export const testimonials = [
  {
    quote:
      'I left my Schengen appointment three days out with no flight booked and no intention of paying for one. Sent the form at midnight, had the reservation before I finished making tea. The VFS officer scanned it, said nothing, moved on. That is exactly what I wanted.',
    name: 'Priya N.',
    location: 'Applied for a Schengen visa from Dubai',
    stars: 5,
  },
  {
    quote:
      'What sold me was being able to pull the PNR up myself before I submitted anything. I checked it, my wife checked it, then we uploaded it. No guessing whether it was real.',
    name: 'Tomasz W.',
    location: 'Sharjah resident, travelling to Poland',
    stars: 5,
  },
  {
    quote:
      'My interview got pushed back by two weeks and I assumed I would have to buy again. One email and they reissued it with the new dates, no charge, no argument. Small thing, but it is the reason I am writing this.',
    name: 'Grace O.',
    location: 'Abu Dhabi, applied for a UK visa',
    stars: 5,
  },
];

export function formatTestimonialsArray(arr, keyword = 'dummy ticket') {
  return arr.map((test) => ({
    ...test,
    quote: test.quote.replace('{keyword}', keyword),
  }));
}
