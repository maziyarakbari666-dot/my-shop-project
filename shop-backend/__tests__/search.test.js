const request = require('supertest');
let server;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  server = require('../server');
});

afterAll(async () => {
  if (server && server.close) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/products/search without q returns ok', async () => {
  const res = await request(server).get('/api/products/search');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});

test('GET /api/products/search/suggest returns ok for empty query', async () => {
  const res = await request(server).get('/api/products/search/suggest');
  expect(res.status).toBe(200);
});



