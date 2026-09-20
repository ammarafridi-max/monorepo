'use client';

import { useEffect, useState } from 'react';
import { FiInfo } from 'react-icons/fi';
import { AGE_RANGES, GENDERS, RACES, FACIAL_HAIR, BUILDS, HEIGHTS } from '@travel-suite/picturesk-shared/catalog';
import { readState, writeState } from '../../lib/generator';
import { track, EVENTS } from '../../lib/analytics';
import { funnelPaths } from '../../lib/products';
import { useFunnel, useNextHref } from './FunnelContext';
import { ChoiceRow } from './controls';
import StepNav from './StepNav';

// Step 1: who the person is. Gender, age and build lead every prompt, so all
// three are required; race and facial hair refine it and are optional.
export default function AboutStep({ product }) {
  const paths = funnelPaths(product);
  const nextHref = useNextHref(paths.plan, paths.review);
  const { profile } = useFunnel();
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [race, setRace] = useState('');
  const [facialHair, setFacialHair] = useState('');
  const [build, setBuild] = useState('');
  const [height, setHeight] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Saved answers from the account fill anything the funnel has not asked yet,
    // so a returning customer only confirms; an in-progress edit is never overwritten.
    const s = readState(product);
    const seed = {};
    for (const key of ['gender', 'ageRange', 'race', 'facialHair', 'build', 'height']) {
      if (!s[key] && profile?.[key]) seed[key] = profile[key];
    }
    if (Object.keys(seed).length) writeState(seed, product);
    const v = { ...s, ...seed };
    setGender(v.gender);
    setAgeRange(v.ageRange);
    setRace(v.race);
    setFacialHair(v.facialHair);
    setBuild(v.build);
    setHeight(v.height);
    setReady(true);
    track(EVENTS.SELECT_VIEW, { product, step: 'about' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const set = (key, setter) => (v) => {
    setter(v);
    writeState({ [key]: v }, product);
  };
  const onGender = (v) => {
    set('gender', setGender)(v);
    // Facial hair is hidden for women; clear any beard picked earlier so it does
    // not silently persist into the order.
    if (v === 'woman' && facialHair) set('facialHair', setFacialHair)('');
  };

  const missing = !gender
    ? 'Pick a gender to continue.'
    : !ageRange
      ? 'Pick an age range to continue.'
      : !height
        ? 'Pick your estimated height to continue.'
        : !build
          ? 'Pick the closest build to continue.'
          : '';

  return (
    <section>
      <h1 className="h2">About you.</h1>
      <p className="section__lede">This anchors the model to you. It is used only to generate your photos and stays private.</p>

      <p className="gen-fieldlabel">Gender</p>
      <ChoiceRow items={GENDERS} value={gender} onSelect={onGender} />

      <p className="gen-fieldlabel">Age range</p>
      <ChoiceRow items={AGE_RANGES} value={ageRange} onSelect={set('ageRange', setAgeRange)} />

      <p className="gen-fieldlabel">
        Race <span className="gen-optional">optional</span>
      </p>
      <ChoiceRow items={RACES} value={race} onSelect={set('race', setRace)} allowClear />

      {gender !== 'woman' && (
        <>
          <p className="gen-fieldlabel">
            Facial hair <span className="gen-optional">optional</span>
            <span
              className="info-tip"
              tabIndex={0}
              role="note"
              aria-label="Tell us your current look so your beard stays consistent in the results."
            >
              <FiInfo aria-hidden="true" />
              <span className="info-tip__bubble" role="tooltip">
                Tell us your current look so your beard stays consistent in the results.
              </span>
            </span>
          </p>
          <ChoiceRow items={FACIAL_HAIR} value={facialHair} onSelect={set('facialHair', setFacialHair)} allowClear />
        </>
      )}

      <p className="gen-fieldlabel">Estimated height</p>
      <ChoiceRow items={HEIGHTS} value={height} onSelect={set('height', setHeight)} />

      <p className="gen-fieldlabel">
        Build
        <span
          className="info-tip"
          tabIndex={0}
          role="note"
          aria-label="Photos are wider than a headshot, so the model needs to know roughly how you are built."
        >
          <FiInfo aria-hidden="true" />
          <span className="info-tip__bubble" role="tooltip">
            Height and build together keep the generated body honest to you. Pick the closest.
          </span>
        </span>
      </p>
      <ChoiceRow items={BUILDS} value={build} onSelect={set('build', setBuild)} />

      <StepNav backHref={paths.landing} nextHref={nextHref} canContinue={ready && !missing} missing={ready ? missing : ''} />
    </section>
  );
}
