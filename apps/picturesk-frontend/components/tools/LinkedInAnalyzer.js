'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { measurePhoto } from '../../lib/photoMetrics';
import { presignUploads, putToStorage, gateUploads } from '../../lib/api';
import { writeState } from '../../lib/generator';
import { track } from '../../lib/analytics';

const TOOL = 'linkedin-analyzer';
const PAGE = '/tools/linkedin-photo-analyzer';
const FUNNEL = '/ai-headshot-generator/about?from=analyzer';

function band(score) {
  if (score >= 90) return { label: 'Strong', cls: 'ok' };
  if (score >= 70) return { label: 'Good, one fix', cls: 'ok' };
  if (score >= 50) return { label: 'Holding you back', cls: 'warn' };
  return { label: 'Replace it', cls: 'bad' };
}

function framingWords(m) {
  if (m.faceCount == null) return 'Could not measure the face in this browser; the full analysis covers it.';
  if (m.faceCount === 0) return 'No face found. LinkedIn needs your face, not a logo or a landscape.';
  if (m.faceCount > 1) return 'More than one face. A profile photo is one person.';
  if (m.faceRatio < 0.22) return 'Your face is small in the frame. Crop in or move closer.';
  if (m.faceRatio > 0.6) return 'Very tight. Leave a little air above the head.';
  if (m.eyeLine > 0.5) return 'Your eyes sit low. Crop so they land in the upper third.';
  return 'Face size and position work for the circle crop.';
}

function lightingWords(m) {
  if (m.sharpness < 60) return 'Soft or blurred. Use a sharper original.';
  if (m.brightness < 80) return 'Underexposed. Face a window or a lamp.';
  if (m.brightness > 190) return 'Blown out. Move out of direct light.';
  if (m.contrast < 35) return 'Flat. A little more light on the face would lift it.';
  return 'Exposure and sharpness are fine.';
}

