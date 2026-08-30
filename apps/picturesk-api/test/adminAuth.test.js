import { test, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createAuthRouter } from '@travel-suite/auth';
import { connectMongo } from '@travel-suite/picturesk-shared';

/**
 * End-to-end admin auth: a real Express app + in-memory Mongo. Exercises the whole
 * flow the way the browser will: login sets the httpOnly cookie, /auth/me reads it,
 * bad credentials and an inactive account are rejected, and role guards work.
 *
 * Auth is the shared @travel-suite/auth domain, so the cookie is `jwt`, the model
 * registers as `admin-user`, and the password field is `password`.
 */

let mongod;
let server;
let base;
let AdminUser;
const CONFIG = { jwtSecret: 'test-secret', jwtExpiresIn: '7d', cookieExpiresInDays: 7, nodeEnv: 'test' };

before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectMongo(mongod.getUri());

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  const built = createAuthRouter({ db: mongoose.connection, ...CONFIG });
  const { protect, restrictTo } = built.middleware;
  AdminUser = built.AdminUser;

  // The pre-save hook hashes `password`, so the plaintext goes in.
  await AdminUser.create({
    name: 'Test Admin',
    username: 'testadmin1',
    email: 'admin@picturesk.ai',
    password: 'supersecret',
    role: 'admin',
    status: 'ACTIVE',
  });

  app.use('/auth', built.router);
  // A stand-in for a protected data route, to prove the returned guards work.
  app.get('/admin/ping', protect, restrictTo('admin'), (req, res) =>
    res.json({ status: 'success', data: { who: req.user.email, role: req.user.role } })
  );
  app.get('/admin/support-only', protect, restrictTo('support'), (req, res) =>
    res.json({ status: 'success' })
  );
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

function login(email, password) {
  return fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

test('login with correct credentials returns 200, the admin, and sets the cookie', async () => {
  const res = await login('admin@picturesk.ai', 'supersecret');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'success');
  assert.equal(body.data.email, 'admin@picturesk.ai');
  assert.equal(body.data.role, 'admin');
  assert.ok(body.data.password === undefined, 'password must never be returned');
  const cookie = res.headers.get('set-cookie');
  assert.match(cookie, /jwt=/);
  assert.match(cookie, /HttpOnly/i);
});

test('login is case-insensitive on email and trims it', async () => {
  const res = await login('  ADMIN@Picturesk.AI ', 'supersecret');
  assert.equal(res.status, 200);
});

test('wrong password returns 401 with a generic message', async () => {
  const res = await login('admin@picturesk.ai', 'nope');
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.message, 'Incorrect email or password');
});

test('unknown email returns the same generic 401 (no account enumeration)', async () => {
  const res = await login('ghost@picturesk.ai', 'whatever');
  assert.equal(res.status, 401);
  assert.equal((await res.json()).message, 'Incorrect email or password');
});

test('/auth/me without a cookie is 401', async () => {
  const res = await fetch(`${base}/auth/me`);
  assert.equal(res.status, 401);
});

test('/auth/me with the login cookie returns the current admin', async () => {
  const loginRes = await login('admin@picturesk.ai', 'supersecret');
  const cookie = loginRes.headers.get('set-cookie').split(';')[0];
  const res = await fetch(`${base}/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).data.email, 'admin@picturesk.ai');
});

test('a protected admin-only route accepts the admin cookie', async () => {
  const loginRes = await login('admin@picturesk.ai', 'supersecret');
  const cookie = loginRes.headers.get('set-cookie').split(';')[0];
  const res = await fetch(`${base}/admin/ping`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).data.role, 'admin');
});

test('restrictTo blocks a role the admin does not have (admin hitting support-only)', async () => {
  const loginRes = await login('admin@picturesk.ai', 'supersecret');
  const cookie = loginRes.headers.get('set-cookie').split(';')[0];
  const res = await fetch(`${base}/admin/support-only`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 403);
});

test('logout clears the cookie', async () => {
  const res = await fetch(`${base}/auth/logout`, { method: 'POST' });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('set-cookie'), /jwt=;/);
});

test('an INACTIVE admin cannot log in (403)', async () => {
  await AdminUser.updateOne({ email: 'admin@picturesk.ai' }, { $set: { status: 'INACTIVE' } });
  const res = await login('admin@picturesk.ai', 'supersecret');
  assert.equal(res.status, 403);
  assert.equal((await res.json()).message, 'Admin user is inactive');
  await AdminUser.updateOne({ email: 'admin@picturesk.ai' }, { $set: { status: 'ACTIVE' } });
});

test('a tampered/garbage cookie is rejected as 401', async () => {
  const res = await fetch(`${base}/auth/me`, { headers: { Cookie: 'jwt=not.a.jwt' } });
  assert.equal(res.status, 401);
});
