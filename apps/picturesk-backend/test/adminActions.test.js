import { test, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectMongo, Order, ORDER_STATES } from '@travel-suite/picturesk-shared';
import { createAdminSubsystem } from '../src/admin/index.js';
import { createAdminActionsRouter } from '../src/admin/adminActions.js';
import { createAdminDataRouter } from '../src/admin/adminData.js';

/**
 * Admin order actions e2e with injected stubs (no real Stripe/BullMQ/email).
 * Also asserts the actions router composes with the data router: a GET read still
 * works and is NOT blocked by the actions router's restrictTo('admin').
 */

const CONFIG = { jwtSecret: 'test-secret', jwtExpiresIn: '7d', cookieExpiresInDays: 7, nodeEnv: 'test' };
let AdminUser;
let admin;
let mongod;
let server;
let base;
let paidId;
let deliveredId;
let unpaidId;

const stripe = { calls: 0, refunds: { create: async () => { stripe.calls++; return { id: 're_1' }; } } };
const queue = { added: [], removed: [], add: async (_n, d) => { queue.added.push(d.orderId); }, remove: async (id) => { queue.removed.push(id); } };
const email = { sent: [], sendDeliveryEmail: async ({ to }) => { email.sent.push(to); } };
// Stub storage: our bucket is the https://r2/ prefix; anything else (e.g. a
// replicate.delivery output) returns null and is skipped.
const storage = {
  deletedKeys: [],
  keyForUrl: (url) => (typeof url === 'string' && url.startsWith('https://r2/') ? url.slice('https://r2/'.length) : null),
  deleteObjects: async (keys) => { storage.deletedKeys.push(...keys); return { deleted: keys.length, failed: 0 }; },
};
const pipelineJobOpts = (orderId) => ({ jobId: orderId });

before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectMongo(mongod.getUri());

  admin = createAdminSubsystem({ db: mongoose.connection, ...CONFIG });
  const { restrictTo } = admin;
  AdminUser = admin.AdminUser;

  await AdminUser.create([
    { name: 'Admin', username: 'adminuser1', email: 'admin@p.ai', password: 'supersecret', role: 'admin', status: 'ACTIVE' },
    { name: 'Support', username: 'supportone', email: 'support@p.ai', password: 'supersecret', role: 'support', status: 'ACTIVE' },
  ]);

  const paid = await Order.create({ customerEmail: 'a@x.com', status: ORDER_STATES.PAID, amountPaidCents: 3500, stripePaymentIntentId: 'pi_123', paidAt: new Date() });
  const delivered = await Order.create({ customerEmail: 'b@x.com', status: ORDER_STATES.DELIVERED, amountPaidCents: 3500, stripePaymentIntentId: 'pi_456', deliveredImageUrls: ['https://cdn/1.jpg'], deliveredAt: new Date() });
  const unpaid = await Order.create({ customerEmail: 'c@x.com', status: ORDER_STATES.AWAITING_PAYMENT });
  paidId = paid._id.toString();
  deliveredId = delivered._id.toString();
  unpaidId = unpaid._id.toString();

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  const adminGuard = admin.guard;
  app.use('/auth', admin.authRouter);
  app.use('/admin', createAdminActionsRouter({ guard: adminGuard, restrictTo, stripe, orderPipeline: queue, pipelineJobOpts, emailClient: email, storage, webBaseUrl: 'http://localhost:3000' }));
  app.use('/admin', createAdminDataRouter({ guard: adminGuard, restrictTo }));
  app.use((err, _req, res, _next) => {
    const statusCode = err.isOperational ? err.statusCode : 500;
    res.status(statusCode).json({ status: err.status || 'error', message: err.message });
  });

  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

async function cookieFor(email_) {
  const res = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email_, password: 'supersecret' }) });
  return res.headers.get('set-cookie').split(';')[0];
}
function post(path, cookie) {
  return fetch(`${base}${path}`, { method: 'POST', headers: cookie ? { Cookie: cookie } : {} });
}

test('actions require an admin (unauthenticated 401, support 403)', async () => {
  assert.equal((await post(`/admin/orders/${paidId}/retry`)).status, 401);
  const support = await cookieFor('support@p.ai');
  assert.equal((await post(`/admin/orders/${paidId}/retry`, support)).status, 403);
});

test('the read router still works alongside the actions router (support can read)', async () => {
  const support = await cookieFor('support@p.ai');
  const res = await fetch(`${base}/admin/orders`, { headers: { Cookie: support } });
  assert.equal(res.status, 200); // NOT blocked by the actions router's restrictTo('admin')
});

test('refund: issues once, stamps refundedAt, then is idempotent (409)', async () => {
  const cookie = await cookieFor('admin@p.ai');
  const before = stripe.calls;
  const res = await post(`/admin/orders/${paidId}/refund`, cookie);
  assert.equal(res.status, 200);
  assert.equal(stripe.calls, before + 1);
  const order = await Order.findById(paidId);
  assert.ok(order.refundedAt);
  const again = await post(`/admin/orders/${paidId}/refund`, cookie);
  assert.equal(again.status, 409); // already refunded, no second Stripe call
  assert.equal(stripe.calls, before + 1);
});

