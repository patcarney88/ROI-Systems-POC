const http = require('http');

const server = http.createServer((req, res) => {
  const url = req.url;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle favicon
  if (url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Root endpoint - HTML landing page
  if (url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ROI Systems POC - Local Development</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      font-size: 3em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .subtitle {
      font-size: 1.2em;
      opacity: 0.9;
      margin-bottom: 40px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 30px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.3s ease;
    }
    .card:hover {
      transform: translateY(-5px);
    }
    .card h2 {
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #00ff00;
      box-shadow: 0 0 10px #00ff00;
      animation: pulse 2s infinite;
    }
    .status.pending {
      background: #ffa500;
      box-shadow: 0 0 10px #ffa500;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .endpoint {
      background: rgba(0, 0, 0, 0.2);
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
    }
    .endpoint a {
      color: #fff;
      text-decoration: none;
      font-weight: bold;
    }
    .endpoint a:hover {
      text-decoration: underline;
    }
    .method {
      display: inline-block;
      background: #00ff00;
      color: #000;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: bold;
      margin-right: 10px;
    }
    ul {
      list-style: none;
      padding-left: 0;
    }
    li {
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    li:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 ROI Systems POC</h1>
    <p class="subtitle">Real Estate Document Management & Client Retention Platform</p>

    <div class="grid">
      <div class="card">
        <h2><span class="status"></span> Infrastructure Services</h2>
        <ul>
          <li>🗄️ PostgreSQL: <code>localhost:5432</code></li>
          <li>🔴 Redis: <code>localhost:6379</code></li>
          <li>🔍 Elasticsearch: <code>pending</code></li>
          <li>🐰 RabbitMQ: <code>pending</code></li>
        </ul>
      </div>

      <div class="card">
        <h2><span class="status pending"></span> Application Services</h2>
        <ul>
          <li>🔐 Auth Service: <code>development</code></li>
          <li>📄 Document Service: <code>development</code></li>
          <li>👥 User Service: <code>development</code></li>
          <li>🤖 ML Service: <code>development</code></li>
        </ul>
      </div>

      <div class="card">
        <h2>📋 API Endpoints</h2>
        <div class="endpoint">
          <span class="method">GET</span>
          <a href="/health">/health</a>
        </div>
        <div class="endpoint">
          <span class="method">GET</span>
          <a href="/api/status">/api/status</a>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>🛠️ Development Environment</h2>
      <ul>
        <li>Node.js: ${process.version}</li>
        <li>Platform: ${process.platform}</li>
        <li>Environment: development</li>
        <li>Port: ${process.env.PORT || 5050}</li>
      </ul>
    </div>
  </div>
</body>
</html>
    `);
    return;
  }

  // JSON endpoints
  res.setHeader('Content-Type', 'application/json');

  if (url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'ROI Systems POC',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'development',
      uptime: process.uptime(),
      services: {
        database: 'postgres:5432 (running)',
        cache: 'redis:6379 (running)',
        elasticsearch: 'pending',
        rabbitmq: 'pending'
      },
      message: 'Welcome to ROI Systems - Real Estate Document Management Platform'
    }, null, 2));
  } else if (url === '/api/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      infrastructure: {
        postgres: { status: 'running', port: 5432, health: 'healthy' },
        redis: { status: 'running', port: 6379, health: 'healthy' }
      },
      application: {
        authService: { status: 'development', port: 5050 },
        documentService: { status: 'development', port: 5051 },
        userService: { status: 'development', port: 5052 },
        mlService: { status: 'development', port: 8000 }
      },
      timestamp: new Date().toISOString()
    }, null, 2));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not Found',
      path: url,
      message: 'Available endpoints: /, /health, /api/status'
    }, null, 2));
  }
});

const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
  console.log(`\n🚀 ROI Systems POC Demo Server`);
  console.log(`📍 Running at: http://localhost:${PORT}`);
  console.log(`\n✅ Infrastructure Services:`);
  console.log(`   - PostgreSQL: localhost:5432`);
  console.log(`   - Redis: localhost:6379`);
  console.log(`\n📋 Available Endpoints:`);
  console.log(`   - GET http://localhost:${PORT}/health`);
  console.log(`   - GET http://localhost:${PORT}/api/status\n`);
});
