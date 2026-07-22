'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { presignUploads, putToStorage, gateUploads } from '../../../lib/api';
import { faceCheckAvailable } from '../../../lib/quality';
import { readState, writeState } from '../../../lib/generator';

// Guided camera capture (prototype). Instead of hoping the customer uploads good
// photos, we CONTROL the shoot: a short sequence of pose prompts, capturing a clean,
// consistent, multi-angle set the model can actually learn a face from. This is the
// biggest lever on likeness. The captured frames upload to R2 and feed the same
// pipeline as the upload step, so nothing downstream changes.
//
// On-device face detection (the native FaceDetector, same as the upload gate) gates
// auto-capture: it only fires when one face is centered and close enough. Where the
// browser has no FaceDetector, we fall back to manual capture. Pose DIRECTION is not
// verified yet (we trust the prompt) -- that is a follow-up.

const POSES = [
  { key: 'front', label: 'Look straight at the camera', hint: 'Relax, mouth closed.' },
  { key: 'left', label: 'Turn your head slightly left', hint: 'A small turn, eyes on the lens.' },
  { key: 'right', label: 'Turn your head slightly right', hint: 'A small turn the other way.' },
  { key: 'up', label: 'Lift your chin up a little', hint: 'A gentle tilt up.' },
  { key: 'down', label: 'Lower your chin slightly', hint: 'A gentle tilt down.' },
  { key: 'smile', label: 'A soft, natural smile', hint: 'Like greeting someone.' },
];

// How long the face must stay well-positioned before auto-capture fires.
const HOLD_MS = 1000;

const STATUS_TEXT = {
  none: 'Position your face in the frame',
  multiple: 'Only you in the frame, please',
  far: 'Move a little closer',
  offcenter: 'Center your face',
  ok: 'Hold still',
  manual: 'Tap capture when you are ready',
};

/** One detection pass on the live video. Returns null if unavailable/errored. */
async function detectOnVideo(video) {
  if (!faceCheckAvailable() || !video?.videoWidth) return null;
  try {
    // eslint-disable-next-line no-undef
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
    const faces = await detector.detect(video);
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!faces.length) return { faceCount: 0 };
    let best = faces[0];
    let bestArea = 0;
    for (const f of faces) {
      const a = f.boundingBox.width * f.boundingBox.height;
      if (a > bestArea) {
        bestArea = a;
        best = f;
      }
    }
    const b = best.boundingBox;
    const ratio = Math.max(b.width / vw, b.height / vh);
    const offX = Math.abs(b.x + b.width / 2 - vw / 2) / vw;
    const offY = Math.abs(b.y + b.height / 2 - vh / 2) / vh;
    return { faceCount: faces.length, ratio, offX, offY };
  } catch {
    return null; // no/broken detector -> manual capture
  }
}

function statusFrom(d) {
  if (!d) return 'manual';
  if (!d.faceCount) return 'none';
  if (d.faceCount > 1) return 'multiple';
  if (d.ratio < 0.22) return 'far';
  if (d.offX > 0.22 || d.offY > 0.22) return 'offcenter';
  return 'ok';
}

