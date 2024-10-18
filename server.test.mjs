import { describe, it, beforeEach, afterEach } from 'node:test';
import { server } from './server.mjs';
import http from'node:http';
import assert from 'node:assert';

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
  it('should respond with 200 to GET Request', async () => {
    const response = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${PORT}/hello`, (res) => {
        res.on('error', (err) => reject({ err }));
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(data).toString();
          resolve({
            statusCode: res.statusCode,
            body: body
          });
        });
      });
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body, '{"msg":""}');
  });
});