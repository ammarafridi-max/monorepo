// -- Plan/quote display helpers ------------------------------------------------

export function formatPremium(premium) {
  return Number(premium).toFixed(2);
}

export function parsePlanName(name) {
  const parts = name?.split(' - ');
  return parts?.length >= 2 ? parts.slice(1).join(' - ') : name;
}

export function isSectionHeader(benefit) {
  return benefit.section !== '' && benefit.amount === '';
}

export function getBaseBenefits(benefits) {
  return (benefits ?? []).filter(
    (benefit) => benefit.option === 0 && !isSectionHeader(benefit),
  );
}

export function getSelectedQuote(quotes, schemeId) {
  return (quotes ?? []).find((quote) => quote.scheme_id == schemeId) ?? null;
}

export function createPassenger(type, index, existingPassenger) {
  return {
    id: `${type}-${index + 1}`,
    type,
    title: existingPassenger?.title || 'Mr.',
    firstName: existingPassenger?.firstName || '',
    lastName: existingPassenger?.lastName || '',
    nationality: existingPassenger?.nationality || null,
    dob: existingPassenger?.dob || '',
    passport: existingPassenger?.passport || '',
  };
}

// -- Trip duration -------------------------------------------------------------

export function calcDays(journeyType, startDate, endDate) {
  if (journeyType === 'annual') return 365;
  if (journeyType === 'biennial') return 730;
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);
  if (isNaN(d1) || isNaN(d2) || d2 <= d1) return 7;
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}