test('refund: an unpaid order has nothing to refund (400)', async () => {
  const cookie = await cookieFor('admin@p.ai');
  const res = await post(`/admin/orders/${unpaidId}/refund`, cookie);
  assert.equal(res.status, 400);
});

test('retry: a paid/in-progress order is re-queued', async () => {
  const cookie = await cookieFor('admin@p.ai');
  const res = await post(`/admin/orders/${paidId}/retry`, cookie);
  assert.equal(res.status, 200);
  assert.ok(queue.added.includes(paidId));
  assert.ok(queue.removed.includes(paidId));
});

test('retry: a delivered (terminal) order cannot be retried (400)', async () => {
  const cookie = await cookieFor('admin@p.ai');
  const res = await post(`/admin/orders/${deliveredId}/retry`, cookie);
  assert.equal(res.status, 400);
});

test('resend-email: a delivered order re-sends and refreshes deliveredEmailSentAt', async () => {
  const cookie = await cookieFor('admin@p.ai');
  const res = await post(`/admin/orders/${deliveredId}/resend-email`, cookie);
  assert.equal(res.status, 200);
  assert.ok(email.sent.includes('b@x.com'));
  const order = await Order.findById(deliveredId);
  assert.ok(order.deliveredEmailSentAt);
});

test('resend-email: a non-delivered order has nothing to email (400)', async () => {
  const cookie = await cookieFor('admin@p.ai');
  const res = await post(`/admin/orders/${paidId}/resend-email`, cookie);
  assert.equal(res.status, 400);
});

test('delete: requires an admin (401 unauth, 403 support)', async () => {
  const order = await Order.create({ customerEmail: 'd@x.com', status: ORDER_STATES.DELIVERED });
  const id = order._id.toString();
  const del = (cookie) => fetch(`${base}/admin/orders/${id}`, { method: 'DELETE', headers: cookie ? { Cookie: cookie } : {} });
  assert.equal((await del()).status, 401);
  const support = await cookieFor('support@p.ai');
  assert.equal((await del(support)).status, 403);
});

test('delete: removes the order, our R2 objects (uploads + training zip), and the job; skips Replicate URLs', async () => {
  const order = await Order.create({
    customerEmail: 'e@x.com',
    status: ORDER_STATES.DELIVERED,
    uploadedImageUrls: ['https://r2/uploads/abc/a.jpg', 'https://r2/uploads/abc/b.jpg'],
    resultImageUrls: ['https://replicate.delivery/x/1.png'],
    deliveredImageUrls: ['https://replicate.delivery/x/1.png'],
  });
  const id = order._id.toString();
  const cookie = await cookieFor('admin@p.ai');

  const res = await fetch(`${base}/admin/orders/${id}`, { method: 'DELETE', headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.deletedObjects, 3); // 2 uploads + training zip

  assert.equal(await Order.findById(id), null); // order gone
  assert.ok(queue.removed.includes(id)); // job removed
  assert.ok(storage.deletedKeys.includes('uploads/abc/a.jpg'));
  assert.ok(storage.deletedKeys.includes('uploads/abc/b.jpg'));
  assert.ok(storage.deletedKeys.includes(`training/${id}.zip`));
  // Replicate-hosted outputs are NOT in our bucket, so never sent to storage delete.
  assert.ok(!storage.deletedKeys.some((k) => k.includes('replicate') || k.includes('1.png')));
});

test('delete: a missing order is 404', async () => {
  const cookie = await cookieFor('admin@p.ai');
  const res = await fetch(`${base}/admin/orders/${new mongoose.Types.ObjectId()}`, { method: 'DELETE', headers: { Cookie: cookie } });
  assert.equal(res.status, 404);
});

test('resend-email: 503 when no email client is configured', async () => {
  // A second mount with emailClient:null to prove the graceful-disabled path.
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/auth', admin.authRouter);
  app.use('/admin', createAdminActionsRouter({ guard: admin.guard, restrictTo: admin.restrictTo, stripe, orderPipeline: queue, pipelineJobOpts, emailClient: null, webBaseUrl: 'http://x' }));
  app.use((err, _req, res, _next) => {
    const statusCode = err.isOperational ? err.statusCode : 500;
    res.status(statusCode).json({ status: err.status || 'error', message: err.message });
  });
  const srv = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const port = srv.address().port;
  const login = await fetch(`http://127.0.0.1:${port}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@p.ai', password: 'supersecret' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const res = await fetch(`http://127.0.0.1:${port}/admin/orders/${deliveredId}/resend-email`, { method: 'POST', headers: { Cookie: cookie } });
  assert.equal(res.status, 503);
  await new Promise((r) => srv.close(r));
});
