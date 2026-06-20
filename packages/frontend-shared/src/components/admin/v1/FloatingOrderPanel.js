'use client';

/**
 * FloatingOrderPanel.js
 * -------------------------------------------------------------------
 * Always-on-top order overview for the dummy-ticket admin, built on
 * the Document Picture-in-Picture API. Pops a compact panel out of
 * the order page that floats over the TTS Webagent tab so agents
 * stop tab-switching to copy passenger / locator details.
 *
 * Shared between mdt-frontend and dt365-frontend.
 *
 * Drop-in usage (on the order detail page):
 *
 *   import OrderPiPButton from '@travel-suite/frontend-shared/components/admin/v1/FloatingOrderPanel';
 *
 *   // If the page already has the order in state, pass it in.
 *   // The panel re-renders live whenever that object changes.
 *   <OrderPiPButton order={order} />
 *
 *   // Or let the panel fetch by session id on its own:
 *   <OrderPiPButton sessionId={sessionId} apiBase="/api/admin" />
 *
 * Requires: react >= 18, react-dom >= 18, lucide-react.
 * Browser: Chromium-only (Chrome/Edge/Arc/Brave). Falls back to a
 * disabled button with a tooltip on Firefox/Safari.
 * -------------------------------------------------------------------
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Plane, Pin, X, RefreshCw, ArrowRight } from 'lucide-react';

const isPiPSupported =
  typeof window !== 'undefined' && 'documentPictureInPicture' in window;

/* -------------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------- */

/**
 * Build the Travelport name string: N.{LASTNAME}/{FIRSTNAMES} {TITLE}
 * e.g. ("Phyo", "Ei Ei", "MS") -> "N.PHYO/EI EI MS"
 * Use only if your API does not already return a preformatted value.
 */
export function formatTravelportName(lastName, firstNames, title = '') {
  const last = String(lastName || '').trim().toUpperCase();
  const first = String(firstNames || '').trim().toUpperCase();
  const ttl = String(title || '').trim().replace(/\.+$/, '').toUpperCase();
  return `N.${last}/${first}${ttl ? ' ' + ttl : ''}`;
}

/**
 * Map raw API order data into the shape the panel expects.
 * Adjust the field names on the right to match your backend.
 */
export function normalizeOrder(raw) {
  if (!raw) return null;
  return {
    customerName: raw.customerName ?? raw.name ?? '—',
    status: raw.status ?? [],
    paymentMethod: raw.paymentMethod ?? raw.method ?? '—',
    recordLocator: raw.recordLocator ?? raw.locator ?? '',
    type: raw.type ?? '—',
    validity: raw.validity ?? '—',
    delivery: raw.delivery ?? '—',
    segments: (raw.segments ?? []).map((s) => ({
      date: s.date,
      from: s.from,
      to: s.to,
      flight: s.flight,
    })),
    // Travelport availability commands (rendered above passenger rows).
    // Each entry: { label, value } — e.g. { label: 'AVAILABILITY · DEP', value: 'A24JUNBERSAW' }
    availabilityCommands: (raw.availabilityCommands ?? []).filter((c) => c?.value),
    passengers: (raw.passengers ?? []).map((p) => ({
      name: p.name,
      travelport:
        p.travelport ??
        formatTravelportName(p.lastName, p.firstNames, p.title),
    })),
    // Travelport booking commands run after the name (rendered below passenger rows).
    // Each entry: { label, value } — e.g. { label: 'PHONE / AGENT', value: 'P.T*REF AMMAR' }
    bookingCommands: (raw.bookingCommands ?? []).filter((c) => c?.value),
  };
}

/* -------------------------------------------------------------------
 * PiP styles — injected into the PiP document (it inherits nothing).
 * ----------------------------------------------------------------- */
