/**
 * The results showcase (the portfolio) and the hero cluster.
 *
 * Every image here is a REAL delivered headshot, pulled from order
 * 6a65d0c58ec905bea226eb20 and picked by its identity-fidelity score (the higher
 * the score, the more the candidate matches the customer's own selfies). The
 * seven shots below are the top scorers, spread across all six of that order's
 * look-and-outfit combinations so the page does not show the same photo twice.
 *
 * Only add a person here with their permission, and only with their real photos.
 * This section is proof, so an invented entry would undo the point of it.
 *
 * ONE CAVEAT on the before/after pairing: the customer selfies from that order
 * have since been cleared out of R2, so the `before` filmstrip is the same
 * person's real uploads from an earlier order. Same person, same product, a
 * different run. Re-shoot the pairing from one order when a set with live uploads
 * is available.
 */

// The hero cluster: the three highest-scoring shots, one per background, so the
// first screen shows range rather than three versions of the same photo.
export const heroShots = [
  '/work/hero-1.jpg', // greenery, turtleneck, 0.947
  '/work/hero-2.jpg', // library, polo, 0.943
  '/work/hero-3.jpg', // office, polo, 0.941
];

export const samples = [
  {
    name: 'Ammar Afridi',
    role: 'Founder',
    scenario: 'Needed a profile photo that worked everywhere',
    story:
      'Five arm’s-length selfies, none of them meant to be a headshot. The set came back across three backgrounds and two outfits: greenery, a library, and a working office, in a polo and a turtleneck. Twenty-five shots, all recognisably the same person on the same day.',
    used: 'LinkedIn, company about page, conference bio',
    before: ['/work/before-1.jpg', '/work/before-2.jpg', '/work/before-3.jpg'],
    after: ['/work/after-1.jpg', '/work/after-2.jpg', '/work/after-3.jpg', '/work/after-4.jpg'],
  },
];
