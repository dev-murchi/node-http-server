import { createServer } from 'node:http';
import { EventEmitter } from 'node:events';

const getRequest = new EventEmitter();
const postRequest = new EventEmitter();

export const handler = {
  get: (path, cb) => { getRequest.on(path, cb); },
  post: (path, cb) => { postRequest.on(path, cb); }
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
      case 'POST':
        const body = Buffer.concat(payload).toString();
        Object.assign(req, { body });
        if(postRequest.listenerCount(req.url) > 0) {
          postRequest.emit(req.url, req, res);
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