// The tool. Layer one (measurements) is instant and free; layer two (the model)
// runs on request. The circle preview is centred on the face box when we have one.
export default function LinkedInAnalyzer() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [jpeg, setJpeg] = useState('');
  const [result, setResult] = useState(null);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [signinNeeded, setSigninNeeded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    track('tool_view', { tool: TOOL });
  }, []);

  const onFile = useCallback(async (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setError('');
    setResult(null);
    setSigninNeeded(false);
    setFile(f);
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setState('measuring');
    try {
      const { metrics: m, jpegBase64 } = await measurePhoto(f);
      setMetrics(m);
      setJpeg(jpegBase64);
      setState('measured');
      track('tool_scored', { tool: TOOL, framing: m.framingScore ?? -1, lighting: m.lightingScore });
    } catch {
      setError('We could not read that image. Try a JPEG or PNG.');
      setState('idle');
    }
  }, []);

  async function analyze() {
    if (!jpeg || state === 'analyzing') return;
    setState('analyzing');
    setError('');
    try {
      const res = await fetch('/api/tools/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: { data: jpeg, mediaType: 'image/jpeg' }, metrics }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.error === 'signin_required') setSigninNeeded(true);
        else setError(body.error || 'Analysis failed. Please try again.');
        setState('measured');
        return;
      }
      setResult(body.result);
      setState('done');
      track('tool_deep_scored', { tool: TOOL, score: body.result.score });
    } catch {
      setError('Analysis failed. Please try again.');
      setState('measured');
    }
  }

  // Hand the photo into the funnel: upload it the way the Photos step does, run it
  // through the same gate, and seed the headshot funnel with it.
  async function startFunnel() {
    track('tool_cta_click', { tool: TOOL, score: result?.score ?? null });
    try {
      if (file && metrics?.faceCount === 1) {
        const { uploads } = await presignUploads([file]);
        await putToStorage(uploads[0].uploadUrl, file);
        const gated = await gateUploads([uploads[0].publicUrl]);
        const kept = gated?.urls?.[0] || uploads[0].publicUrl;
        writeState({ images: [kept], reuseFromOrderId: '' }, 'headshots');
      }
    } catch {
      /* the funnel works without the seed */
    }
    window.location.href = FUNNEL;
  }

  const overall = result?.score ?? null;
  const b = overall != null ? band(overall) : null;
  const measuredOnly = metrics ? Math.round(((metrics.framingScore ?? 60) + metrics.lightingScore) / 2) : null;

  // Circle preview: LinkedIn's crop is roughly 2.6 face-heights across, centred on the face.
  let circleStyle;
  if (metrics?.box && metrics.width) {
    const canvasW = metrics.width * (1024 / Math.max(metrics.width, metrics.height));
    const size = Math.min(metrics.box.height * 2.6, 1024);
    const scale = 160 / size;
    const cx = metrics.box.x + metrics.box.width / 2;
    const cy = metrics.box.y + metrics.box.height / 2;
    circleStyle = {
      width: `${canvasW * scale}px`,
      maxWidth: 'none',
      transform: `translate(${-(cx - size / 2) * scale}px, ${-(cy - size / 2) * scale}px)`,
    };
  }

  return (
    <div className="tool">
      {!file && (
        <div
          className="dropzone tool__drop"
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFile(e.dataTransfer.files?.[0]);
          }}
        >
          <p className="dropzone__title">Drop your LinkedIn photo here, or click to choose.</p>
          <p className="dropzone__hint">JPEG, PNG or WebP. Measured in your browser, nothing is stored.</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {file && (
        <div className="tool__grid">
          <div className="tool__previews" data-clarity-mask="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="tool__photo" src={url} alt="" />
            <div className="tool__circle-wrap">
              <div className="tool__circle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={circleStyle} />
              </div>
              <span className="tool__circle-label">How LinkedIn shows it</span>
            </div>
            <button type="button" className="linkbtn" onClick={() => inputRef.current?.click()}>
              Try another photo
            </button>
          </div>

          <div className="tool__report">
            {state === 'measuring' && <p className="muted">Measuring…</p>}

            {metrics && (
              <>
                <div className="tool__score">
                  <span className="tool__num">{overall ?? measuredOnly}</span>
                  <span className="tool__of">/100</span>
                  {b ? (
                    <span className={`pill pill--${b.cls}`}>{b.label}</span>
                  ) : (
                    <span className="tool__partial">measured only</span>
                  )}
                </div>
                {result?.verdict && <p className="tool__verdict">{result.verdict}</p>}

                <ul className="tool__rows">
                  <Row label="Framing" score={metrics.framingScore} note={framingWords(metrics)} />
                  <Row label="Lighting" score={metrics.lightingScore} note={lightingWords(metrics)} />
                  <Row label="Background" score={result?.background?.score} note={result?.background?.note} pending={!result} />
                  <Row label="Expression" score={result?.expression?.score} note={result?.expression?.note} pending={!result} />
                  <Row label="Attire" score={result?.attire?.score} note={result?.attire?.note} pending={!result} />
                </ul>

                {!result && state !== 'analyzing' && !signinNeeded && (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={analyze}
                    disabled={metrics.faceCount === 0 || (metrics.faceCount ?? 1) > 1}
                  >
                    Get the full analysis
                  </button>
                )}
                {state === 'analyzing' && (
                  <button type="button" className="btn btn--primary" disabled>
                    Looking at it…
                  </button>
                )}
                {signinNeeded && (
                  <p className="formnote formnote--left">
                    That is three free analyses today.{' '}
                    <a href={`/signup?next=${encodeURIComponent(PAGE)}`}>Create a free account</a> for unlimited, or{' '}
                    <a href={`/login?next=${encodeURIComponent(PAGE)}`}>log in</a>.
                  </p>
                )}
                {error && <p className="error">{error}</p>}

                {result && (
                  <div className="tool__fixes">
                    <p className="tool__h">What would help most</p>
                    <ol>
                      {result.fixes.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ol>
                    {result.strengths?.length > 0 && <p className="muted tool__keep">Keep: {result.strengths.join(' ')}</p>}
                    <div className="tool__cta">
                      <p>
                        <strong>Want all five fixed at once?</strong> Picturesk turns a few selfies into studio headshots,
                        from $9. This photo can be the first one.
                      </p>
                      <button type="button" className="btn btn--primary" onClick={startFunnel}>
                        Get my headshots <span className="btn__price">from $9</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, score, note, pending }) {
  return (
    <li className={`tool__row${pending ? ' tool__row--pending' : ''}`}>
      <span className="tool__row-label">{label}</span>
      <span className="tool__bar">
        <span className="tool__bar-fill" style={{ width: `${score ?? 0}%` }} />
      </span>
      <span className="tool__row-score">{score ?? '·'}</span>
      <span className="tool__row-note">{pending ? 'Needs the full analysis' : note}</span>
    </li>
  );
}
