'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Plane, Pin, X, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';
import { paymentStatusConfig } from './paymentStatus';

const isPiPSupported =
  typeof window !== 'undefined' && 'documentPictureInPicture' in window;

export function formatTravelportName(lastName, firstNames, title = '') {
  const last = String(lastName || '').trim().toUpperCase();
  const first = String(firstNames || '').trim().toUpperCase();
  const ttl = String(title || '').trim().replace(/\.+$/, '').toUpperCase();
  return `N.${last}/${first}${ttl ? ' ' + ttl : ''}`;
}

export function normalizeOrder(raw) {
  if (!raw) return null;
  return {
    customerName: raw.customerName ?? raw.name ?? '—',
    message: raw.message ?? '',
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
      stops: s.stops ?? [],
    })),
    availabilityCommands: (raw.availabilityCommands ?? []).filter((c) => c?.value),
    passengers: (raw.passengers ?? []).map((p) => ({
      name: p.name,
      travelport:
        p.travelport ??
        formatTravelportName(p.lastName, p.firstNames, p.title),
    })),
    bookingCommands: (raw.bookingCommands ?? []).filter((c) => c?.value),
  };
}

const PIP_CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#0b0f14;color:#eef1f4;
    -webkit-font-smoothing:antialiased;
  }
  .ordp-pip{padding:10px;}
  .ordp-head{
    display:flex;align-items:center;gap:8px;
    padding:8px 4px 12px;color:#7d8794;font-size:11px;letter-spacing:.04em;
  }
  .ordp-head .sp{margin-left:auto;display:flex;gap:12px;color:#5a6470;cursor:pointer;}
  .ordp-card{
    background:#11161d;border:.5px solid rgba(93,202,165,.28);
    border-radius:12px;overflow:hidden;padding-bottom:12px;
  }
  .ordp-name{
    display:flex;align-items:center;justify-content:space-between;
    padding:12px 14px 0;
  }
  .ordp-name b{font-size:15px;font-weight:500;}
  .ordp-pills{display:flex;gap:5px;}
  .ordp-pill{font-size:10px;font-weight:500;padding:2px 8px;border-radius:20px;}
  .ordp-seg{
    margin:10px 14px 0;background:#0d1117;border:.5px solid rgba(255,255,255,.06);
    border-radius:8px;padding:11px 12px;
  }
  .ordp-seg-top{display:flex;align-items:center;justify-content:space-between;}
  .ordp-route{display:flex;align-items:center;gap:9px;}
  .ordp-route .iata{font-size:19px;font-weight:500;}
  .ordp-flight{font-size:13px;font-weight:500;color:#9fe1cb;}
  .ordp-sub{font-size:11px;color:#7d8794;margin-top:3px;}
  .ordp-copy{
    width:calc(100% - 28px);margin:8px 14px 0;display:flex;align-items:center;
    justify-content:space-between;gap:8px;background:#0d1117;
    border:.5px solid rgba(255,255,255,.08);border-radius:8px;padding:9px 12px;
    cursor:pointer;text-align:left;color:inherit;font:inherit;transition:border-color .15s;
  }
  .ordp-copy:hover{border-color:rgba(93,202,165,.5);}
  .ordp-copy.key{border-color:rgba(93,202,165,.4);}
  .ordp-copy .lbl{font-size:10px;color:#7d8794;letter-spacing:.04em;display:block;}
  .ordp-copy .val{font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:2px;display:block;}
  .ordp-copy .ic{display:flex;align-items:center;gap:5px;font-size:11px;color:#5dcaa5;white-space:nowrap;}
  .ordp-meta{display:flex;gap:6px;margin:10px 14px 14px;}
  .ordp-meta div{
    flex:1;background:#0d1117;border-radius:8px;padding:6px 8px;text-align:center;
    font-size:10px;color:#7d8794;
  }
  .ordp-meta div span{display:block;color:#cdd3da;font-size:12px;margin-top:2px;}
  .ordp-foot{padding:0 14px 12px;font-size:10px;color:#5a6470;display:flex;align-items:center;gap:6px;cursor:pointer;}
  .ordp-empty{padding:24px 14px;text-align:center;color:#7d8794;font-size:13px;}
  .ordp-msg{
    margin:0 0 10px;background:#3a0d0d;border:1px solid #f0595e;
    border-radius:10px;padding:10px 12px;animation:ordp-msg-pulse 1.4s ease-in-out infinite;
  }
  .ordp-msg .ordp-msg-lbl{
    display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;
    letter-spacing:.06em;color:#ff9ea1;text-transform:uppercase;margin-bottom:4px;
  }
  .ordp-msg .ordp-msg-txt{font-size:13px;line-height:1.4;color:#ffe3e4;white-space:pre-wrap;word-break:break-word;}
  @keyframes ordp-msg-pulse{
    0%,100%{box-shadow:0 0 0 0 rgba(240,89,94,.55);}
    50%{box-shadow:0 0 0 4px rgba(240,89,94,0);}
  }
`;

const ORDER_PILL = {
  PROGRESS:  { bg: '#85b7eb', fg: '#042c53' },
  PENDING:   { bg: '#fac775', fg: '#633806' },
  DELIVERED: { bg: '#97c459', fg: '#173404' },
};

const pillStyle = (text) => {
  const key = String(text).toUpperCase();
  const c = ORDER_PILL[key] ?? paymentStatusConfig(key).pill;
  return { background: c.bg, color: c.fg };
};

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
    <button className={`ordp-copy${highlight ? ' key' : ''}`} onClick={onCopy}>
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

function OrderPanel({ order, onRefresh, onClose }) {
  if (!order) return <div className="ordp-empty">No order loaded.</div>;

  const {
    message,
    status = [],
    recordLocator,
    validity,
    delivery,
    segments = [],
    availabilityCommands = [],
    passengers = [],
    bookingCommands = [],
  } = order;

  return (
    <>
      <div className="ordp-head">
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

      {message && (
        <div className="ordp-msg">
          <span className="ordp-msg-lbl">
            <AlertTriangle size={12} />
            Customer message
          </span>
          <div className="ordp-msg-txt">{message}</div>
        </div>
      )}

      <div className="ordp-card">
        <div className="ordp-name">
          <span className="ordp-pills">
            {status.map((s) => (
              <span key={s} className="ordp-pill" style={pillStyle(s)}>
                {s}
              </span>
            ))}
          </span>
        </div>

        {segments.map((seg, i) => (
          <div className="ordp-seg" key={i}>
            <div className="ordp-seg-top">
              <span className="ordp-route">
                <span className="iata">{seg.from}</span>
                <ArrowRight size={15} color="#5dcaa5" />
                <span className="iata">{seg.to}</span>
              </span>
              <span className="ordp-flight">{seg.flight}</span>
            </div>
            <div className="ordp-sub">
              {seg.date}
              {seg.stops?.length ? ` · Stops in ${seg.stops.join(', ')}` : ' · Direct'}
            </div>
          </div>
        ))}

        <div className="ordp-meta">
          <div>
            Validity<span>{validity}</span>
          </div>
          <div>
            Delivery<span>{delivery}</span>
          </div>
        </div>

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
      </div>
    </>
  );
}

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
    root.className = 'ordp-pip';
    win.document.body.appendChild(root);
    win.__orderPanelRoot = root;

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

  useEffect(() => {
    return () => {
      if (pipWindow && !closingRef.current) pipWindow.close();
    };
  }, [pipWindow]);

  return { pipWindow, open, close, isSupported: isPiPSupported };
}

export function FloatingOrderPanel({
  order: orderProp,
  sessionId,
  apiBase = '/api/admin',
  label = 'Pop out overview',
  className,
}) {
  const { pipWindow, open, close, isSupported } = useDocumentPiP();
  const [fetched, setFetched] = useState(null);
  const [, setLoading] = useState(false);

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

  useEffect(() => {
    if (pipWindow && !orderProp && sessionId) refresh();
  }, [pipWindow, orderProp, sessionId, refresh]);

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
          pipWindow.__orderPanelRoot,
        )}
    </>
  );
}

export default FloatingOrderPanel;
