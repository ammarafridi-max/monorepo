// The Services menu: one group per product, each listing its landing pages. The
// first entry of a group is the product page itself. Footer and nav both read this
// so a new landing page is added once.
export const services = [
  {
    id: 'headshots',
    label: 'Professional Headshots',
    tagline: 'For LinkedIn, CVs and team pages.',
    href: '/ai-headshot-generator',
    pages: [
      { label: 'AI Headshot Generator', href: '/ai-headshot-generator' },
      { label: 'LinkedIn Headshots', href: '/linkedin-headshots' },
      { label: 'Real Estate Agent Headshots', href: '/real-estate-agent-headshots' },
      { label: 'AI Headshots vs Photographer', href: '/ai-headshots-vs-photographer' },
    ],
  },
  {
    id: 'dating',
    label: 'Dating Photos',
    tagline: 'Candid photos for Hinge, Tinder and Bumble.',
    href: '/ai-dating-photos',
    pages: [
      { label: 'AI Dating Photos', href: '/ai-dating-photos' },
      { label: 'Hinge Photos', href: '/hinge-photos' },
      { label: 'Tinder Photos', href: '/tinder-photos' },
      { label: 'Bumble Profile Pictures', href: '/bumble-photos' },
      { label: 'Dating Photos for Men', href: '/dating-profile-photos-for-men' },
      { label: 'AI Dating Photos vs Photographer', href: '/ai-dating-photos-vs-photographer' },
    ],
  },
];
