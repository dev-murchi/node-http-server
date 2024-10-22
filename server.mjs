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

export const handler = {
  get: (path, cb) => { requestEmitters.get.on(path, cb); },
  post: (path, cb) => { requestEmitters.post.on(path, cb); },
  delete: (path, cb) => { requestEmitters.delete.on(path, cb); },
  put: (path, cb) => { requestEmitters.put.on(path, cb); },
  patch: (path, cb) => { requestEmitters.put.on(path, cb); },
}

function setDefaultResponses() {
  requestEmitters.get.on('*', (req, res) => { cannotPerformOperation(req, res) });
  requestEmitters.post.on('*', (req, res) => { cannotPerformOperation(req, res) });
  requestEmitters.delete.on('*', (req, res) => { cannotPerformOperation(req, res) });
  requestEmitters.put.on('*', (req, res) => { cannotPerformOperation(req, res) });
  requestEmitters.patch.on('*', (req, res) => { cannotPerformOperation(req, res) });
}

function cannotPerformOperation(req, res, statusCode = 404) {
  res.statusCode = statusCode;
  res.end(`Cannot ${req.method} ${req.url}`);
}

setDefaultResponses();

export const server = createServer();

server.on('error', (err) => { console.error({ err: err.stack }); });

server.on('close', () => {
  Object.keys(requestEmitters).forEach(key => {
    [...requestEmitters[key].eventNames()].forEach(event => {
      requestEmitters[key].removeAllListeners(event);
    })
  });
  setDefaultResponses();
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
    const url = new URL(`http://${process.env.HOST ?? 'localhost'}${req.url}`);

    res.on('error', (err) => console.err('Server response error: ', err.message));

    if (requestEmitters[method]) {
      const count = requestEmitters[method].listenerCount(url.pathname);
      const event = (count) ? url.pathname : '*';
      requestEmitters[method].emit(event, req, res);
    }
    else {
      cannotPerformOperation(req, res, 405);
    }
  });
});
