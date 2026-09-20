'use client';

import { useEffect, useState } from 'react';
import { BUILDS } from '@travel-suite/picturesk-shared/catalog';
import { readState, writeState } from '../../lib/generator';
import { funnelPaths } from '../../lib/products';
import { useFunnel, useNextHref } from './FunnelContext';
import { ChoiceRow } from './controls';
import StepNav from './StepNav';

// Step 2: build. One chip row instead of height and weight; it keeps the
// generated body honest to the person without asking for numbers.
export default function BuildStep({ product }) {
  const paths = funnelPaths(product);
  const nextHref = useNextHref(paths.plan, paths.review);
  const { profile } = useFunnel();
  const [build, setBuild] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readState(product).build;
    const v = stored || profile?.build || '';
    if (!stored && v) writeState({ build: v }, product);
    setBuild(v);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  function onBuild(v) {
    setBuild(v);
    writeState({ build: v }, product);
  }

  return (
    <section>
      <h1 className="h2">Your build.</h1>
      <p className="section__lede">
        Photos are wider than a headshot, so the model needs to know roughly how you are built. Pick the closest.
      </p>

      <p className="gen-fieldlabel">Build</p>
      <ChoiceRow items={BUILDS} value={build} onSelect={onBuild} />

      <StepNav
        backHref={paths.about}
        nextHref={nextHref}
        canContinue={ready && Boolean(build)}
        missing={ready && !build ? 'Pick the closest build to continue.' : ''}
      />
    </section>
  );
}
