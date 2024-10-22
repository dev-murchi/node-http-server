import { server, handler } from '../server.mjs';

handler.get('/home', (req, res) => {
  const response = '<h3>Home Page</h3>'
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(response, 'utf-8');
  res.end();

});

handler.get('*', (req, res) => {
  const response = '<h3>Page Not Found</h3>'
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.write(response, 'utf-8');
  res.end();

});

server.listen(3040, () => console.log('port: 3040'));