const PIP_CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#0b0f14;color:#eef1f4;
    -webkit-font-smoothing:antialiased;
  }
  .mdt-pip{padding:10px;}
  .mdt-head{
    display:flex;align-items:center;gap:8px;
    padding:8px 4px 12px;color:#7d8794;font-size:11px;letter-spacing:.04em;
  }
  .mdt-head .sp{margin-left:auto;display:flex;gap:12px;color:#5a6470;cursor:pointer;}
  .mdt-card{
    background:#11161d;border:.5px solid rgba(93,202,165,.28);
    border-radius:12px;overflow:hidden;
  }
  .mdt-name{
    display:flex;align-items:center;justify-content:space-between;
    padding:12px 14px 0;
  }
  .mdt-name b{font-size:15px;font-weight:500;}
  .mdt-pills{display:flex;gap:5px;}
  .mdt-pill{font-size:10px;font-weight:500;padding:2px 8px;border-radius:20px;}
  .mdt-seg{
    margin:10px 14px 0;background:#0d1117;border:.5px solid rgba(255,255,255,.06);
    border-radius:8px;padding:11px 12px;
  }
  .mdt-seg-top{display:flex;align-items:center;justify-content:space-between;}
  .mdt-route{display:flex;align-items:center;gap:9px;}
  .mdt-route .iata{font-size:19px;font-weight:500;}
  .mdt-flight{font-size:13px;font-weight:500;color:#9fe1cb;}
  .mdt-sub{font-size:11px;color:#7d8794;margin-top:3px;}
  .mdt-copy{
    width:calc(100% - 28px);margin:8px 14px 0;display:flex;align-items:center;
    justify-content:space-between;gap:8px;background:#0d1117;
    border:.5px solid rgba(255,255,255,.08);border-radius:8px;padding:9px 12px;
    cursor:pointer;text-align:left;color:inherit;font:inherit;transition:border-color .15s;
  }
  .mdt-copy:hover{border-color:rgba(93,202,165,.5);}
  .mdt-copy.key{border-color:rgba(93,202,165,.4);}
  .mdt-copy .lbl{font-size:10px;color:#7d8794;letter-spacing:.04em;display:block;}
  .mdt-copy .val{font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:2px;display:block;}
  .mdt-copy .ic{display:flex;align-items:center;gap:5px;font-size:11px;color:#5dcaa5;white-space:nowrap;}
  .mdt-meta{display:flex;gap:6px;margin:10px 14px 14px;}
  .mdt-meta div{
    flex:1;background:#0d1117;border-radius:8px;padding:6px 8px;text-align:center;
    font-size:10px;color:#7d8794;
  }
  .mdt-meta div span{display:block;color:#cdd3da;font-size:12px;margin-top:2px;}
  .mdt-foot{padding:0 14px 12px;font-size:10px;color:#5a6470;display:flex;align-items:center;gap:6px;cursor:pointer;}
  .mdt-empty{padding:24px 14px;text-align:center;color:#7d8794;font-size:13px;}
`;

const pillStyle = (text) => {
  const map = {
    PAID:      { bg: '#5dcaa5', fg: '#04342c' },
    PROGRESS:  { bg: '#85b7eb', fg: '#042c53' },
    PENDING:   { bg: '#fac775', fg: '#633806' },
    DELIVERED: { bg: '#97c459', fg: '#173404' },
    REFUNDED:  { bg: '#f09595', fg: '#501313' },
    UNPAID:    { bg: '#5f5e5a', fg: '#ffffff' },
  };
  const c = map[String(text).toUpperCase()] || { bg: '#5f5e5a', fg: '#fff' };
  return { background: c.bg, color: c.fg };
};

/* -------------------------------------------------------------------
 * Copyable row — drops the formatted string straight on the clipboard
 * ----------------------------------------------------------------- */
function CopyRow({ label, value, highlight }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  }, [value]);

  return (
    <button className={`mdt-copy${highlight ? ' key' : ''}`} onClick={onCopy}>
      <span>
        <span className="lbl">{label}</span>
        <span className="val">{value}</span>
      </span>
      <span className="ic" style={{ color: highlight ? '#5dcaa5' : '#7d8794' }}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? 'copied' : 'copy'}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------
 * Panel body — pure presentation, re-renders live as `order` changes
 * ----------------------------------------------------------------- */
function OrderPanel({ order, onRefresh, onClose }) {
  if (!order) return <div className="mdt-empty">No order loaded.</div>;

  const {
    customerName,
    status = [],
    paymentMethod,
    recordLocator,
    type,
    validity,
    delivery,
    segments = [],
    availabilityCommands = [],
    passengers = [],
    bookingCommands = [],
  } = order;

  return (
    <>
      <div className="mdt-head">
        <span>ORDER OVERVIEW</span>
        <span className="sp">
          {onRefresh && (
            <RefreshCw size={14} onClick={onRefresh} aria-label="Refresh" />
          )}
          <Pin size={14} />
          {onClose && (
            <X size={14} onClick={onClose} aria-label="Close" />
          )}
        </span>
      </div>

      <div className="mdt-card">
        <div className="mdt-name">
          <b>{customerName}</b>
          <span className="mdt-pills">
            {status.map((s) => (
              <span key={s} className="mdt-pill" style={pillStyle(s)}>
                {s}
              </span>
            ))}
          </span>
        </div>

        {segments.map((seg, i) => (
          <div className="mdt-seg" key={i}>
            <div className="mdt-seg-top">
              <span className="mdt-route">
                <span className="iata">{seg.from}</span>
                <ArrowRight size={15} color="#5dcaa5" />
                <span className="iata">{seg.to}</span>
              </span>
              <span className="mdt-flight">{seg.flight}</span>
            </div>
            <div className="mdt-sub">
              {seg.date}
              {type ? ` · ${type}` : ''}
            </div>
          </div>
        ))}

        {availabilityCommands.map((c, i) => (
          <CopyRow key={`avail-${i}`} label={c.label} value={c.value} />
        ))}

        {passengers.map((p, i) => (
          <CopyRow
            key={`pax-${i}`}
            label={
              passengers.length > 1
                ? `TRAVELPORT NAME · PAX ${i + 1}`
                : 'TRAVELPORT NAME'
            }
            value={p.travelport}
          />
        ))}

        {bookingCommands.map((c, i) => (
          <CopyRow key={`cmd-${i}`} label={c.label} value={c.value} />
        ))}

        {recordLocator && (
          <CopyRow label="RECORD LOCATOR" value={recordLocator} />
        )}

        <div className="mdt-meta">
          <div>
            Validity<span>{validity}</span>
          </div>
          <div>
            Delivery<span>{delivery}</span>
          </div>
          <div>
            Paid via<span>{paymentMethod}</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------
 * Hook: owns the PiP window lifecycle + style injection
 * ----------------------------------------------------------------- */
function useDocumentPiP({ width = 340, height = 480 } = {}) {
  const [pipWindow, setPipWindow] = useState(null);
  const closingRef = useRef(false);

  const open = useCallback(async () => {
    if (!isPiPSupported || pipWindow) return;
    const win = await window.documentPictureInPicture.requestWindow({
      width,
      height,
    });

    const style = win.document.createElement('style');
    style.textContent = PIP_CSS;
    win.document.head.appendChild(style);

    const root = win.document.createElement('div');
    root.className = 'mdt-pip';
    win.document.body.appendChild(root);
    win.__mdtRoot = root;

    win.addEventListener('pagehide', () => {
      closingRef.current = true;
      setPipWindow(null);
    });

    setPipWindow(win);
  }, [pipWindow, width, height]);

  const close = useCallback(() => {
    if (pipWindow) pipWindow.close();
    setPipWindow(null);
  }, [pipWindow]);

  // close the PiP if the host page unmounts/navigates away
  useEffect(() => {
    return () => {
      if (pipWindow && !closingRef.current) pipWindow.close();
    };
  }, [pipWindow]);

  return { pipWindow, open, close, isSupported: isPiPSupported };
}

/* -------------------------------------------------------------------
 * Public component: the launcher button + the portalled panel
 * ----------------------------------------------------------------- */
export function OrderPiPButton({
  order: orderProp,
  sessionId,
  apiBase = '/api/admin',
  label = 'Pop out overview',
  className,
}) {
  const { pipWindow, open, close, isSupported } = useDocumentPiP();
  const [fetched, setFetched] = useState(null);
  const [, setLoading] = useState(false);

  // self-fetch only when no order is passed in
  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/dummy-tickets/${sessionId}`, {
        credentials: 'include',
      });
      const raw = await res.json();
      setFetched(normalizeOrder(raw));
    } catch (e) {
      console.error('[MDT PiP] order fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId, apiBase]);

  // pull once when the panel opens in fetch mode
  useEffect(() => {
    if (pipWindow && !orderProp && sessionId) refresh();
  }, [pipWindow, orderProp, sessionId, refresh]);

  // re-sync on focus so an edit in the main tab reflects in the panel
  useEffect(() => {
    if (!pipWindow || orderProp || !sessionId) return;
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pipWindow, orderProp, sessionId, refresh]);

  const order = orderProp ? normalizeOrder(orderProp) : fetched;

  if (!isSupported) {
    return (
      <button
        className={className}
        disabled
        title="Floating panel needs a Chromium browser (Chrome, Edge, Arc, Brave)."
      >
        <Plane size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
        {label}
      </button>
    );
  }

  return (
    <>
      <button className={className} onClick={pipWindow ? close : open}>
        <Plane size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
        {pipWindow ? 'Close overview' : label}
      </button>

      {pipWindow &&
        createPortal(
          <OrderPanel
            order={order}
            onRefresh={!orderProp && sessionId ? refresh : undefined}
            onClose={close}
          />,
          pipWindow.__mdtRoot,
        )}
    </>
  );
}

export default OrderPiPButton;
