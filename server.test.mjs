import { describe, it, beforeEach, afterEach } from 'node:test';
import { server, handler } from './server.mjs';
import http from 'node:http';
import assert from 'node:assert';
import { Buffer } from 'node:buffer';

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
  it('should respond with 404 to GET Request', { skip: false }, async () => {
    const response = await new Promise((resolve, reject) => {
      http.get(`${PROTOCOL}${HOST_NAME}:${PORT}/invalid-path`, { agent: false }, (res) => {
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

  it('should respond with 200 to GET Request', { skip: false }, async () => {
    handler.get('/testing', (req, res) => {
      res.statusCode = 200;
      res.write('Testing...');
      res.end();
    });

    const response = await new Promise((resolve, reject) => {

      http.get(`${PROTOCOL}${HOST_NAME}:${PORT}/testing`, { agent: false }, (res) => {
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

  it('should respond with 404 to POST Request', { skip: false }, async () => {
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/invalid-path',
        method: 'POST',
        agent: false
      };

      const req = http.request(options, (res) => {
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

      req.on('error', (err) => reject({ err }));
      req.end('This is the body'); // Send body with the request
    });

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.body, 'Cannot POST /invalid-path');
  });

  it('should respond with 201 to POST Request', { skip: false }, async () => {

    handler.post('/post-request', (req, res) => {
      const body = req.body
      res.statusCode = 201;
      res.write(body);
      res.end();
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/post-request',
        method: 'POST',
        agent: false
      };

      const req = http.request(options, (res) => {
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

      req.on('error', (err) => reject({ err }));
      req.end('This is the body');
    });
    assert.strictEqual(response.statusCode, 201);
    assert.strictEqual(response.body, 'This is the body');
  });

});