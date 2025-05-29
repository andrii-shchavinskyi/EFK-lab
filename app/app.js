const http = require('http');
const url = require('url');
const client = require('prom-client');

// --- METRICS ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Кількість HTTP-запитів',
  labelNames: ['method', 'route']
});
register.registerMetric(httpRequestsTotal);

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Тривалість HTTP-запитів',
  labelNames: ['method', 'route'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Кількість активних HTTP-з’єднань'
});
register.registerMetric(activeConnections);

const requestPayloadSize = new client.Histogram({
  name: 'request_payload_bytes',
  help: 'Розмір вхідного запиту в байтах',
  buckets: [100, 500, 1000, 5000, 10000]
});
register.registerMetric(requestPayloadSize);

// --- SERVER ---
const server = http.createServer(async (req, res) => {
  activeConnections.inc();
  const start = Date.now();

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const ip = req.socket.remoteAddress;

  if (path === '/metrics') {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
    activeConnections.dec();
    return;
  }

  let payloadSize = 0;
  req.on('data', chunk => {
    payloadSize += chunk.length;
  });

  req.on('end', () => {
    requestPayloadSize.observe(payloadSize);
    httpRequestsTotal.labels(method, path).inc();
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(method, path).observe(duration);

    console.log(JSON.stringify({
      time: new Date().toISOString(),
      ip,
      method,
      path,
      query: parsedUrl.query,
      size: payloadSize
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'logged' }));
    activeConnections.dec();
  });
});

server.listen(3000, () => {
  console.log(`HTTP server with Prometheus metrics on port 3000`);
});
