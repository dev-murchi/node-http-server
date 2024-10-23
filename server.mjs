import { createServer } from 'node:http';
import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import process from 'node:process';

const requestEmitters = {
  get: new EventEmitter(),
  post: new EventEmitter(),
  delete: new EventEmitter(),
  put: new EventEmitter(),
  patch: new EventEmitter(),
}

function addEventListener(emitter, path, cb) {
  if (emitter.listenerCount(path) === 0) {
    emitter.on(path, cb);
  }
}

export const handler = {
  get: (path, cb) => { addEventListener(requestEmitters.get, path, cb) },
  post: (path, cb) => { addEventListener(requestEmitters.post, path, cb) },
  delete: (path, cb) => { addEventListener(requestEmitters.delete, path, cb) },
  put: (path, cb) => { addEventListener(requestEmitters.put, path, cb) },
  patch: (path, cb) => { addEventListener(requestEmitters.patch, path, cb) },
}

function cannotPerformOperation(req, res, statusCode = 404) {
  res.statusCode = statusCode;
  res.end(`Cannot ${req.method} ${req.url}`);
}

export const server = createServer();

server.on('error', (err) => { console.error({ err: err.stack }); });

server.on('close', () => {
  console.log('Server is closed');
  Object.keys(requestEmitters).forEach(key => {
    [...requestEmitters[key].eventNames()].forEach(event => {
      requestEmitters[key].removeAllListeners(event);
    })
  });

});

server.on("checkExpectation", (req, res) => {
  res.statusCode = 417;
  res.end('Expectation Failed!');
});

server.on('clientError', (err, socket) => {
  socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
  socket.end(JSON.stringify({ err: 'Bad Request' }));
});

server.on('request', (req, res) => {
  req.on('error', (err) => { console.error({ err: err.stack }); });
  let payload = [];
  req.on('data', (chunk) => payload.push(chunk));
  req.on('end', () => {
    Object.assign(req, { body: Buffer.concat(payload).toString() });
    const method = req.method.toLowerCase();
    const address = server.address();
    const url = new URL(`http://${process.env.HOST ?? 'localhost'}:${address.port}${req.url}`);
    req.url = url;

    res.on('error', (err) => console.err('Server response error: ', err.message));

    if (requestEmitters[method]) {
      const count = requestEmitters[method].listenerCount(url.pathname);
      const event = (count) ? url.pathname : '*';
      if (event === '*' && (requestEmitters[method].listenerCount('*') === 0)) {
        cannotPerformOperation(req, res, 404);
      }
      else {
        requestEmitters[method].emit(event, req, res);
      }
    }
    else {
      cannotPerformOperation(req, res, 405);
    }
  });
});
