import {
  isValidGender,
  isValidAgeRange,
  isValidRace,
  isValidFacialHair,
  isValidBuild,
} from '@travel-suite/picturesk-shared/catalog';

// The saved profile: the funnel's About and Build answers, validated against the
// catalogue so nothing unknown is stored. Unknown or empty values read as ''.
const FIELDS = {
  gender: isValidGender,
  ageRange: isValidAgeRange,
  race: isValidRace,
  facialHair: isValidFacialHair,
  build: isValidBuild,
};

export const PROFILE_KEYS = Object.keys(FIELDS);

export function cleanProfile(input = {}) {
  const out = {};
  for (const [key, isValid] of Object.entries(FIELDS)) {
    const v = typeof input[key] === 'string' ? input[key] : '';
    out[key] = isValid(v) ? v : '';
  }
  return out;
}

export function profileIsComplete(profile) {
  return Boolean(profile?.gender && profile?.ageRange && profile?.build);
}
