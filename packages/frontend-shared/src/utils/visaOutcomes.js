/**
 * Shared presentation for visa-check outcomes, so the hero card and the full
 * checker page can never drift into describing the same answer differently.
 *
 * Tone is deliberate: a visa-required answer is the one worth selling against,
 * a visa-free answer sells nothing. Pushing a service at someone who does not
 * need one is how a tool like this loses the trust that makes it worth using.
 */
export const OUTCOME_UI = {
  VISA_FREE: {
    label: 'No visa needed',
    tone: 'ok',
    blurb: 'You can travel without applying for a visa in advance.',
  },
  VISA_ON_ARRIVAL: {
    label: 'Visa on arrival',
    tone: 'warn',
    blurb: 'You can get your visa at the border, but check the conditions before you fly.',
  },
  EVISA: {
    label: 'E-visa required',
    tone: 'warn',
    blurb: 'You need to apply online before you travel.',
  },
  ETA: {
    label: 'Travel authorisation required',
    tone: 'warn',
    blurb: 'Not a full visa, but you must be approved online before you board.',
  },
  VISA_REQUIRED: {
    label: 'Visa required',
    tone: 'alert',
    blurb: 'You need to apply and be approved before you travel.',
  },
  UNKNOWN: {
    label: 'We do not have this one yet',
    tone: 'muted',
    blurb: 'We have not verified the rules for this route, so we would rather say nothing than guess.',
  },
};

export const OUTCOME_TONE = {
  ok:    { box: 'border-green-200 bg-green-50', text: 'text-green-800' },
  warn:  { box: 'border-amber-200 bg-amber-50', text: 'text-amber-800' },
  alert: { box: 'border-red-200 bg-red-50',     text: 'text-red-800' },
  muted: { box: 'border-gray-200 bg-gray-50',   text: 'text-gray-600' },
};

/** Outcomes where the traveller has to do something before they fly. */
export const NEEDS_ACTION = ['VISA_REQUIRED', 'EVISA', 'ETA'];

export const outcomeUi = (outcome) => OUTCOME_UI[outcome] ?? OUTCOME_UI.UNKNOWN;

/**
 * A rule with no verification date is seeded starter data that no human has
 * checked yet. Say so rather than presenting it with the same confidence as a
 * verified answer.
 */
export const isUnverified = (result) => Boolean(result) && result.outcome !== 'UNKNOWN' && !result.lastVerifiedAt;
