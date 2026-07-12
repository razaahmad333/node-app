const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');

test('GET /health returns 200 OK', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.equal(response.text, 'OK');
});

test('GET / returns the congratulations page', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.match(response.text, /Congratulations, Ahmad Raza\./);
  assert.match(response.text, /Served by instance/);
});
