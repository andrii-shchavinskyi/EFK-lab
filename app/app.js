const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const { method, url: reqUrl, headers } = req;
  const parsedUrl = url.parse(reqUrl, true);

  const logEntry = {
    time: new Date().toISOString(),
    ip: headers['x-forwarded-for'] || req.socket.remoteAddress,
    method,
    path: parsedUrl.pathname,
    query: parsedUrl.query,
  };

  console.log(JSON.stringify(logEntry));

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'logged' }));
});

server.listen(3000, () => {
  console.log(`HTTP server running on port 3000`);
});
