const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Simple server is working!' }));
});

server.listen(3002, '0.0.0.0', () => {
  console.log('Simple server running on http://localhost:3002');
}); 