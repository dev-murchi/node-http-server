import { describe, it, beforeEach, afterEach, before, after } from 'node:test';
import { server, getHandler } from './server.mjs';
import http from 'node:http';
import assert from 'node:assert';
const PROTOCOL = 'http://';
const HOST_NAME = 'localhost';
const PORT = 3030;

beforeEach(async () => {
  await new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
      resolve();
    });
  });
});

afterEach(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

describe('Simple HTTP Server', () => {
  it('should respond with 404 to GET Request', {skip: false}, async () => {
    const response = await new Promise((resolve, reject) => {
      http.get(`${PROTOCOL}${HOST_NAME}:${PORT}/invalid-path`, {agent: false}, (res) => {
        res.on('error', (err) => reject({ err }));
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: Buffer.concat(data).toString()
          });
        });
      });
    });

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.body, 'Cannot GET /invalid-path');
  });

  it('should respond with 200 to GET Request', {skip: false}, async () => {
    await getHandler('/testing', (req, res) => {
      res.statusCode = 200;
      res.write('Testing...');
      res.end();
    });

    const response = await new Promise((resolve, reject) => {

      http.get(`${PROTOCOL}${HOST_NAME}:${PORT}/testing`, {agent: false}, (res) => {
        res.on('error', (err) => reject({ err }));
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: Buffer.concat(data).toString()
          });
        });
      });
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body, 'Testing...');
  });
});