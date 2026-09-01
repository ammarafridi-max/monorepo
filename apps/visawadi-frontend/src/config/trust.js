/**
 * Claims the visa detail pages make about the service. Everything here has to
 * be true of every application we file, and verifiable without a statistic.
 *
 * Deliberately no numbers: the previous "500+ visas processed", "98% approval
 * rate" and "3 min response time" had no source in the repo or the CMS.
 */
export const TRUST_ASSURANCES = [
  {
    title: "Every document reviewed",
    caption: "A specialist checks your file against current embassy requirements before it is submitted.",
    icon: "FileCheck",
  },
  {
    title: "Refusals reanalysed",
    caption: "Been refused before? We start from the refusal notice and rebuild the file around the stated grounds.",
    icon: "RotateCcw",
  },
  {
    title: "Support in your language",
    caption: "You are matched with a specialist who speaks your language.",
    icon: "Languages",
  },
  {
    title: "Fees passed through at cost",
    caption: "Embassy and visa-centre charges are shown separately and never marked up.",
    icon: "Receipt",
  },
];

export const TRUST_SUBTITLE =
  "What every application gets, whichever package you choose.";

/** The short strip under the visa page hero. Same rule as above: nothing here
 *  may be a number or a claim we cannot evidence. */
export const HERO_TRUST_ITEMS = [
  { icon: "FileCheck", label: "Every document reviewed" },
  { icon: "RotateCcw", label: "Refusals reanalysed" },
  { icon: "Languages", label: "Support in your language" },
];
