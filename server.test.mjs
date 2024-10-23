import { describe, it, beforeEach, afterEach } from 'node:test';
import { server, handler } from './server.mjs';
import http from 'node:http';
import assert from 'node:assert';
import { Buffer } from 'node:buffer';
const PORT = 3030;

const makeRequest = (options, payload) => {
  return new Promise((resolve, reject) => {
    if (options) {
      const req = http.request(options);
      req.on('error', (err) => reject({ error: err }));
      req.on('response', (res) => {
        let buf = [];
        res.on('error', (err) => reject({ err }));
        res.on('data', (chunk) => buf.push(chunk));
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          body: Buffer.concat(buf).toString()
        }));

      });
      if (payload) {
        req.write(payload);
      }
      req.end();
    }
    else {
      reject({ err: 'Missing request paramaters!' });
    }
  });
}


describe('Simple HTTP Server', () => {

  beforeEach(async () => {
    await new Promise((resolve) => {
      server.listen(PORT, 'localhost', () => {
        resolve();
      });

    });
  });

  afterEach(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('should respond with 404 to GET Request', { skip: false }, async () => {
    const options = {
      method: 'GET',
      hostname: 'localhost',
      port: PORT,
      path: '/test'
    };
    const response = await makeRequest(options);
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.body, 'Cannot GET /test');
  });

  it('should respond with 200 to GET Request', { skip: false }, async () => {
    handler.get('/test', (req, res) => {
      res.statusCode = 200;
      res.write('Testing...');
      res.end();
    });

    const options = {
      method: 'GET',
      hostname: 'localhost',
      port: PORT,
      path: '/test'
    };

    const response = await makeRequest(options);
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body, 'Testing...');
  });

  it('should respond with 404 to POST Request', { skip: false }, async () => {
    const options = {
      method: 'POST',
      hostname: 'localhost',
      port: PORT,
      path: '/test'
    };
    const response = await makeRequest(options, 'Test message...');
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.body, 'Cannot POST /test');
  });

  it('should respond with 201 to POST Request', { skip: false }, async () => {

    handler.post('/test', (req, res) => {
      const body = req.body
      res.statusCode = 201;
      res.write(body);
      res.end();
    });

    const options = {
      method: 'POST',
      hostname: 'localhost',
      port: PORT,
      path: '/test'
    };
    const response = await makeRequest(options, 'Post message...');
    assert.strictEqual(response.statusCode, 201);
    assert.strictEqual(response.body, 'Post message...');
  });

  it('should respond with 400 to POST Request when client error occured', { skip: false }, async () => {
    const data = 'Test data';
    const options = {
      method: 'POST',
      hostname: 'localhost',
      port: PORT,
      path: '/test',
      headers: {
        'Conent-Type': 'text/plain',
        'Content-Length': (Buffer.byteLength(data) - 1)
      }
    };

    const response = await makeRequest(options, 'Test data');
    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.body, '{"err":"Bad Request"}');
  });

  it('should respond 417 to request when request contains "Expect" header rather than "100-continue"', { skip: false }, async () => {
    const data = 'data';
    const options = {
      method: 'POST',
      hostname: 'localhost',
      port: PORT,
      path: '/test',
      headers: {
        'Conent-Type': 'text/plain',
        'Expect': 'meow'
      }
    };
    const response = await makeRequest(options, data);
    assert.strictEqual(response.statusCode, 417);
    assert.strictEqual(response.body, 'Expectation Failed!');
  });

  it('should respond with 404 to DELETE Request', { skip: false }, async () => {
    const options = {
      method: "DELETE",
      hostname: "localhost",
      port: PORT,
      path: "/test/1",
    };
    const response = await makeRequest(options);
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.body, "Cannot DELETE /test/1");
  });

  it('should respond with 404 to PUT Request', { skip: false }, async () => {
    const options = {
      method: 'PUT',
      hostname: 'localhost',
      path: '/test/1',
      port: PORT
    };
    const payload = {
      name: 'john',
      lastname: 'doe',
      mail: 'john.doe@email.com'
    };
    const response = await makeRequest(options, JSON.stringify(payload));
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.body, 'Cannot PUT /test/1');
  });

  it('should respond with 404 to PATCH Request', { skip: false }, async () => {
    const options = {
      method: 'PATCH',
      hostname: 'localhost',
      path: '/test/1',
      port: PORT
    };
    const payload = {
      mail: 'john.doe@email.com'
    };
    const response = await makeRequest(options, JSON.stringify(payload));
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.body, 'Cannot PATCH /test/1');
  });

  it('should respond with first request handler for requested endpoint of GET Request ', { skip: false }, async () => {
    handler.get('/test', (req, res) => {
      res.statusCode = 200;
      res.write('First Handler');
      res.end();
    });

    handler.get('/test', (req, res) => {
      res.statusCode = 200;
      res.write('Second Handler');
      res.end();
    });

    const response = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/test',
      method: 'GET'
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body, 'First Handler');
  });

  it('should respond with first request handler for requested endpoint of POST Request ', { skip: false }, async () => {
    handler.post('/test', (req, res) => {
      res.statusCode = 201;
      res.write('First Handler');
      res.end();
    });

    handler.post('/test', (req, res) => {
      res.statusCode = 201;
      res.write('Second Handler');
      res.end();
    });

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/test',
      method: 'POST'
    };

    const response = await makeRequest(options, 'Post message...');

    assert.strictEqual(response.statusCode, 201);
    assert.strictEqual(response.body, 'First Handler');
  });

  it('should respond with first request handler for requested endpoint of DELETE Request ', { skip: false }, async () => {
    handler.delete('/test/1', (req, res) => {
      res.statusCode = 200;
      res.write('First Handler');
      res.end();
    });

    handler.delete('/test/1', (req, res) => {
      res.statusCode = 200;
      res.write('Second Handler');
      res.end();
    });

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/test/1',
      method: 'DELETE'
    };

    const response = await makeRequest(options);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body, 'First Handler');
  });

  it('should respond with first request handler for requested endpoint of PUT Request ', { skip: false }, async () => {
    handler.put('/test/1', (req, res) => {
      res.statusCode = 201;
      res.write('First Handler');
      res.end();
    });

    handler.put('/test/1', (req, res) => {
      res.statusCode = 201;
      res.write('Second Handler');
      res.end();
    });

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/test/1',
      method: 'PUT'
    };

    const response = await makeRequest(options, 'Put message...');

    assert.strictEqual(response.statusCode, 201);
    assert.strictEqual(response.body, 'First Handler');
  });

  it('should respond with first request handler for requested endpoint of PATCH Request ', { skip: false }, async () => {
    handler.patch('/test/1', (req, res) => {
      res.statusCode = 200;
      res.write('First Handler');
      res.end();
    });

    handler.patch('/test/1', (req, res) => {
      res.statusCode = 200;
      res.write('Second Handler');
      res.end();
    });

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/test/1',
      method: 'PATCH'
    };

    const response = await makeRequest(options, 'Patch message...');

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body, 'First Handler');
  });
});
