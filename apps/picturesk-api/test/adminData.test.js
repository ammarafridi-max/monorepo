import { test, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectMongo, Order, ORDER_STATES } from '@travel-suite/picturesk-shared';
import { createAdminSubsystem } from '../admin/index.js';
import { createAdminDataRouter } from '../admin/adminData.js';

/**
 * End-to-end Phase B: the read-only admin data routes over an in-memory Mongo,
 * behind the same combined guard the server uses (ADMIN_TOKEN header OR admin
 * cookie session). Verifies auth paths, the list/detail projections, the stats
 * aggregation math, and the customers grouping.
 */

const CONFIG = { jwtSecret: 'test-secret', jwtExpiresIn: '7d', cookieExpiresInDays: 7, nodeEnv: 'test' };
const ADMIN_TOKEN = 'test-admin-token';
let AdminUser;
let mongod;
let server;
let base;
let orderAId;

function adminAuthorized(req) {
  const provided =
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.headers['x-admin-token'] || '';
  return provided === ADMIN_TOKEN;
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectMongo(mongod.getUri());

  const admin = createAdminSubsystem({
    db: mongoose.connection,
    ...CONFIG,
    adminToken: ADMIN_TOKEN,
    isTokenAuthorized: adminAuthorized,
  });
  const { guard: adminGuard, restrictTo } = admin;
  AdminUser = admin.AdminUser;

  await AdminUser.create([
    { name: 'Admin', username: 'adminuser1', email: 'admin@picturesk.ai', password: 'supersecret', role: 'admin', status: 'ACTIVE' },
    { name: 'Support', username: 'supportone', email: 'support@picturesk.ai', password: 'supersecret', role: 'support', status: 'ACTIVE' },
  ]);

  const bobUserId = new mongoose.Types.ObjectId();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const a = await Order.create({ customerEmail: 'alice@x.com', status: ORDER_STATES.DELIVERED, amountPaidCents: 3500, computeCostCents: 500, deliveredAt: new Date(), paidAt: new Date(), uploadedImageUrls: ['https://r2/a1.jpg'], deliveredImageUrls: ['https://cdn/a1.jpg'] });
  await Order.create({ customerEmail: 'alice@x.com', status: ORDER_STATES.DELIVERED, amountPaidCents: 3500, computeCostCents: 700, deliveredAt: new Date(), paidAt: new Date() });
  await Order.create({ customerEmail: 'bob@x.com', status: ORDER_STATES.PAID, amountPaidCents: 3500, computeCostCents: 0, paidAt: twoHoursAgo, userId: bobUserId }); // stuck (PAID 2h)
  await Order.create({ customerEmail: 'carol@x.com', status: ORDER_STATES.AWAITING_PAYMENT }); // fresh, not stuck
  await Order.create({ customerEmail: 'dave@x.com', status: ORDER_STATES.FAILED, amountPaidCents: 3500, computeCostCents: 0, refundedAt: new Date(), failedAt: new Date() });
  orderAId = a._id.toString();

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/auth', admin.authRouter);
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

async function cookieFor(email) {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'supersecret' }),
  });
  assert.equal(res.status, 200);
  return res.headers.get('set-cookie').split(';')[0];
}
const withToken = { 'x-admin-token': ADMIN_TOKEN };

test('list requires auth (no cookie, no token -> 401)', async () => {
  const res = await fetch(`${base}/admin/orders`);
  assert.equal(res.status, 401);
});

test('list works with the ADMIN_TOKEN break-glass header', async () => {
  const res = await fetch(`${base}/admin/orders`, { headers: withToken });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'success');
  assert.equal(body.data.orders.length, 5);
  assert.equal(body.data.stuckCount, 1); // the PAID-2h order
});

test('list works with an admin cookie session', async () => {
  const cookie = await cookieFor('admin@picturesk.ai');
  const res = await fetch(`${base}/admin/orders`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).data.orders.length, 5);
});

test('support (read-only role) can also view the list', async () => {
  const cookie = await cookieFor('support@picturesk.ai');
  const res = await fetch(`${base}/admin/orders`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
});

test('?status filters, and a bogus status is 400', async () => {
  const ok = await fetch(`${base}/admin/orders?status=${ORDER_STATES.DELIVERED}`, { headers: withToken });
  assert.equal((await ok.json()).data.orders.length, 2);
  const bad = await fetch(`${base}/admin/orders?status=BOGUS`, { headers: withToken });
  assert.equal(bad.status, 400);
});

test('detail returns the full projection incl. admin-only fields', async () => {
  const res = await fetch(`${base}/admin/orders/${orderAId}`, { headers: withToken });
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.equal(data.status, ORDER_STATES.DELIVERED);
  assert.equal(data.customerEmail, 'alice@x.com');
  assert.equal(data.marginCents, 3000); // 3500 - 500
  assert.deepEqual(data.uploadedImageUrls, ['https://r2/a1.jpg']);
  assert.deepEqual(data.deliveredImageUrls, ['https://cdn/a1.jpg']);
});

test('detail: unknown-but-valid id is 404, malformed id is 400', async () => {
  const missing = await fetch(`${base}/admin/orders/${new mongoose.Types.ObjectId()}`, { headers: withToken });
  assert.equal(missing.status, 404);
  const malformed = await fetch(`${base}/admin/orders/not-an-object-id`, { headers: withToken });
  assert.equal(malformed.status, 400);
});

test('stats aggregates revenue, cost, margin, counts, and stuck', async () => {
  const res = await fetch(`${base}/admin/stats`, { headers: withToken });
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.equal(data.totalOrders, 5);
  assert.equal(data.byStatus.DELIVERED, 2);
  assert.equal(data.byStatus.PAID, 1);
  assert.equal(data.byStatus.AWAITING_PAYMENT, 1);
  assert.equal(data.byStatus.FAILED, 1);
  assert.equal(data.byStatus.GENERATING, 0);
  assert.equal(data.revenueCents, 14000); // 3500 x 4 paid orders (carol never paid)
  assert.equal(data.computeCostCents, 1200); // 500 + 700
  assert.equal(data.deliveredCount, 2);
  assert.equal(data.deliveredRevenueCents, 7000);
  assert.equal(data.deliveredMarginCents, 5800); // 7000 - 1200
  assert.equal(data.refundedCount, 1);
  assert.equal(data.stuckCount, 1);
});

test('customers groups by email with orders, delivered, spend, account flag', async () => {
  const res = await fetch(`${base}/admin/customers`, { headers: withToken });
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.equal(data.count, 4);
  const byEmail = Object.fromEntries(data.customers.map((c) => [c.email, c]));
  assert.equal(byEmail['alice@x.com'].orders, 2);
  assert.equal(byEmail['alice@x.com'].delivered, 2);
  assert.equal(byEmail['alice@x.com'].totalPaidCents, 7000);
  assert.equal(byEmail['alice@x.com'].hasAccount, false);
  assert.equal(byEmail['bob@x.com'].hasAccount, true); // userId set
  assert.equal(byEmail['carol@x.com'].totalPaidCents, 0);
});
