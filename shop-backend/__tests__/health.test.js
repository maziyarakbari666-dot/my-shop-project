const request = require('supertest');
const mongoose = require('mongoose');
let server;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  server = require('../server');
});

afterAll(async () => {
  if (server && server.close) {
    await new Promise((resolve) => server.close(resolve));
  }
  try { await mongoose.connection.close(); } catch (_) {}
});

test('GET / should respond OK', async () => {
  const res = await request(server).get('/');
  expect(res.status).toBe(200);
  expect(res.text).toMatch(/Shop Backend is running/i);
});

test('GET /api/openapi.json should serve OpenAPI spec', async () => {
  const res = await request(server).get('/api/openapi.json');
  expect(res.status).toBe(200);
  expect(res.body.openapi).toMatch(/^3\./);
  expect(res.body.info).toBeDefined();
});


