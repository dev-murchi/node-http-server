import { createServer } from 'node:http';
import { EventEmitter } from 'node:events';

const getRequest = new EventEmitter();

export async function getHandler (path, cb) {
  getRequest.on(path, cb);
}

function cannotPerformOperation(req, res, statusCode=500) {
  res.statusCode = statusCode;
  res.write(`Cannot ${req.method} ${req.url}`);
  res.end();
}

export const server = createServer();

server.on('error', (err) => { console.error({ err: err.stack }) });

server.on('request', (req, res) => {
  req.on('error', (err) => {
    console.error({ err: err.stack });
  });
  let payload = [];
  req.on('data', (chunk) => payload.push(chunk));
  req.on('end', () => {
    switch(req.method) {
      case 'GET':
        if(getRequest.listenerCount(req.url) > 0) {
          getRequest.emit(req.url, req, res);
        }
        else {
          cannotPerformOperation(req, res, 404);
          return;
        }
        break;
      default:
        cannotPerformOperation(req, res, 405);
        return;
    }
  })
});