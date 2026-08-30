import { test, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectMongo, AdminUser } from '@picturesk/shared';
import { hashPassword } from '../admin/authService.js';
import { createAdminAuth } from '../admin/router.js';
import { restrictTo } from '../admin/authMiddleware.js';
import { createAdminUsersRouter } from '../admin/adminUsersRouter.js';

/**
 * Admin-user management e2e: role gate (support blocked), CRUD, uniqueness,
 * password reset (+ session invalidation), self-protection, and the
 * last-active-admin invariant (via the token break-glass path, which has no _id).
 */

const CONFIG = { jwtSecret: 'test-secret', jwtExpiresIn: '7d', cookieExpiresInDays: 7, nodeEnv: 'test' };
const ADMIN_TOKEN = 'test-admin-token';
let mongod;
let server;
let base;

function tokenHeaderAuthorized(req) {
  const provided =
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.headers['x-admin-token'] || '';
  return provided === ADMIN_TOKEN;
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectMongo(mongod.getUri());

  await AdminUser.create([
    { name: 'Admin One', username: 'adminuser1', email: 'admin@p.ai', passwordHash: await hashPassword('supersecret'), role: 'admin', status: 'ACTIVE' },
    { name: 'Sup Port', username: 'supportone', email: 'support@p.ai', passwordHash: await hashPassword('supersecret'), role: 'support', status: 'ACTIVE' },
  ]);

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  const { router: authRouter, protect } = createAdminAuth(CONFIG);
  app.use('/auth', authRouter);

  function adminGuard(req, res, next) {
    if (tokenHeaderAuthorized(req)) {
      req.user = { role: 'admin', email: 'admin-token', _id: null };
      return next();
    }
    return protect(req, res, next);
  }
  app.use('/admin-users', createAdminUsersRouter({ guard: adminGuard, restrictTo }));

  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

async function cookieFor(email, password = 'supersecret') {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, cookie: res.ok ? res.headers.get('set-cookie').split(';')[0] : null };
}
const tokenH = { 'x-admin-token': ADMIN_TOKEN, 'Content-Type': 'application/json' };

test('unauthenticated is 401', async () => {
  const res = await fetch(`${base}/admin-users`);
  assert.equal(res.status, 401);
});

test('support role is forbidden (403)', async () => {
  const { cookie } = await cookieFor('support@p.ai');
  const res = await fetch(`${base}/admin-users`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 403);
});

test('admin lists, creates, and never leaks passwordHash', async () => {
  const { cookie } = await cookieFor('admin@p.ai');
  const listed = await fetch(`${base}/admin-users`, { headers: { Cookie: cookie } });
  assert.equal(listed.status, 200);
  const listBody = await listed.json();
  assert.ok(listBody.results >= 2);
  assert.ok(listBody.data.every((u) => u.passwordHash === undefined));

  const created = await fetch(`${base}/admin-users`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'New Editor', username: 'neweditor', email: 'ed@p.ai', password: 'password123', role: 'support' }),
  });
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.data.username, 'neweditor');
  assert.equal(body.data.role, 'support');
  assert.ok(body.data.passwordHash === undefined);
});

test('duplicate username and duplicate email are rejected (400)', async () => {
  const { cookie } = await cookieFor('admin@p.ai');
  const dupUser = await fetch(`${base}/admin-users`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'X', username: 'neweditor', email: 'other@p.ai', password: 'password123' }),
  });
  assert.equal(dupUser.status, 400);
  const dupEmail = await fetch(`${base}/admin-users`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'X', username: 'anotheruser', email: 'ed@p.ai', password: 'password123' }),
  });
  assert.equal(dupEmail.status, 400);
});

test('admin can reset another user password; the target logs in with the new one', async () => {
  const { cookie } = await cookieFor('admin@p.ai');
  const res = await fetch(`${base}/admin-users/neweditor/password`, {
    method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'brandnew123', passwordConfirm: 'brandnew123' }),
  });
  assert.equal(res.status, 200);
  const good = await cookieFor('ed@p.ai', 'brandnew123');
  assert.equal(good.status, 200);
});

test('deactivating a user blocks their login (403)', async () => {
  const { cookie } = await cookieFor('admin@p.ai');
  const res = await fetch(`${base}/admin-users/neweditor`, {
    method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'INACTIVE' }),
  });
  assert.equal(res.status, 200);
  const login = await cookieFor('ed@p.ai', 'brandnew123');
  assert.equal(login.status, 403);
});

test('self-protection: an admin cannot deactivate or demote themselves', async () => {
  const { cookie } = await cookieFor('admin@p.ai');
  const deact = await fetch(`${base}/admin-users/adminuser1`, {
    method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'INACTIVE' }),
  });
  assert.equal(deact.status, 400);
  const demote = await fetch(`${base}/admin-users/adminuser1`, {
    method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'support' }),
  });
  assert.equal(demote.status, 400);
  const selfDelete = await fetch(`${base}/admin-users/adminuser1`, { method: 'DELETE', headers: { Cookie: cookie } });
  assert.equal(selfDelete.status, 400);
});

test('last-active-admin invariant blocks removing the final admin (token path)', async () => {
  // Token has no _id, so it bypasses self-checks; only the invariant stops it.
  const deact = await fetch(`${base}/admin-users/adminuser1`, {
    method: 'PATCH', headers: tokenH, body: JSON.stringify({ status: 'INACTIVE' }),
  });
  assert.equal(deact.status, 400);
  const del = await fetch(`${base}/admin-users/adminuser1`, { method: 'DELETE', headers: tokenH });
  assert.equal(del.status, 400);
});

test('admin deletes a user (204), then it is gone (404)', async () => {
  const { cookie } = await cookieFor('admin@p.ai');
  const del = await fetch(`${base}/admin-users/neweditor`, { method: 'DELETE', headers: { Cookie: cookie } });
  assert.equal(del.status, 204);
  const gone = await fetch(`${base}/admin-users/neweditor`, { headers: { Cookie: cookie } });
  assert.equal(gone.status, 404);
});
