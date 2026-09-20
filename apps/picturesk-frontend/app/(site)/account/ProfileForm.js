'use client';

import { useState } from 'react';
import { AGE_RANGES, GENDERS, RACES, FACIAL_HAIR, BUILDS, HEIGHTS } from '@travel-suite/picturesk-shared/catalog';
import { ChoiceRow } from '../../../components/funnel/controls';

// The saved About and Build answers, editable. Same chips as the funnel, one save.
export default function ProfileForm({ initial }) {
  const [p, setP] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const set = (key) => (v) => {
    setNote('');
    setP((prev) => {
      const next = { ...prev, [key]: v };
      if (key === 'gender' && v === 'woman') next.facialHair = '';
      return next;
    });
  };

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNote('');
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setError(body.error || 'Could not save. Please try again.');
      else setNote('Saved. Your next set starts with these answers.');
    } catch {
      setError('Could not save. Please try again.');
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit}>
      <p className="gen-fieldlabel">Gender</p>
      <ChoiceRow items={GENDERS} value={p.gender} onSelect={set('gender')} />
      <p className="gen-fieldlabel">Age range</p>
      <ChoiceRow items={AGE_RANGES} value={p.ageRange} onSelect={set('ageRange')} />
      <p className="gen-fieldlabel">
        Race <span className="gen-optional">optional</span>
      </p>
      <ChoiceRow items={RACES} value={p.race} onSelect={set('race')} allowClear />
      {p.gender !== 'woman' && (
        <>
          <p className="gen-fieldlabel">
            Facial hair <span className="gen-optional">optional</span>
          </p>
          <ChoiceRow items={FACIAL_HAIR} value={p.facialHair} onSelect={set('facialHair')} allowClear />
        </>
      )}
      <p className="gen-fieldlabel">Estimated height</p>
      <ChoiceRow items={HEIGHTS} value={p.height} onSelect={set('height')} />
      <p className="gen-fieldlabel">Build</p>
      <ChoiceRow items={BUILDS} value={p.build} onSelect={set('build')} />

      <div className="gennav" style={{ justifyContent: 'flex-start' }}>
        <button className="btn btn--primary" type="submit" disabled={busy || !p.gender || !p.ageRange}>
          {busy ? 'Saving' : 'Save'}
        </button>
      </div>
      {note && <p className="formnote formnote--left">{note}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
