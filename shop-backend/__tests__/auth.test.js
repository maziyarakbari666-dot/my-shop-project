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

test('POST /api/auth/signup should validate input', async () => {
  const res = await request(server)
    .post('/api/auth/signup')
    .send({ name: 'a', email: 'bad', password: '1' });
  expect([400, 422]).toContain(res.status);
  expect(res.body.status).toBe('error');
});

test('POST /api/auth/send-otp rejects bad phone', async () => {
  const res = await request(server)
    .post('/api/auth/send-otp')
    .send({ phone: '09123' });
  expect([400, 422]).toContain(res.status);
});