export default function CapturePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState('intro'); // intro | capturing | review | uploading | denied
  const [stepIndex, setStepIndex] = useState(0);
  const [captures, setCaptures] = useState([]); // { key, url, file }
  const [status, setStatus] = useState('none');
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const okSinceRef = useRef(null);
  const lockRef = useRef(false); // guards the async capture from double-firing
  const stepRef = useRef(0);

  useEffect(() => {
    const s = readState();
    if (s.looks.length === 0 || s.attire.length === 0) {
      router.replace('/generator/select');
      return;
    }
    setReady(true);
  }, [router]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Always stop the camera when leaving the page.
  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      okSinceRef.current = null;
      lockRef.current = false;
      stepRef.current = 0;
      setStepIndex(0);
      setCaptures([]);
      // The <video> only renders in the 'capturing' phase, so we attach the stream
      // in an effect below (once the element exists), not here.
      setPhase('capturing');
    } catch {
      setPhase('denied');
    }
  }, []);

  // Attach the live stream once the <video> is mounted (phase === 'capturing').
  useEffect(() => {
    const video = videoRef.current;
    if (phase === 'capturing' && video && streamRef.current && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => {});
    }
  }, [phase]);

  const capture = useCallback(() => {
    if (lockRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const idx = stepRef.current;
    if (!video?.videoWidth || !canvas || idx >= POSES.length) return;
    lockRef.current = true;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          lockRef.current = false;
          return;
        }
        const file = new File([blob], `capture-${POSES[idx].key}-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        setCaptures((prev) => [...prev, { key: POSES[idx].key, url: URL.createObjectURL(blob), file }]);
        okSinceRef.current = null;
        const next = idx + 1;
        stepRef.current = next;
        setStepIndex(next);
        if (next >= POSES.length) {
          stopCamera();
          setPhase('review');
        }
        lockRef.current = false;
      },
      'image/jpeg',
      0.92
    );
  }, [stopCamera]);

  // Live detection + auto-capture loop while capturing.
  useEffect(() => {
    if (phase !== 'capturing') return;
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      const d = await detectOnVideo(videoRef.current);
      if (!alive) return;
      const st = statusFrom(d);
      setStatus(st);
      if (st === 'ok') {
        if (okSinceRef.current == null) okSinceRef.current = Date.now();
        else if (Date.now() - okSinceRef.current >= HOLD_MS) capture();
      } else {
        okSinceRef.current = null;
      }
    };
    const id = setInterval(tick, 300);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [phase, capture]);

  const retakeAll = useCallback(() => {
    captures.forEach((c) => URL.revokeObjectURL(c.url));
    startCamera();
  }, [captures, startCamera]);

  const useThese = useCallback(async () => {
    setError('');
    setPhase('uploading');
    try {
      const files = captures.map((c) => c.file);
      const { uploads } = await presignUploads(files);
      await Promise.all(uploads.map((u, i) => putToStorage(u.uploadUrl, files[i])));
      const existing = readState().images || [];
      const images = [...existing, ...uploads.map((u) => u.publicUrl)];
      writeState({ images });
      // Gate here so the pay button stays fast (results are cached for /checkout).
      setPhase('checking');
      await gateUploads(images);
      router.push('/generator/pay');
    } catch (err) {
      if (err.status === 422) {
        const n = (err.body?.failures || []).length;
        setError(
          `${n || 'Some'} of your photos did not pass our check. Retake and try again.`
        );
        setPhase('review');
        return;
      }
      setError(err.message || 'Upload failed. Please try again.');
      setPhase('review');
    }
  }, [captures, router]);

  if (!ready) return null;

  return (
    <section>
      <p className="eyebrow">Step 2</p>
      <h1 className="h2">Let us take your photos.</h1>

      {phase === 'intro' && (
        <>
          <p className="section__lede">
            We will guide you through a few quick poses so the model gets a clean, complete look at
            your face. Takes about thirty seconds.
          </p>
          <ul className="reqs">
            <li className="reqs__good">
              Hold your phone at eye level, about arm&apos;s length away.
            </li>
            <li className="reqs__good">Find good, even light. Facing a window works well.</li>
            <li className="reqs__bad">Take off glasses and hats, and make sure it is just you.</li>
          </ul>
          <div className="gennav">
            <Link className="btn btn--link" href="/generator/upload">
              Prefer to upload instead
            </Link>
            <button className="btn btn--primary" type="button" onClick={startCamera}>
              Start camera
            </button>
          </div>
        </>
      )}

      {phase === 'denied' && (
        <>
          <p className="section__lede">
            We could not open your camera. Allow camera access and try again, or upload photos
            instead.
          </p>
          <div className="gennav">
            <Link className="btn btn--link" href="/generator/upload">
              Upload instead
            </Link>
            <button className="btn btn--primary" type="button" onClick={startCamera}>
              Try again
            </button>
          </div>
        </>
      )}

      {phase === 'capturing' && (
        <>
          <p className="capture__prompt">{POSES[stepIndex]?.label}</p>
          <p className="capture__hint">{POSES[stepIndex]?.hint}</p>
          {/* data-clarity-mask: this is the LIVE camera feed of the customer's face;
              never record it in Clarity session replay. */}
          <div className="capture__stage" data-clarity-mask="true">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} className="capture__video" autoPlay playsInline muted />
            <div className={`capture__ring capture__ring--${status}`} />
            <p className="capture__status">{STATUS_TEXT[status]}</p>
          </div>
          <div className="capture__dots">
            {POSES.map((p, i) => (
              <span
                key={p.key}
                className={`capture__dot${i < stepIndex ? ' capture__dot--done' : ''}${
                  i === stepIndex ? ' capture__dot--now' : ''
                }`}
              />
            ))}
          </div>
          <div className="gennav">
            <button className="btn btn--link" type="button" onClick={retakeAll}>
              Start over
            </button>
            <button className="btn btn--primary" type="button" onClick={capture}>
              Capture ({stepIndex + 1}/{POSES.length})
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </>
      )}

      {phase === 'review' && (
        <>
          <p className="section__lede">Here is your set. Retake if any look off, then continue.</p>
          {/* data-clarity-mask: captured face photos; keep them out of Clarity replay. */}
          <div className="thumbs" data-clarity-mask="true">
            {captures.map((c, i) => (
              <div className="thumb" key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.url} alt={`capture ${i + 1}`} />
              </div>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <div className="gennav">
            <button className="btn btn--link" type="button" onClick={retakeAll}>
              Retake all
            </button>
            <button className="btn btn--primary" type="button" onClick={useThese}>
              Use these photos
            </button>
          </div>
        </>
      )}

      {phase === 'uploading' && <p className="section__lede">Uploading your photos.</p>}
      {phase === 'checking' && <p className="section__lede">Checking your photos.</p>}

      <canvas ref={canvasRef} hidden />
    </section>
  );
}
