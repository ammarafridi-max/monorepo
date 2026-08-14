// Shared helpers for verify-reminders.mjs.
//
// Nothing here is mocked: it uses the real MongoDB, Cloudinary and Brevo
// credentials from the environment.

import mongoose from 'mongoose';

import { createAuthRouter } from '@travel-suite/auth';
import { createUsersRouter } from '@travel-suite/users';
import { createVisaApplicationsRouter } from '@travel-suite/visa-applications';
import { createCloudinaryStorage } from '@travel-suite/cloudinary';
import { createNotificationsService } from '@travel-suite/notifications';
import { logger } from '@travel-suite/utils';

import { sendEmail as realSendEmail } from '../../src/utils/email.js';

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

export function requireDbArg(argv = process.argv.slice(2)) {
  const hit = argv.find((a) => a.startsWith('--db='));
  const name = hit ? hit.slice('--db='.length).trim() : '';
  if (!name) {
    console.log('FAIL  --db=<name> is required. It names the database you INTEND to touch and is checked against the one MONGO_URI actually opens.');
    console.log('      This script writes real records and sends real email. Point it at staging.');
    process.exit(2);
  }
  return name;
}

export async function assertDb(conn, expected) {
  // Wrong-database guard: bail before reading or writing anything if the names disagree.
  if (conn.name !== expected) {
    const actual = conn.name || '(unknown)';
    await conn.close().catch(() => {});
    console.log(`FAIL  Refusing to run: MONGO_URI points at database "${actual}" but --db=${expected} was requested.`);
    process.exit(2);
  }
}

export async function connect(uri) {
  const conn = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 8000 });
  await conn.asPromise();
  return conn;
}

export function describeConnection(conn, uri) {
  const db = conn.name || '(unknown db)';
  let host = conn.host ? `${conn.host}${conn.port ? `:${conn.port}` : ''}` : '';
  if (!host) {
    try { host = new URL(uri.replace(/^mongodb(\+srv)?:/, 'http:')).host || '(unknown host)'; }
    catch { host = '(unknown host)'; }
  }
  return `db="${db}" host="${host}"`;
}

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

export async function runCleanups(cleanups) {
  for (const fn of [...cleanups].reverse()) {
    try { await fn(); } catch (err) { console.log(`      (cleanup warning: ${err.message})`); }
  }
}

export const uniqueRef = (tag = 'VERIFY') => `${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
