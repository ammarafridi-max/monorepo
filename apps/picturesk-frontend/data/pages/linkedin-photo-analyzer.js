/**
 * /tools/linkedin-photo-analyzer
 *
 * The free LinkedIn photo scorer. The tool sits above the fold; the copy below
 * explains what is checked and why, so the page ranks for the question as well
 * as the tool. The handoff is the headshot funnel.
 */
export const linkedinPhotoAnalyzer = {
  meta: {
    // 57 chars / 155 chars
    title: 'Free LinkedIn Photo Analyzer | Score Your Profile Picture',
    description:
      'Upload your LinkedIn photo and get a score out of 100 with specific fixes for framing, lighting, background, expression and attire. Free, nothing stored.',
    canonical: '/tools/linkedin-photo-analyzer',
    breadcrumb: 'LinkedIn Photo Analyzer',
  },

  hero: {
    eyebrow: 'Free tool',
    title: 'Is your LinkedIn photo working?',
    lede: 'Drop in the photo you use now. In a few seconds you get a score out of 100, a preview of how it looks in LinkedIn\'s circle, and the two or three things that would improve it most. Nothing is stored.',
  },

  checks: {
    eyebrow: 'What we check',
    title: 'Five things decide whether a LinkedIn photo works.',
    lede: 'LinkedIn shows your photo small and round. These are the things that survive that crop, or do not.',
    items: [
      {
        title: 'Framing',
        body: 'Your face should fill roughly a third to half of the frame with your eyes in the upper third. Too far away and you vanish in the circle; too close and the crop takes your forehead.',
      },
      {
        title: 'Lighting',
        body: 'Even, soft light on the face. Harsh side light, a window behind you, or a dim room all read as amateur at thumbnail size, and blur is the first thing a recruiter notices.',
      },
      {
        title: 'Background',
        body: 'Plain or softly blurred. A busy room, other people, or a beach say holiday, not hire me.',
      },
      {
        title: 'Expression',
        body: 'Relaxed, eyes open, the face you would make meeting someone you already like. A forced grin and a blank stare both cost you.',
      },
      {
        title: 'Attire',
        body: 'What you would wear to meet a client in your field. It does not have to be a suit; it has to be deliberate.',
      },
    ],
  },

  faq: {
    eyebrow: 'FAQ',
    title: 'LinkedIn photo analyzer, answered.',
    lede: 'The things people ask before they upload.',
    faqs: [
      {
        q: 'How does the LinkedIn photo analyzer score my photo?',
        a: 'Two layers. Your browser measures what can be measured: face size and position, sharpness, brightness and contrast. Then, if you ask for the full analysis, an AI model judges background, expression and attire and writes the fixes. The score out of 100 combines both.',
      },
      {
        q: 'Is my photo stored?',
        a: 'No. The measurements run in your browser. For the full analysis the photo is sent to the model once, scored, and discarded. If you are signed in we keep the score, not the photo.',
      },
      {
        q: 'What is a good LinkedIn photo score?',
        a: '90 and above is a photo nobody would question. 70 to 89 is fine with one clear thing to fix. Under 70 is holding your profile back. Most phone photos land between 45 and 75, so a middling score is normal, not a verdict on you.',
      },
      {
        q: 'Is it free?',
        a: 'Yes. The measurements are free and unlimited. The full AI analysis is free three times a day without an account, and unlimited with a free account.',
      },
      {
        q: 'What if my score is low?',
        a: 'Fix the cheap things first: move closer, face a window, clear the background. If the photo itself is the problem, Picturesk generates a set of studio headshots from a few selfies, from $9, and the photo you just analysed can be the first one.',
      },
    ],
  },
};
