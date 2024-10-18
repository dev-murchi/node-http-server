import { createServer } from 'node:http';

export const server = createServer();

server.on('error', (err) => { console.error({ err: err.stack }) });

server.on('request', (req, res) => {
  req.on('error', (err) => {
    console.error({ err: err.stack });
  });
  let payload = [];
  req.on('data', (chunk) => payload.push(chunk));
  req.on('end', () => {
    const { method } = req
    const body = JSON.stringify({ msg: Buffer.concat(payload).toString() });
    if(method === 'GET') {
      res.statusCode = 200;
      res.write(body);
      res.end();
    }
    else {
      res.statusCode = 405;
      res.end();
    }
  })
});