// Shared helpers for verify-reminders.mjs (the only remaining verification script).
//
// NOTHING HERE IS MOCKED. It connects to the real MongoDB in MONGO_URI, the real
// Cloudinary account, and the real Brevo API using the credentials in the
// environment, and composes the domain exactly the way apps/visawadi-backend does.
//
// Trimmed to only what verify-reminders.mjs uses — no HTTP app, no login/cookie
// helpers, no unused sample assets.

import mongoose from 'mongoose';

import { createAuthRouter } from '@travel-suite/auth';
import { createUsersRouter } from '@travel-suite/users';
import { createVisaApplicationsRouter } from '@travel-suite/visa-applications';
import { createCloudinaryStorage } from '@travel-suite/cloudinary';
import { createNotificationsService } from '@travel-suite/notifications';
import { logger } from '@travel-suite/utils';

import { sendEmail as realSendEmail } from '../../src/utils/email.js';

// ---------------------------------------------------------------------------
// env
// ---------------------------------------------------------------------------
export function readEnv() {
  const e = process.env;
  return {
    mongoUri: e.MONGO_URI,
    jwtSecret: e.JWT_SECRET,
    userJwtSecret: e.USER_JWT_SECRET ?? e.JWT_SECRET,
    cloudinary: {
      cloudName: e.CLOUDINARY_CLOUD_NAME,
      apiKey: e.CLOUDINARY_API_KEY,
      apiSecret: e.CLOUDINARY_API_SECRET,
    },
    brevoApiKey: e.BREVO_API_KEY,
    adminEmail: e.ADMIN_EMAIL ?? 'info@visawadi.com',
    backendUrl: e.BACKEND_URL ?? `http://localhost:${e.PORT ?? 3001}`,
    frontendUrl: e.FRONTEND_URL ?? 'http://localhost:3000',
    verifyEmailTo: e.VERIFY_EMAIL_TO,
  };
}

// Fail fast with a clear message if a required var is missing.
export function requireEnv(env, keys) {
  const missing = [];
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), env);
  for (const k of keys) if (!get(k)) missing.push(k);
  if (missing.length) {
    console.log(`FAIL  missing required environment variable(s): ${missing.join(', ')}`);
    console.log('      This script talks to REAL services — it cannot run without credentials.');
    process.exit(2);
  }
}

// ---------------------------------------------------------------------------
// reporting
// ---------------------------------------------------------------------------
export function Reporter(name) {
  let passes = 0;
  let failures = 0;
  const r = {
    pass(msg) { passes += 1; console.log(`PASS  ${msg}`); },
    fail(msg) { failures += 1; console.log(`FAIL  ${msg}`); },
    check(cond, msg) { if (cond) r.pass(msg); else r.fail(msg); return !!cond; },
    critical(cond, msg) { if (cond) r.pass(msg); else r.fail(`CRITICAL: ${msg}`); return !!cond; },
    info(msg) { console.log(`      ${msg}`); },
    get failures() { return failures; },
    summary() { console.log(`\n[${name}] ${passes} passed, ${failures} failed`); return failures; },
  };
  console.log(`\n=== ${name} ===`);
  return r;
}

// ---------------------------------------------------------------------------
// mongo — a fresh, independent connection each call (the concurrency test opens two)
// ---------------------------------------------------------------------------
export async function connect(uri) {
  const conn = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 8000 });
  await conn.asPromise();
  return conn;
}

// Human-readable "where is this pointed" line, with credentials stripped.
export function describeConnection(conn, uri) {
  const db = conn.name || '(unknown db)';
  let host = conn.host ? `${conn.host}${conn.port ? `:${conn.port}` : ''}` : '';
  if (!host) {
    try { host = new URL(uri.replace(/^mongodb(\+srv)?:/, 'http:')).host || '(unknown host)'; }
    catch { host = '(unknown host)'; }
  }
  return `db="${db}" host="${host}"`;
}

// ---------------------------------------------------------------------------
// system composition — identical wiring to apps/visawadi-backend/src/routes/index.js
// ---------------------------------------------------------------------------
export function makeStorage(env) {
  return createCloudinaryStorage({
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    apiSecret: env.cloudinary.apiSecret,
    logger,
    folder: 'visawadi/visa-applications',
  });
}

export function makeNotifications({ sendEmail = realSendEmail, adminEmail } = {}) {
  return createNotificationsService({
    sendEmail,
    logger,
    brand: {
      name: 'VisaWadi',
      teamName: 'VisaWadi Team',
      adminEmail: adminEmail ?? readEnv().adminEmail,
      website: 'https://www.visawadi.com',
      paymentsSenderName: 'VisaWadi Payments',
      deliverySenderName: 'VisaWadi Delivery',
      customerSenderName: 'VisaWadi',
      theme: { primaryColor: '#14948f', accentColor: '#ff603a', linkColor: '#0f3460' },
    },
  });
}

/**
 * Compose auth + users + visa-applications on a given connection, exactly like the
 * production composition root. Returns the models, service, and reminder sweep.
 */
export function buildSystem(conn, { env, storage, notifications }) {
  const { middleware: auth } = createAuthRouter({
    db: conn,
    jwtSecret: env.jwtSecret,
    nodeEnv: 'production',
  });

  const { middleware: userAuth, User } = createUsersRouter({
    db: conn,
    jwtSecret: env.userJwtSecret,
    notifications,
    appBaseUrl: env.frontendUrl,
    apiBaseUrl: env.backendUrl,
  });

  const visa = createVisaApplicationsRouter({
    db: conn,
    auth,
    userAuth,
    User,
    storage,
    notifications,
    apiBaseUrl: env.backendUrl,
    appBaseUrl: env.frontendUrl,
    logger,
  });

  return {
    User,
    VisaApplication: visa.VisaApplication,
    Applicant: visa.Applicant,
    ApplicationDocument: visa.ApplicationDocument,
    DocumentType: visa.DocumentType,
    ChecklistTemplate: visa.ChecklistTemplate,
    service: visa.service,
    runReminderSweep: visa.runReminderSweep,
  };
}

// ---------------------------------------------------------------------------
// real sample file (valid enough for Cloudinary to accept) — used by the Track B
// re-upload step
// ---------------------------------------------------------------------------
export function makeSamplePdf() {
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => { pdf += `${String(off).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

// Run cleanups in reverse, swallowing individual errors so one failure doesn't
// strand the rest.
export async function runCleanups(cleanups) {
  for (const fn of [...cleanups].reverse()) {
    try { await fn(); } catch (err) { console.log(`      (cleanup warning: ${err.message})`); }
  }
}

export const uniqueRef = (tag = 'VERIFY') => `${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
